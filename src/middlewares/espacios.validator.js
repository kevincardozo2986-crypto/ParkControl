const { body, param } = require("express-validator");

const id = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
];

const campos = [
  body("numero")
    .isString().trim().matches(/^[A-Za-z0-9-]{2,12}$/)
    .withMessage("El número debe tener entre 2 y 12 caracteres (letras, números o guion)"),
  body("tipo").isIn(["carro", "moto"]).withMessage("El tipo debe ser carro o moto"),
  body("ubicacion")
    .isString().trim().isLength({ min: 2, max: 80 })
    .withMessage("La ubicación debe tener entre 2 y 80 caracteres"),
];

const parcial = campos.map((v) => v.optional());

module.exports = { id, campos, parcial };
