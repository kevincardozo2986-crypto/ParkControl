const { validationResult } = require("express-validator");
module.exports = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        mensaje: "Datos inválidos",
        detalles: errores.array().map(({ type, value, ...e }) => e),
        requestId: req.id,
      }
    });
  }
  next();
};
