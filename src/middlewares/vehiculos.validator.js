const { body, param } = require("express-validator");
const id = [param("id").isInt({ min: 1 })];
const campos = [
  body("placa")
    .isString()
    .trim()
    .matches(/^[A-Za-z0-9]{5,7}$/),
  body("tipo").isIn(["carro", "moto"]),
  body("marca").isString().trim().notEmpty(),
  body("color").isString().trim().notEmpty(),
  body("conductorId").isInt({ min: 1 }),
];
const parcial = campos.map((v) => v.optional());
module.exports = { id, campos, parcial };
