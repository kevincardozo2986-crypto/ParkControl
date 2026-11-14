const { matchedData } = require("express-validator");

const { query, pool } = require("../config/database");
const usuariosService = require("../services/usuarios.service");

const POR_PAGINA = 20;

// ========================================
// Listado administrativo paginado y parametrizado
// ========================================
exports.listar = async (req, res) => {
  const { q = "", rol = "", activo = "", pagina = 1 } = matchedData(req, {
    locations: ["query"],
  });

  const parametros = [
    `%${q.toLowerCase()}%`,
    rol || null,
    activo === "" ? null : activo === "true",
  ];

  const filtro = `
    FROM public.usuarios u
    JOIN public.roles r ON r.id = u.rol_id
    WHERE (LOWER(u.nombre) LIKE $1 OR LOWER(u.email) LIKE $1)
      AND ($2::text IS NULL OR r.nombre = $2)
      AND ($3::boolean IS NULL OR u.activo = $3)`;

  const total = await query(`SELECT COUNT(*)::int AS total ${filtro}`, parametros);
  const resultado = await query(
    `SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.activo,
            u.fecha_registro AS "fechaRegistro"
     ${filtro}
     ORDER BY u.id DESC
     LIMIT ${POR_PAGINA} OFFSET $4`,
    [...parametros, (pagina - 1) * POR_PAGINA],
  );

  res.set("Cache-Control", "no-store");

  return res.json({
    usuarios: resultado.rows,
    total: total.rows[0].total,
    pagina,
    porPagina: POR_PAGINA,
  });
};

// ========================================
// Crear cuenta (administrador u operador)
// ========================================
exports.crear = async (req, res) => {
  const datos = matchedData(req, { locations: ["body"] });
  const usuario = await usuariosService.crearUsuarioAdministrativo(datos);

  return res.status(201).json({
    mensaje: "Usuario creado correctamente",
    usuario,
  });
};

// ========================================
// Editar nombre y correo (no cambia rol ni contraseña)
// ========================================
exports.actualizar = async (req, res) => {
  const { id } = matchedData(req, { locations: ["params"] });
  const { nombre, email } = matchedData(req, { locations: ["body"] });

  try {
    const resultado = await query(
      `UPDATE public.usuarios
       SET nombre = $1, email = LOWER($2)
       WHERE id = $3
       RETURNING id, nombre, email, activo`,
      [nombre, email, id],
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.set("Cache-Control", "no-store");
    return res.json({ mensaje: "Usuario actualizado", usuario: resultado.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ mensaje: "El correo ya está registrado" });
    }
    throw error;
  }
};

// ========================================
// Activar / desactivar
// Bloquea la autodesactivación y la del último administrador.
// Desactivar incrementa version_sesion (revoca JWT).
// ========================================
exports.cambiarEstado = async (req, res) => {
  const { id } = matchedData(req, { locations: ["params"] });
  const { activo } = matchedData(req, { locations: ["body"] });

  if (!activo && String(req.usuario.id) === String(id)) {
    return res.status(409).json({ mensaje: "No puede desactivar su propia cuenta" });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    await cliente.query("SELECT pg_advisory_xact_lock($1, $2)", [1252, 1]);

    const actual = await cliente.query(
      `SELECT u.id, u.activo, r.nombre AS rol
       FROM public.usuarios u
       JOIN public.roles r ON r.id = u.rol_id
       WHERE u.id = $1
       FOR UPDATE OF u`,
      [id],
    );

    if (!actual.rowCount) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const usuario = actual.rows[0];

    if (!activo && usuario.rol === "administrador" && usuario.activo) {
      const conteo = await cliente.query(
        `SELECT COUNT(*)::int AS total
         FROM public.usuarios u
         JOIN public.roles r ON r.id = u.rol_id
         WHERE r.nombre = 'administrador' AND u.activo = TRUE`,
      );

      if (conteo.rows[0].total <= 1) {
        await cliente.query("ROLLBACK");
        return res.status(409).json({
          mensaje: "No se puede desactivar al último administrador activo",
        });
      }
    }

    const resultado = await cliente.query(
      `UPDATE public.usuarios
       SET activo = $1,
           version_sesion = version_sesion +
             CASE WHEN activo IS DISTINCT FROM $1 THEN 1 ELSE 0 END
       WHERE id = $2
       RETURNING id, nombre, email, activo`,
      [activo, id],
    );

    await cliente.query("COMMIT");

    res.set("Cache-Control", "no-store");
    return res.json({ mensaje: "Estado actualizado", usuario: resultado.rows[0] });
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
};

// ========================================
// Búsqueda mínima para recuperación administrativa
// ========================================
exports.buscarRecuperacion = async (req, res) => {
  const { q } = matchedData(req, { locations: ["query"] });

  const resultado = await query(
    `SELECT u.id, u.nombre, u.email, r.nombre AS rol
     FROM public.usuarios u
     JOIN public.roles r ON r.id = u.rol_id
     WHERE u.activo = TRUE
       AND (POSITION($1 IN LOWER(u.nombre)) > 0 OR POSITION($1 IN LOWER(u.email)) > 0)
     ORDER BY u.nombre, u.id
     LIMIT 20`,
    [q.toLowerCase()],
  );

  res.set("Cache-Control", "no-store");
  return res.json({ usuarios: resultado.rows });
};


// ========================================
// Eliminar cuenta
// Bloquea la autoeliminación y la del último administrador activo.
// Los tokens de recuperación y códigos del usuario se borran en cascada;
// los tokens que esta cuenta emitió como administrador también se eliminan.
// ========================================
exports.eliminar = async (req, res) => {
  const { id } = matchedData(req, { locations: ["params"] });

  if (String(req.usuario.id) === String(id)) {
    return res.status(409).json({ mensaje: "No puede eliminar su propia cuenta" });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    await cliente.query("SELECT pg_advisory_xact_lock($1, $2)", [1252, 1]);

    const actual = await cliente.query(
      `SELECT u.id, u.nombre, u.email, u.activo, r.nombre AS rol
       FROM public.usuarios u
       JOIN public.roles r ON r.id = u.rol_id
       WHERE u.id = $1
       FOR UPDATE OF u`,
      [id],
    );

    if (!actual.rowCount) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const usuario = actual.rows[0];

    if (usuario.rol === "administrador" && usuario.activo) {
      const conteo = await cliente.query(
        `SELECT COUNT(*)::int AS total
         FROM public.usuarios u
         JOIN public.roles r ON r.id = u.rol_id
         WHERE r.nombre = 'administrador' AND u.activo = TRUE`,
      );

      if (conteo.rows[0].total <= 1) {
        await cliente.query("ROLLBACK");
        return res.status(409).json({ mensaje: "No se puede eliminar al último administrador activo" });
      }
    }

    await cliente.query("DELETE FROM public.password_reset_tokens WHERE administrador_id = $1", [id]);
    await cliente.query("DELETE FROM public.usuarios WHERE id = $1", [id]);
    await cliente.query("COMMIT");

    res.set("Cache-Control", "no-store");
    return res.json({
      mensaje: "Usuario eliminado",
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
};
