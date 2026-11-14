const { body, param } = require("express-validator");

const id = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

const campos = [
  body("placa")
    .isString().trim().matches(/^[A-Za-z0-9]{5,7}$/)
    .withMessage("La placa debe tener entre 5 y 7 caracteres alfanuméricos"),
  body("tipo").isIn(["carro", "moto"]).withMessage("El tipo debe ser carro o moto"),
  body("marca").isString().trim().notEmpty().withMessage("La marca es obligatoria"),
  body("color").isString().trim().notEmpty().withMessage("El color es obligatorio"),
  body("conductorId").isInt({ min: 1 }).withMessage("Seleccione un conductor válido"),
];

const parcial = campos.map((v) => v.optional());

module.exports = { id, campos, parcial };
