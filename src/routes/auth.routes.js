const express = require("express");
const { rateLimit } = require("express-rate-limit");

const c = require("../controllers/auth.controller");
const v = require("../middlewares/auth.validator");
const validar = require("../middlewares/validar.middleware");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

const router = express.Router();

// ========================================
// Limitadores
// ========================================

// Solo los rechazos de credenciales (401) consumen intentos.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  message: {
    mensaje: "Demasiados intentos fallidos. Espere antes de volver a intentar.",
  },
});

const limiteReset = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    mensaje: "Demasiadas solicitudes de recuperación. Intente más tarde.",
  },
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión y obtener un JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@parkcontrol.com }
 *               password: { type: string, format: password }
 *     responses:
 *       '200': { description: JWT emitido }
 *       '400': { description: Datos inválidos }
 *       '401': { description: Credenciales inválidas }
 *       '403': { description: Usuario deshabilitado }
 *       '429': { description: Demasiados intentos fallidos }
 */
router.post("/login", limiteLogin, v.validarLogin, validar, c.login);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Perfil de la cuenta autenticada
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200': { description: Datos de la cuenta }
 *       '401': { description: Token ausente, inválido, expirado o revocado }
 */
router.get("/perfil", autenticarJWT, c.perfil);

/**
 * @openapi
 * /api/auth/cambiar-password:
 *   patch:
 *     tags: [Autenticación]
 *     summary: Cambiar la contraseña propia (revoca los JWT anteriores)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual, passwordNueva, confirmarPassword]
 *             properties:
 *               passwordActual: { type: string, format: password }
 *               passwordNueva: { type: string, format: password }
 *               confirmarPassword: { type: string, format: password }
 *     responses:
 *       '200': { description: Contraseña actualizada }
 *       '400': { description: Política no cumplida o misma contraseña }
 *       '401': { description: Contraseña actual inválida }
 *       '409': { description: Cambio concurrente }
 */
router.patch(
  "/cambiar-password",
  autenticarJWT,
  v.validarCambioPassword,
  validar,
  c.cambiarPassword,
);

/**
 * @openapi
 * /api/auth/recuperacion/admin/{usuarioId}:
 *   post:
 *     tags: [Autenticación]
 *     summary: Generar token temporal de recuperación (solo administrador)
 *     description: Token de un solo uso, válido 15 minutos. Se guarda solo su hash.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '201': { description: Token generado }
 *       '403': { description: Rol no autorizado }
 *       '404': { description: Usuario no encontrado o inactivo }
 */
router.post(
  "/recuperacion/admin/:usuarioId",
  autenticarJWT,
  autorizarRoles("administrador"),
  limiteReset,
  v.validarGenerarRecuperacion,
  validar,
  c.generarRecuperacionAdmin,
);

/**
 * @openapi
 * /api/auth/restablecer-password:
 *   post:
 *     tags: [Autenticación]
 *     summary: Restablecer contraseña con el token administrativo
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, passwordNueva, confirmarPassword]
 *             properties:
 *               token: { type: string, example: 64 caracteres hexadecimales }
 *               passwordNueva: { type: string, format: password }
 *               confirmarPassword: { type: string, format: password }
 *     responses:
 *       '200': { description: Contraseña restablecida }
 *       '400': { description: Token inválido, utilizado o expirado }
 */
router.post(
  "/restablecer-password",
  limiteReset,
  v.validarRestablecimiento,
  validar,
  c.restablecerPassword,
);

/**
 * @openapi
 * /api/auth/codigos-recuperacion:
 *   post:
 *     tags: [Autenticación]
 *     summary: Generar 8 códigos de respaldo (requiere contraseña actual)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual: { type: string, format: password }
 *     responses:
 *       '201': { description: Códigos generados (se muestran una sola vez) }
 *       '401': { description: Reautenticación incorrecta }
 */
router.post(
  "/codigos-recuperacion",
  autenticarJWT,
  limiteReset,
  v.validarGenerarCodigos,
  validar,
  c.generarCodigos,
);

/**
 * @openapi
 * /api/auth/codigos-recuperacion/estado:
 *   get:
 *     tags: [Autenticación]
 *     summary: Cantidad de códigos de respaldo disponibles
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200': { description: Códigos disponibles }
 */
router.get("/codigos-recuperacion/estado", autenticarJWT, c.estadoCodigos);

/**
 * @openapi
 * /api/auth/codigos-recuperacion/regenerar:
 *   post:
 *     tags: [Autenticación]
 *     summary: Regenerar códigos (invalida los anteriores)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual: { type: string, format: password }
 *     responses:
 *       '201': { description: Códigos regenerados }
 *       '401': { description: Reautenticación incorrecta }
 */
router.post(
  "/codigos-recuperacion/regenerar",
  autenticarJWT,
  limiteReset,
  v.validarGenerarCodigos,
  validar,
  c.generarCodigos,
);

/**
 * @openapi
 * /api/auth/restablecer-con-codigo:
 *   post:
 *     tags: [Autenticación]
 *     summary: Restablecer contraseña con un código de respaldo (un solo uso)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, codigo, passwordNueva, confirmarPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               codigo: { type: string, example: ABCD-1234-ABCD-1234-ABCD-1234-ABCD-1234 }
 *               passwordNueva: { type: string, format: password }
 *               confirmarPassword: { type: string, format: password }
 *     responses:
 *       '200': { description: Contraseña restablecida }
 *       '400': { description: Código o cuenta inválidos }
 */
router.post(
  "/restablecer-con-codigo",
  limiteReset,
  v.validarRestablecerConCodigo,
  validar,
  c.restablecerConCodigo,
);

module.exports = router;
