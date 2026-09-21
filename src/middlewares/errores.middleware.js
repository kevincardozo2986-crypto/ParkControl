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