const rutaNoEncontrada = (req, res) =>
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      mensaje: "Ruta no encontrada",
      requestId: req.id,
    },
  });

const manejarError = (err, req, res, next) => {
  const requestId = req.id || "sin-id";

  // Log estructurado para evitar format strings dinámicos.
  console.error("Error procesando solicitud", {
    requestId,
    message: err.message,
    code: err.code,
    status: err.status,
  });

  // Base de datos no disponible (Supabase pausado, red, credenciales del pooler)
  const sinBaseDatos =
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "XX000", "57P01", "28P01"].includes(err.code) ||
    String(err.code || "").startsWith("08") ||
    /timeout exceeded when trying to connect/i.test(err.message || "");

  if (sinBaseDatos) {
    return res.status(503).json({
      mensaje: "No hay conexión con la base de datos. Revise el backend y Supabase.",
      error: { code: "DB_UNAVAILABLE", requestId },
    });
  }

  // Errores del parser JSON: mensaje genérico (no exponer detalles internos)
  const erroresCuerpo = {
    "entity.parse.failed": ["INVALID_JSON", "El cuerpo de la solicitud no es un JSON válido"],
    "entity.too.large": ["PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud supera el tamaño permitido (10 KB)"],
  };

  if (erroresCuerpo[err.type]) {
    const [code, mensaje] = erroresCuerpo[err.type];
    return res.status(err.status || 400).json({ error: { code, mensaje, requestId } });
  }

  const status = Number(err.status) || 500;

  res.status(status).json({
    error: {
      code:
        err.code ||
        (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),

      mensaje:
        status === 500
          ? "Error interno del servidor"
          : err.message,

      requestId,
    },
  });
};

module.exports = {
  rutaNoEncontrada,
  manejarError,
};