
const { matchedData } = require("express-validator");
const s = require("../services/conductores.service");

exports.todos = async (q, r) => {
  const conductores = await s.todos();
  return r.json(conductores);
};

exports.porId = async (q, r) => {
  const x = await s.porId(q.params.id);

  return x
    ? r.json(x)
    : r.status(404).json({ mensaje: "Conductor no encontrado" });
};

exports.crear = async (q, r) => {
  const d = matchedData(q);

  if (await s.porDocumento(d.documento)) {
    return r.status(409).json({
      mensaje: "Ya existe un conductor con ese documento",
    });
  }

  try {
    const conductor = await s.crear(d);

    return r.status(201).json({
      mensaje: "Conductor creado correctamente",
      conductor,
    });
  } catch (error) {
    if (error.code === "23505") {
      return r.status(409).json({
        mensaje: "Ya existe un conductor con ese documento",
      });
    }
    throw error;
  }
};

exports.actualizar = async (q, r) => {
  const d = matchedData(q);
  const dup = await s.porDocumento(d.documento);

  if (dup && String(dup.id) !== String(q.params.id)) {
    return r.status(409).json({
      mensaje: "El documento pertenece a otro conductor",
    });
  }

  try {
    const x = await s.actualizar(q.params.id, d);

    return x
      ? r.json({ mensaje: "Conductor actualizado", conductor: x })
      : r.status(404).json({ mensaje: "Conductor no encontrado" });
  } catch (error) {
    if (error.code === "23505") {
      return r.status(409).json({
        mensaje: "El documento pertenece a otro conductor",
      });
    }
    throw error;
  }
};

exports.parcial = async (q, r) => {
  const d = matchedData(q);

  if (!Object.keys(d).length) {
    return r.status(400).json({
      mensaje: "Debe enviar al menos un campo permitido",
    });
  }

  const dup = d.documento
    ? await s.porDocumento(d.documento)
    : null;

  if (dup && String(dup.id) !== String(q.params.id)) {
    return r.status(409).json({
      mensaje: "Documento duplicado",
    });
  }

  try {
    const x = await s.parcial(q.params.id, d);

    return x
      ? r.json({
          mensaje: "Conductor actualizado parcialmente",
          conductor: x,
        })
      : r.status(404).json({
          mensaje: "Conductor no encontrado",
        });
  } catch (error) {
    if (error.code === "23505") {
      return r.status(409).json({
        mensaje: "Documento duplicado",
      });
    }
    throw error;
  }
};

exports.eliminar = async (q, r) => {
  const x = await s.eliminar(q.params.id);

  return x.error
    ? r.status(x.status).json({ mensaje: x.error })
    : r.json({
        mensaje: "Conductor eliminado",
        conductor: x.data,
      });
};

