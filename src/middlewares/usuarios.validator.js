const { body, param, query } = require("express-validator");
const { ROLES } = require("../services/usuarios.service");

const id = [param("id").isInt({ min: 1 }).withMessage("ID inválido").toInt()];

const nombre = body("nombre")
  .isString()
  .trim()
  .isLength({ min: 3, max: 100 })
  .withMessage("El nombre debe tener entre 3 y 100 caracteres");

const email = body("email")
  .isString()
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage("Correo electrónico inválido");

const listado = [
  query("q").optional().isString().trim().isLength({ max: 100 })
    .withMessage("La búsqueda admite hasta 100 caracteres"),
  query("rol").optional().isIn(["", ...ROLES]).withMessage("Rol inválido"),
  query("activo").optional().isIn(["", "true", "false"]).withMessage("Estado inválido"),
  query("pagina").optional().isInt({ min: 1, max: 100000 }).withMessage("Página inválida").toInt(),
];

const creacion = [
  nombre,
  email,
  body("password")
    .isString()
    .isLength({ min: 12, max: 72 })
    .withMessage("La contraseña debe tener entre 12 y 72 caracteres")
    .bail()
    .custom((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v))
    .withMessage("La contraseña debe incluir mayúscula, minúscula y número"),
  body("rol").isIn(ROLES).withMessage("Rol inválido"),
];

const edicion = [...id, nombre, email];

const estado = [
  ...id,
  body("activo").isBoolean({ strict: true }).withMessage("activo debe ser booleano"),
];

const busqueda = [
  query("q").isString().trim().isLength({ min: 2, max: 100 })
    .withMessage("Escriba entre 2 y 100 caracteres para buscar"),
];

module.exports = { id, listado, creacion, edicion, estado, busqueda };
