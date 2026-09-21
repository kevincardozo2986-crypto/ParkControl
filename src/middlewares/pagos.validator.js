const { body, param } = require("express-validator");
module.exports = {
  id: [param("id").isInt({ min: 1 })],
  campos: [
    body("estanciaId").isInt({ min: 1 }),
    body("metodoPago").isIn(["efectivo", "tarjeta", "transferencia"]),
  ],
};
