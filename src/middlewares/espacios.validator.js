const { body, param } = require("express-validator");
const id = [
  param("id").isInt({ min: 1 }).withMessage("id debe ser entero positivo"),
];
const campos = [
  body("numero")
    .isString()
    .trim()
    .matches(/^[A-Za-z0-9-]{2,12}$/)
    .withMessage("numero inválido"),
  body("tipo").isIn(["carro", "moto"]),
  body("ubicacion").isString().trim().isLength({ min: 2, max: 80 }),
];
const parcial = campos.map((v) => v.optional());
module.exports = { id, campos, parcial };
