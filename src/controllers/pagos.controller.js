const { matchedData } = require("express-validator"),
  s = require("../services/pagos.service");
exports.todos = (q, r) => r.json(s.todos());
exports.porId = (q, r) => {
  const x = s.porId(q.params.id);
  return x ? r.json(x) : r.status(404).json({ mensaje: "Pago no encontrado" });
};
exports.crear = (q, r) => {
  const x = s.crear(matchedData(q));
  return x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r
        .status(201)
        .json({ mensaje: "Pago registrado correctamente", pago: x.data });
};
