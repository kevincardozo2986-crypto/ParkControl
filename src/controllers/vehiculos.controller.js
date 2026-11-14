
const { matchedData } = require("express-validator");
const s = require("../services/vehiculos.service");

// Respuesta general para las operaciones
const send = (r, x, ok = 200, key = "vehiculo") =>
  x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.status(ok).json({
        mensaje: "Operación realizada correctamente",
        [key]: x.data,
      });

// Listar todos los vehículos
exports.todos = async (q, r) => {
  const vehiculos = await s.todos();
  return r.json(vehiculos);
};

// Buscar vehículo por ID
exports.porId = async (q, r) => {
  const x = await s.porId(q.params.id);

  return x
    ? r.json(x)
    : r.status(404).json({
        mensaje: "Vehículo no encontrado",
      });
};

// Crear vehículo
exports.crear = async (q, r) => {
  const d = matchedData(q);
  const resultado = await s.crear(d);

  return send(r, resultado, 201);
};

// Actualizar vehículo
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

// Eliminar vehículo
exports.eliminar = async (q, r) => {
  const resultado = await s.eliminar(q.params.id);

  return send(r, resultado);
};

