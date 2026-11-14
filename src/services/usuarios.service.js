const { query, pool } = require("../config/database");

const {
  generarPasswordHash,
  verificarPassword,
} = require("../utils/password.util");

// ========================================
// Roles del sistema
// ========================================
const ROLES = ["administrador", "operador"];

// Columnas de usuario con el rol asociado
const columnas = `
  u.id,
  u.nombre,
  u.email,
  u.password_hash AS "passwordHash",
  r.nombre AS rol,
  u.activo,
  u.version_sesion AS "versionSesion"
`;

// Datos que se pueden devolver públicamente
const datosPublicos = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  activo: usuario.activo,
});

// ========================================
// Consultas
// ========================================
const obtenerUsuarioPorEmail = async (email) => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.usuarios u
     INNER JOIN public.roles r ON r.id = u.rol_id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [String(email).trim()],
  );

  return resultado.rows[0] || null;
};

const obtenerUsuarioPorId = async (id) => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.usuarios u
     INNER JOIN public.roles r ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id],
  );

  return resultado.rows[0] || null;
};

// ========================================
// Inserción controlada
// ========================================
const insertarUsuario = async ({ nombre, email, password, rol }) => {
  const passwordHash = await generarPasswordHash(password);

  try {
    const resultado = await query(
      `INSERT INTO public.usuarios
       (nombre, email, password_hash, rol_id, activo)
       SELECT $1, LOWER($2), $3, r.id, TRUE
       FROM public.roles r
       WHERE r.nombre = $4 AND r.activo = TRUE
       RETURNING id`,
      [nombre.trim(), email.trim(), passwordHash, rol],
    );

    if (!resultado.rowCount) {
      const error = new Error("El rol solicitado no existe o está inactivo");
      error.status = 400;
      throw error;
    }

    return datosPublicos(await obtenerUsuarioPorId(resultado.rows[0].id));
  } catch (error) {
    if (error.code === "23505") {
      const conflicto = new Error("El correo ya se encuentra registrado");
      conflicto.status = 409;
      throw conflicto;
    }

    throw error;
  }
};

// Creación administrativa
const crearUsuarioAdministrativo = ({ nombre, email, password, rol }) => {
  if (!ROLES.includes(rol)) {
    const error = new Error("Rol no permitido para esta operación");
    error.status = 400;
    throw error;
  }

  return insertarUsuario({ nombre, email, password, rol });
};

// ========================================
// Verificar credenciales
// ========================================
const verificarCredenciales = async (email, password) => {
  const usuario = await obtenerUsuarioPorEmail(email);

  if (!usuario || !usuario.passwordHash) {
    return null;
  }

  const valida = await verificarPassword(password, usuario.passwordHash);

  return valida ? usuario : null;
};

// ========================================
// Cambiar contraseña propia
// Incrementa version_sesion: revoca los JWT anteriores.
// ========================================
const cambiarPasswordPropio = async (usuarioId, passwordActual, passwordNueva) => {
  const usuario = await obtenerUsuarioPorId(usuarioId);

  if (!usuario || !usuario.activo || !usuario.passwordHash) {
    return { estado: "NO_AUTORIZADO" };
  }

  if (!(await verificarPassword(passwordActual, usuario.passwordHash))) {
    return { estado: "CLAVE_INCORRECTA" };
  }

  if (await verificarPassword(passwordNueva, usuario.passwordHash)) {
    return { estado: "MISMA_CLAVE" };
  }

  const nuevoHash = await generarPasswordHash(passwordNueva);

  // password_hash = $3 evita pisar un cambio concurrente
  const resultado = await query(
    `UPDATE public.usuarios
     SET password_hash = $1, version_sesion = version_sesion + 1
     WHERE id = $2 AND activo = TRUE AND password_hash = $3
     RETURNING id`,
    [nuevoHash, usuarioId, usuario.passwordHash],
  );

  return resultado.rowCount === 1 ? { estado: "OK" } : { estado: "CONFLICTO" };
};

// ========================================
// Bootstrap administrativo
// Solo se ejecuta mediante: npm run seed:admin
// 1. No modifica administradores existentes.
// 2. No convierte otras cuentas en administrador.
// 3. Transacción + advisory lock contra ejecuciones simultáneas.
// ========================================
const crearAdministradorInicial = async () => {
  const nombre = process.env.ADMIN_NOMBRE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    throw new Error("Faltan las variables ADMIN_NOMBRE, ADMIN_EMAIL o ADMIN_PASSWORD");
  }

  if (password.length < 12) {
    throw new Error("La contraseña inicial debe tener al menos 12 caracteres");
  }

  const passwordHash = await generarPasswordHash(password);
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    await cliente.query("SELECT pg_advisory_xact_lock($1, $2)", [7505, 1]);

    const administradores = await cliente.query(
      `SELECT u.id
       FROM public.usuarios u
       INNER JOIN public.roles r ON r.id = u.rol_id
       WHERE r.nombre = 'administrador'
       LIMIT 1`,
    );

    if (administradores.rowCount) {
      await cliente.query("COMMIT");
      return { creado: false, motivo: "ADMINISTRADOR_EXISTENTE" };
    }

    const correo = await cliente.query(
      "SELECT id FROM public.usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );

    if (correo.rowCount) {
      throw new Error(
        "El correo de bootstrap ya pertenece a otra cuenta. No se elevarán privilegios.",
      );
    }

    const rol = await cliente.query(
      "SELECT id FROM public.roles WHERE nombre = 'administrador' AND activo = TRUE",
    );

    if (!rol.rowCount) {
      throw new Error("No existe un rol administrador activo");
    }

    const resultado = await cliente.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, nombre, email, activo`,
      [nombre, email, passwordHash, rol.rows[0].id],
    );

    await cliente.query("COMMIT");

    return {
      creado: true,
      motivo: "ADMINISTRADOR_CREADO",
      usuario: resultado.rows[0],
    };
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
};

module.exports = {
  ROLES,
  datosPublicos,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuarioAdministrativo,
  verificarCredenciales,
  cambiarPasswordPropio,
  crearAdministradorInicial,
};
