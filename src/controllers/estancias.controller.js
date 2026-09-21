const { matchedData } = require("express-validator"),
  s = require("../services/estancias.service");
const send = (r, x) =>
  x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.json({
        mensaje: "Operación realizada correctamente",
        estancia: x.data,
      });
exports.todos = (q, r) => r.json(s.todos());
exports.activas = (q, r) => r.json(s.activas());
exports.porId = (q, r) => {
  const x = s.porId(q.params.id);
  return x
    ? r.json(x)
    : r.status(404).json({ mensaje: "Estancia no encontrada" });
};
exports.entrada = (q, r) => {
  const x = s.entrada(matchedData(q));
  return x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r
        .status(201)
        .json({
          mensaje: "Entrada registrada correctamente",
          estancia: x.data,
        });
};
exports.salida = (q, r) => send(r, s.salida(q.params.id));
