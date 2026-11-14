const { body, param } = require("express-validator");

module.exports = {
  id: [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  entrada: [
    body("vehiculoId").isInt({ min: 1 }).withMessage("Seleccione un vehículo válido"),
    body("espacioId").isInt({ min: 1 }).withMessage("Seleccione un espacio válido"),
  ],
};
