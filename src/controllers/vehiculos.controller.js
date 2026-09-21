const { matchedData } = require("express-validator"),
  s = require("../services/vehiculos.service");
const send = (r, x, ok = 200, key = "vehiculo") =>
  x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r
        .status(ok)
        .json({ mensaje: "Operación realizada correctamente", [key]: x.data });
exports.todos = (q, r) => r.json(s.todos());
exports.porId = (q, r) => {
  const x = s.porId(q.params.id);
  return x
    ? r.json(x)
    : r.status(404).json({ mensaje: "Vehículo no encontrado" });
};
exports.crear = (q, r) => send(r, s.crear(matchedData(q)), 201);
exports.actualizar = (q, r) =>
  send(r, s.actualizar(q.params.id, matchedData(q)));
exports.parcial = (q, r) => {
  const d = matchedData(q);
  return Object.keys(d).length
    ? send(r, s.parcial(q.params.id, d))
    : r
        .status(400)
        .json({ mensaje: "Debe enviar al menos un campo permitido" });
};
exports.eliminar = (q, r) => send(r, s.eliminar(q.params.id));
