const rutaNoEncontrada = (req, res) => res.status(404).json({
  error: { code: "ROUTE_NOT_FOUND", mensaje: "Ruta no encontrada", requestId: req.id }
});

const manejarError = (err, req, res, next) => {
  console.error(`[${req.id || "sin-id"}]`, err);
  const status = Number(err.status) || 500;
  res.status(status).json({
    error: {
      code: err.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
      mensaje: status === 500 ? "Error interno del servidor" : err.message,
      requestId: req.id,
    }
  });
};

module.exports = { rutaNoEncontrada, manejarError };
