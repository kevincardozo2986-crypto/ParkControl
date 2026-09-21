const { matchedData } = require("express-validator"),
  s = require("../services/conductores.service");
exports.todos = (q, r) => r.json(s.todos());
exports.porId = (q, r) => {
  const x = s.porId(q.params.id);
  return x
    ? r.json(x)
    : r.status(404).json({ mensaje: "Conductor no encontrado" });
};
exports.crear = (q, r) => {
  const d = matchedData(q);
  if (s.porDocumento(d.documento))
    return r
      .status(409)
      .json({ mensaje: "Ya existe un conductor con ese documento" });
  r.status(201).json({
    mensaje: "Conductor creado correctamente",
    conductor: s.crear(d),
  });
};
exports.actualizar = (q, r) => {
  const d = matchedData(q),
    dup = s.porDocumento(d.documento);
  if (dup && dup.id !== Number(q.params.id))
    return r
      .status(409)
      .json({ mensaje: "El documento pertenece a otro conductor" });
  const x = s.actualizar(q.params.id, d);
  return x
    ? r.json({ mensaje: "Conductor actualizado", conductor: x })
    : r.status(404).json({ mensaje: "Conductor no encontrado" });
};
exports.parcial = (q, r) => {
  const d = matchedData(q);
  if (!Object.keys(d).length)
    return r
      .status(400)
      .json({ mensaje: "Debe enviar al menos un campo permitido" });
  const dup = d.documento && s.porDocumento(d.documento);
  if (dup && dup.id !== Number(q.params.id))
    return r.status(409).json({ mensaje: "Documento duplicado" });
  const x = s.parcial(q.params.id, d);
  return x
    ? r.json({ mensaje: "Conductor actualizado parcialmente", conductor: x })
    : r.status(404).json({ mensaje: "Conductor no encontrado" });
};
exports.eliminar = (q, r) => {
  const x = s.eliminar(q.params.id);
  return x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.json({ mensaje: "Conductor eliminado", conductor: x.data });
};
