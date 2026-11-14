
const { matchedData } = require("express-validator");
const s = require("../services/pagos.service");

// Listar todos los pagos
exports.todos = async (q, r) => {
  const pagos = await s.todos();
  return r.json(pagos);
};

// Buscar pago por ID
exports.porId = async (q, r) => {
  const x = await s.porId(q.params.id);

  return x
    ? r.json(x)
    : r.status(404).json({
        mensaje: "Pago no encontrado",
      });
};

// Registrar un pago
exports.crear = async (q, r) => {
  const d = matchedData(q);
  const x = await s.crear(d);

  return x.error
    ? r.status(x.status).json({
        mensaje: x.error,
      })
    : r.status(201).json({
        mensaje: "Pago registrado correctamente",
        pago: x.data,
      });
};

