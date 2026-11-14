const { body, param } = require("express-validator");

// ========================================
// Política de contraseñas nuevas
// 12 a 72 caracteres (límite de bcrypt), mayúscula, minúscula y número
// ========================================
const passwordSegura = (campo) =>
  body(campo)
    .isString()
    .withMessage("La contraseña debe ser texto")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("La contraseña debe tener entre 12 y 72 caracteres")
    .bail()
    .custom((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v))
    .withMessage("La contraseña debe incluir mayúscula, minúscula y número");

const confirmacion = body("confirmarPassword")
  .isString()
  .custom((v, { req }) => v === req.body.passwordNueva)
  .withMessage("La confirmación no coincide");

const nombre = body("nombre")
  .isString()
  .withMessage("El nombre debe ser texto")
  .trim()
  .isLength({ min: 3, max: 100 })
  .withMessage("El nombre debe tener entre 3 y 100 caracteres");

const email = body("email")
  .isString()
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage("Debe proporcionar un correo electrónico válido")
  .isLength({ max: 255 });

// ========================================
// Login
// ========================================
const validarLogin = [
  email,
  body("password")
    .isString()
    .withMessage("La contraseña debe ser texto")
    .notEmpty()
    .withMessage("La contraseña es obligatoria"),
];

// ========================================
// Cambio de contraseña propia
// ========================================
const validarCambioPassword = [
  body("passwordActual")
    .isString()
    .notEmpty()
    .withMessage("La contraseña actual es obligatoria"),
  passwordSegura("passwordNueva"),
  confirmacion,
];

// ========================================
// Recuperación administrativa
// ========================================
const validarGenerarRecuperacion = [
  param("usuarioId").isInt({ min: 1 }).withMessage("ID de usuario inválido"),
];

const validarRestablecimiento = [
  body("token")
    .isString()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage("Token inválido"),
  passwordSegura("passwordNueva"),
  confirmacion,
];

// ========================================
// Códigos de recuperación
// ========================================
const validarGenerarCodigos = [
  body("passwordActual")
    .isString()
    .notEmpty()
    .withMessage("Contraseña actual obligatoria"),
];

const validarRestablecerConCodigo = [
  email,
  body("codigo")
    .isString()
    .matches(/^[a-fA-F0-9]{4}(?:-[a-fA-F0-9]{4}){7}$/)
    .withMessage("Código inválido"),
  passwordSegura("passwordNueva"),
  confirmacion,
];

module.exports = {
  validarLogin,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo,
};
