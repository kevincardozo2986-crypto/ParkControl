const { body, param } = require("express-validator");
const id = [param("id").isInt({ min: 1 })];
const campos = [
  body("nombre").isString().trim().isLength({ min: 3, max: 100 }),
  body("documento")
    .isString()
    .trim()
    .matches(/^[0-9]{6,15}$/),
  body("telefono")
    .isString()
    .trim()
    .matches(/^[0-9]{7,15}$/),
  body("correo").isEmail().normalizeEmail(),
];
const parcial = campos.map((v) => v.optional());
module.exports = { id, campos, parcial };
