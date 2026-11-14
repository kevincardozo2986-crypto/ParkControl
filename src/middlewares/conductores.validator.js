const { body, param } = require("express-validator");

const id = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

const campos = [
  body("nombre")
    .isString().trim().isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres"),
  body("documento")
    .isString().trim().matches(/^[0-9]{6,15}$/)
    .withMessage("El documento debe tener entre 6 y 15 dígitos"),
  body("telefono")
    .isString().trim().matches(/^[0-9]{7,15}$/)
    .withMessage("El teléfono debe tener entre 7 y 15 dígitos"),
  body("correo")
    .isEmail().withMessage("Correo inválido")
    .normalizeEmail(),
];

const parcial = campos.map((v) => v.optional());


module.exports = { id, campos, parcial };
