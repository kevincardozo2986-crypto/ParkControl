const express = require("express");

const {
  registrar,
  login,
} = require("../controllers/auth.controller");

const {
  validarRegistro,
  validarLogin,
} = require("../middlewares/auth.validator");

const autenticarJWT =
  require("../middlewares/auth.middleware");

const router = express.Router();

// ========================================
// REGISTRO
// ========================================

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: Registra un usuario almacenando su contraseña mediante bcrypt.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Usuario Prueba
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@parkcontrol.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 10
 *                 example: ClaveSegura2026!
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos de registro inválidos
 *       409:
 *         description: El correo ya se encuentra registrado
 */
router.post(
  "/registro",
  validarRegistro,
  registrar,
);

// ========================================
// LOGIN
// ========================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión y obtener JWT
 *     description: Verifica las credenciales del usuario y genera un token JWT.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@parkcontrol.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ClaveSegura2026!
 *     responses:
 *       200:
 *         description: Autenticación correcta y JWT generado
 *       400:
 *         description: Datos de inicio de sesión inválidos
 *       401:
 *         description: Credenciales inválidas
 */
router.post(
  "/login",
  validarLogin,
  login,
);

// ========================================
// PERFIL PROTEGIDO CON JWT
// ========================================

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener perfil del usuario autenticado
 *     description: Requiere API Key y un JWT válido.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 */
router.get(
  "/perfil",
  autenticarJWT,
  (req, res) => {
    return res.status(200).json({
      mensaje:
        "Usuario autenticado mediante JWT",
      usuario: req.usuario,
      clienteApi: req.clienteApi,
    });
  },
);

module.exports = router;