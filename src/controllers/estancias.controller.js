
const { matchedData } = require("express-validator");
const s = require("../services/estancias.service");

// Respuesta general
const send = (r, x) =>
  x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.json({
        mensaje: "Operación realizada correctamente",
        estancia: x.data,
      });

// Listar todas las estancias
exports.todos = async (q, r) => {
  const estancias = await s.todos();
  return r.json(estancias);
};

// Listar estancias activas
exports.activas = async (q, r) => {
  const estancias = await s.activas();
  return r.json(estancias);
};

// Buscar estancia por ID
exports.porId = async (q, r) => {
  const x = await s.porId(q.params.id);

  return x
    ? r.json(x)
    : r.status(404).json({
        mensaje: "Estancia no encontrada",
      });
};

// Registrar entrada
exports.entrada = async (q, r) => {
  const d = matchedData(q);
  const x = await s.entrada(d);

  return x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.status(201).json({
        mensaje: "Entrada registrada correctamente",
        estancia: x.data,
      });
};

// Registrar salida
exports.salida = async (q, r) => {
  const x = await s.salida(q.params.id);
  return send(r, x);
};

