
const { query } = require("../config/database");

const columnas = "id, nombre, documento, telefono, correo";

// Listar todos los conductores
const todos = async () => {
  const resultado = await query(
    `SELECT ${columnas} FROM public.conductores ORDER BY id`
  );
  return resultado.rows;
};

// Buscar conductor por ID
const porId = async (id) => {
  const resultado = await query(
    `SELECT ${columnas} FROM public.conductores WHERE id = $1`,
    [id]
  );
  return resultado.rows[0] || null;
};

// Buscar conductor por documento
const porDocumento = async (documento) => {
  const resultado = await query(
    `SELECT ${columnas} FROM public.conductores WHERE documento = $1`,
    [documento]
  );
  return resultado.rows[0] || null;
};

// Crear conductor
const crear = async (d) => {
  const resultado = await query(
    `INSERT INTO public.conductores
      (nombre, documento, telefono, correo)
     VALUES ($1, $2, $3, $4)
     RETURNING ${columnas}`,
    [d.nombre, d.documento, d.telefono ?? null, d.correo ?? null]
  );
  return resultado.rows[0];
};

// Actualizar conductor completamente
const actualizar = async (id, d) => {
  const resultado = await query(
    `UPDATE public.conductores
     SET nombre = $1,
         documento = $2,
         telefono = $3,
         correo = $4
     WHERE id = $5
     RETURNING ${columnas}`,
    [d.nombre, d.documento, d.telefono ?? null, d.correo ?? null, id]
  );
  return resultado.rows[0] || null;
};

// Actualizar campos específicos
const parcial = async (id, d) => {
  const permitidos = ["nombre", "documento", "telefono", "correo"];
  const campos = permitidos.filter(
    (campo) => d[campo] !== undefined
  );

  if (!campos.length) {
    return null;
  }

  const asignaciones = campos.map(
    (campo, i) => `${campo} = $${i + 1}`
  );

  const valores = campos.map((campo) => d[campo]);
  valores.push(id);

  const resultado = await query(
    `UPDATE public.conductores
     SET ${asignaciones.join(", ")}
     WHERE id = $${valores.length}
     RETURNING ${columnas}`,
    valores
  );

  return resultado.rows[0] || null;
};

// Eliminar conductor
const eliminar = async (id) => {
  const conductor = await porId(id);

  if (!conductor) {
    return {
      error: "Conductor no encontrado",
      status: 404,
    };
  }

  const relacionados = await query(
    `SELECT 1 FROM public.vehiculos
     WHERE conductor_id = $1 LIMIT 1`,
    [id]
  );

  if (relacionados.rowCount > 0) {
    return {
      error: "No se puede eliminar el conductor porque tiene vehículos asociados",
      status: 409,
    };
  }

  try {
    const resultado = await query(
      `DELETE FROM public.conductores
       WHERE id = $1
       RETURNING ${columnas}`,
      [id]
    );

    return resultado.rows[0]
      ? { data: resultado.rows[0] }
      : { error: "Conductor no encontrado", status: 404 };
  } catch (error) {
    if (error.code === "23503") {
      return {
        error: "No se puede eliminar el conductor porque tiene vehículos asociados",
        status: 409,
      };
    }
    throw error;
  }
};

module.exports = {
  todos,
  porId,
  porDocumento,
  crear,
  actualizar,
  parcial,
  eliminar,
};
