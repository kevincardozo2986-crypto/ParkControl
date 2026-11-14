
const { query } = require("../config/database");

const columnas = "id, numero, tipo, estado, ubicacion";

// Listar todos los espacios
const todos = async () => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.espacios
     ORDER BY id`
  );
  return resultado.rows;
};

// Listar espacios disponibles
const disponibles = async () => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.espacios
     WHERE estado = 'disponible'
     ORDER BY id`
  );
  return resultado.rows;
};

// Buscar espacio por ID
const porId = async (id) => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.espacios
     WHERE id = $1`,
    [id]
  );
  return resultado.rows[0] || null;
};

// Crear espacio
const crear = async (d) => {
  try {
    const resultado = await query(
      `INSERT INTO public.espacios
       (numero, tipo, estado, ubicacion)
       VALUES ($1, $2, 'disponible', $3)
       RETURNING ${columnas}`,
      [d.numero, d.tipo, d.ubicacion ?? null]
    );
    return { data: resultado.rows[0] };
  } catch (error) {
    if (error.code === "23505") {
      return {
        error: "El número de espacio ya existe",
        status: 409,
      };
    }
    throw error;
  }
};

// Actualizar espacio
const actualizar = async (id, d) => {
  const actual = await porId(id);

  if (!actual) {
    return {
      error: "Espacio no encontrado",
      status: 404,
    };
  }

  if (actual.estado === "ocupado" && d.tipo !== actual.tipo) {
    return {
      error: "No se puede cambiar el tipo de un espacio ocupado",
      status: 409,
    };
  }

  try {
    const resultado = await query(
      `UPDATE public.espacios
       SET numero = $1,
           tipo = $2,
           ubicacion = $3
       WHERE id = $4
       RETURNING ${columnas}`,
      [d.numero, d.tipo, d.ubicacion ?? null, id]
    );

    return { data: resultado.rows[0] };
  } catch (error) {
    if (error.code === "23505") {
      return {
        error: "El número de espacio ya existe",
        status: 409,
      };
    }
    throw error;
  }
};

// Actualizar parcialmente
const parcial = async (id, d) => {
  const actual = await porId(id);

  if (!actual) {
    return {
      error: "Espacio no encontrado",
      status: 404,
    };
  }

  return actualizar(id, { ...actual, ...d });
};

// Eliminar espacio
const eliminar = async (id) => {
  const actual = await porId(id);

  if (!actual) {
    return {
      error: "Espacio no encontrado",
      status: 404,
    };
  }

  const estancias = await query(
    `SELECT 1 FROM public.estancias
     WHERE espacio_id = $1 LIMIT 1`,
    [id]
  );

  if (estancias.rowCount > 0) {
    return {
      error: "No se puede eliminar el espacio porque tiene estancias asociadas",
      status: 409,
    };
  }

  try {
    const resultado = await query(
      `DELETE FROM public.espacios
       WHERE id = $1
       RETURNING ${columnas}`,
      [id]
    );

    return resultado.rows[0]
      ? { data: resultado.rows[0] }
      : { error: "Espacio no encontrado", status: 404 };
  } catch (error) {
    if (error.code === "23503") {
      return {
        error: "No se puede eliminar el espacio porque tiene estancias asociadas",
        status: 409,
      };
    }
    throw error;
  }
};

module.exports = {
  todos,
  disponibles,
  porId,
  crear,
  actualizar,
  parcial,
  eliminar,
};
