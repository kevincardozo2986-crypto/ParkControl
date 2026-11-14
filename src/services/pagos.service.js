
const { query } = require("../config/database");

const columnas = `
  id,
  estancia_id AS "estanciaId",
  valor,
  fecha_pago AS "fechaPago",
  metodo_pago AS "metodoPago",
  estado
`;

// Consulta con datos relacionados para listados y frontend
const seleccionDetalle = `
  SELECT
    p.id,
    p.estancia_id AS "estanciaId",
    p.valor,
    p.fecha_pago AS "fechaPago",
    p.metodo_pago AS "metodoPago",
    p.estado,
    e.tiempo_permanencia AS "tiempoPermanencia",
    v.placa,
    v.conductor_id AS "conductorId"
  FROM public.pagos p
  JOIN public.estancias e ON e.id = p.estancia_id
  JOIN public.vehiculos v ON v.id = e.vehiculo_id
`;

// Listar todos los pagos
const todos = async () => {
  const resultado = await query(`${seleccionDetalle} ORDER BY p.id DESC`);

  return resultado.rows;
};

// Buscar pago por ID
const porId = async (id) => {
  const resultado = await query(`${seleccionDetalle} WHERE p.id = $1`, [id]);

  return resultado.rows[0] || null;
};

// Registrar pago
const crear = async ({ estanciaId, metodoPago }) => {
  const estancia = await query(
    `SELECT id, estado, tiempo_permanencia
     FROM public.estancias
     WHERE id = $1`,
    [estanciaId]
  );

  if (!estancia.rowCount) {
    return {
      error: "La estancia no existe",
      status: 400,
    };
  }

  const e = estancia.rows[0];

  if (e.estado !== "finalizada") {
    return {
      error: "La estancia debe estar finalizada antes de pagar",
      status: 409,
    };
  }

  const existente = await query(
    `SELECT id FROM public.pagos
     WHERE estancia_id = $1`,
    [estanciaId]
  );

  if (existente.rowCount) {
    return {
      error: "La estancia ya tiene un pago registrado",
      status: 409,
    };
  }

  const tarifa = Number(
    process.env.TARIFA_POR_HORA || 3000
  );

  const valor = e.tiempo_permanencia * tarifa;

  try {
    const resultado = await query(
      `INSERT INTO public.pagos
       (estancia_id, valor, metodo_pago, estado)
       VALUES ($1, $2, $3, 'pagado')
       RETURNING ${columnas}`,
      [estanciaId, valor, metodoPago]
    );

    return { data: resultado.rows[0] };
  } catch (error) {
    // Evitar pagos duplicados incluso
    // ante solicitudes simultaneas
    if (error.code === "23505") {
      return {
        error: "La estancia ya tiene un pago registrado",
        status: 409,
      };
    }

    if (error.code === "23503") {
      return {
        error: "La estancia no existe",
        status: 400,
      };
    }

    throw error;
  }
};

module.exports = {
  todos,
  porId,
  crear,
};
