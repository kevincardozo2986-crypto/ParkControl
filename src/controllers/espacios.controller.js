
const { matchedData } = require("express-validator");
const s = require("../services/espacios.service");

// Respuesta general
const send = (r, x, ok = 200) =>
  x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.status(ok).json({
        mensaje: "Operación realizada correctamente",
        espacio: x.data,
      });

// Listar todos los espacios
exports.todos = async (q, r) => {
  const espacios = await s.todos();
  return r.json(espacios);
};

// Listar espacios disponibles
exports.disponibles = async (q, r) => {
  const espacios = await s.disponibles();
  return r.json(espacios);
};

// Buscar espacio por ID
exports.porId = async (q, r) => {
  const x = await s.porId(q.params.id);

  return x
    ? r.json(x)
    : r.status(404).json({
        mensaje: "Espacio no encontrado",
      });
};

// Crear espacio
exports.crear = async (q, r) => {
  const d = matchedData(q);
  const resultado = await s.crear(d);

  return send(r, resultado, 201);
};

// Actualizar espacio
exports.actualizar = async (q, r) => {
  const d = matchedData(q);
  const resultado = await s.actualizar(q.params.id, d);

  return send(r, resultado);
};

// Actualizar parcialmente
exports.parcial = async (q, r) => {
  const d = matchedData(q);

  if (!Object.keys(d).length) {
    return r.status(400).json({
      mensaje: "Debe enviar al menos un campo permitido",
    });
  }

  const resultado = await s.parcial(q.params.id, d);

  return send(r, resultado);
};

// Eliminar espacio
exports.eliminar = async (q, r) => {
  const resultado = await s.eliminar(q.params.id);

  return send(r, resultado);
};
