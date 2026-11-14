const { body, param } = require("express-validator");

module.exports = {
  id: [param("id").isInt({ min: 1 }).withMessage("ID inválido")],
  campos: [
    body("estanciaId").isInt({ min: 1 }).withMessage("Seleccione una estancia válida"),
    body("metodoPago")
      .isIn(["efectivo", "tarjeta", "transferencia"])
      .withMessage("Método de pago inválido"),
  ],
};
