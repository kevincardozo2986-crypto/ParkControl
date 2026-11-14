const { pool, query } = require("../config/database");

const columnas = `
  id,
  vehiculo_id AS "vehiculoId",
  espacio_id AS "espacioId",
  fecha_hora_entrada AS "fechaHoraEntrada",
  fecha_hora_salida AS "fechaHoraSalida",
  estado,
  tiempo_permanencia AS "tiempoPermanencia"
`;

// Consulta con datos relacionados para listados y frontend
const seleccionDetalle = `
  SELECT
    e.id,
    e.vehiculo_id AS "vehiculoId",
    e.espacio_id AS "espacioId",
    e.fecha_hora_entrada AS "fechaHoraEntrada",
    e.fecha_hora_salida AS "fechaHoraSalida",
    e.estado,
    e.tiempo_permanencia AS "tiempoPermanencia",
    v.placa,
    v.tipo AS "tipoVehiculo",
    v.conductor_id AS "conductorId",
    es.numero AS "espacioNumero",
    (p.id IS NOT NULL) AS pagada
  FROM public.estancias e
  JOIN public.vehiculos v ON v.id = e.vehiculo_id
  JOIN public.espacios es ON es.id = e.espacio_id
  LEFT JOIN public.pagos p ON p.estancia_id = e.id
`;

// Listar todas las estancias
const todos = async () => {
  const resultado = await query(
    `${seleccionDetalle} ORDER BY e.id DESC`
  );

  return resultado.rows;
};

// Listar estancias activas
const activas = async () => {
  const resultado = await query(
    `${seleccionDetalle} WHERE e.estado = 'activa' ORDER BY e.id DESC`
  );

  return resultado.rows;
};

// Buscar estancia por ID
const porId = async (id) => {
  const resultado = await query(
    `${seleccionDetalle} WHERE e.id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
};

// Registrar entrada de vehículo
const entrada = async ({ vehiculoId, espacioId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vehiculo = await client.query(
      `SELECT id, tipo
       FROM public.vehiculos
       WHERE id = $1`,
      [vehiculoId]
    );

    if (!vehiculo.rowCount) {
      await client.query("ROLLBACK");
      return {
        error: "El vehículo no existe",
        status: 400,
      };
    }

    // Bloquear el espacio mientras se registra la entrada
    const espacio = await client.query(
      `SELECT id, tipo, estado
       FROM public.espacios
       WHERE id = $1
       FOR UPDATE`,
      [espacioId]
    );

    if (!espacio.rowCount) {
      await client.query("ROLLBACK");
      return {
        error: "El espacio no existe",
        status: 400,
      };
    }

    if (espacio.rows[0].estado !== "disponible") {
      await client.query("ROLLBACK");
      return {
        error: "El espacio está ocupado",
        status: 409,
      };
    }

    if (vehiculo.rows[0].tipo !== espacio.rows[0].tipo) {
      await client.query("ROLLBACK");
      return {
        error: "El tipo de espacio no es compatible con el vehículo",
        status: 409,
      };
    }

    const activa = await client.query(
      `SELECT id
       FROM public.estancias
       WHERE vehiculo_id = $1
         AND estado = 'activa'
       LIMIT 1`,
      [vehiculoId]
    );

    if (activa.rowCount) {
      await client.query("ROLLBACK");
      return {
        error: "El vehículo ya tiene una estancia activa",
        status: 409,
      };
    }

    const resultado = await client.query(
      `INSERT INTO public.estancias
       (vehiculo_id, espacio_id, estado)
       VALUES ($1, $2, 'activa')
       RETURNING ${columnas}`,
      [vehiculoId, espacioId]
    );

    await client.query(
      `UPDATE public.espacios
       SET estado = 'ocupado'
       WHERE id = $1`,
      [espacioId]
    );

    await client.query("COMMIT");

    return { data: resultado.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return {
        error: "El vehículo o el espacio ya tiene una estancia activa",
        status: 409,
      };
    }

    throw error;
  } finally {
    client.release();
  }
};

// Registrar salida de vehículo
const salida = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const estancia = await client.query(
      `SELECT id, espacio_id, estado
       FROM public.estancias
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (!estancia.rowCount) {
      await client.query("ROLLBACK");
      return {
        error: "Estancia no encontrada",
        status: 404,
      };
    }

    if (estancia.rows[0].estado !== "activa") {
      await client.query("ROLLBACK");
      return {
        error: "La estancia no está activa",
        status: 409,
      };
    }

    const resultado = await client.query(
      `UPDATE public.estancias
       SET fecha_hora_salida = NOW(),
           tiempo_permanencia = GREATEST(
             1,
             CEIL(
               EXTRACT(EPOCH FROM (
                 NOW() - fecha_hora_entrada
               )) / 3600
             )::INTEGER
           ),
           estado = 'finalizada'
       WHERE id = $1
       RETURNING ${columnas}`,
      [id]
    );

    await client.query(
      `UPDATE public.espacios
       SET estado = 'disponible'
       WHERE id = $1`,
      [estancia.rows[0].espacio_id]
    );

    await client.query("COMMIT");

    return { data: resultado.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  todos,
  activas,
  porId,
  entrada,
  salida,
};
