
const { query } = require("../config/database");

const columnas = `
  id, placa, tipo, marca, color,
  conductor_id AS "conductorId"
`;

// Listar todos los vehículos
const todos = async () => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.vehiculos
     ORDER BY id`
  );

  return resultado.rows;
};

// Buscar vehículo por ID
const porId = async (id) => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.vehiculos
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
};

// Buscar vehículo por placa
const porPlaca = async (placa) => {
  const resultado = await query(
    `SELECT ${columnas}
     FROM public.vehiculos
     WHERE placa = UPPER($1)`,
    [placa]
  );

  return resultado.rows[0] || null;
};

// Crear vehículo
const crear = async (d) => {
  const conductor = await query(
    `SELECT id FROM public.conductores
     WHERE id = $1`,
    [d.conductorId]
  );

  if (!conductor.rowCount) {
    return {
      error: "El conductor no existe",
      status: 400,
    };
  }

  try {
    const resultado = await query(
      `INSERT INTO public.vehiculos
       (placa, tipo, marca, color, conductor_id)
       VALUES (UPPER($1), $2, $3, $4, $5)
       RETURNING ${columnas}`,
      [
        d.placa,
        d.tipo,
        d.marca ?? null,
        d.color ?? null,
        d.conductorId,
      ]
    );

    return { data: resultado.rows[0] };
  } catch (error) {
    if (error.code === "23505") {
      return {
        error: "La placa ya está registrada",
        status: 409,
      };
    }
    if (error.code === "23503") {
      return {
        error: "El conductor no existe",
        status: 400,
      };
    }
    throw error;
  }
};

// Actualizar vehículo
const actualizar = async (id, d) => {
  const actual = await porId(id);

  if (!actual) {
    return {
      error: "Vehículo no encontrado",
      status: 404,
    };
  }

  const conductor = await query(
    `SELECT id FROM public.conductores
     WHERE id = $1`,
    [d.conductorId]
  );

  if (!conductor.rowCount) {
    return {
      error: "El conductor no existe",
      status: 400,
    };
  }

  try {
    const resultado = await query(
      `UPDATE public.vehiculos
       SET placa = UPPER($1),
           tipo = $2,
           marca = $3,
           color = $4,
           conductor_id = $5
       WHERE id = $6
       RETURNING ${columnas}`,
      [
        d.placa,
        d.tipo,
        d.marca ?? null,
        d.color ?? null,
        d.conductorId,
        id,
      ]
    );

    return { data: resultado.rows[0] };
  } catch (error) {
    if (error.code === "23505") {
      return {
        error: "La placa ya está registrada",
        status: 409,
      };
    }
    if (error.code === "23503") {
      return {
        error: "El conductor no existe",
        status: 400,
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
      error: "Vehículo no encontrado",
      status: 404,
    };
  }

  return actualizar(id, { ...actual, ...d });
};

// Eliminar vehículo
const eliminar = async (id) => {
  const actual = await porId(id);

  if (!actual) {
    return {
      error: "Vehículo no encontrado",
      status: 404,
    };
  }

  const estancias = await query(
    `SELECT 1 FROM public.estancias
     WHERE vehiculo_id = $1 LIMIT 1`,
    [id]
  );

  if (estancias.rowCount) {
    return {
      error: "No se puede eliminar el vehículo porque tiene estancias asociadas",
      status: 409,
    };
  }

  try {
    const resultado = await query(
      `DELETE FROM public.vehiculos
       WHERE id = $1
       RETURNING ${columnas}`,
      [id]
    );

    return resultado.rows[0]
      ? { data: resultado.rows[0] }
      : { error: "Vehículo no encontrado", status: 404 };
  } catch (error) {
    if (error.code === "23503") {
      return {
        error: "No se puede eliminar el vehículo porque tiene estancias asociadas",
        status: 409,
      };
    }
    throw error;
  }
};

module.exports = {
  todos,
  porId,
  porPlaca,
  crear,
  actualizar,
  parcial,
  eliminar,
};
