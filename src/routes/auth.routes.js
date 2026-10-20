
const express = require("express");

const {
  registrar,
  crearPorAdministrador,
  login,
} = require("../controllers/auth.controller");

const {
  validarRegistro,
  validarLogin,
} = require("../middlewares/auth.validator");

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

const router = express.Router();

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registro público de usuario
 *     description: El registro público siempre asigna el rol usuario, incluso si se envía otro rol.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
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
 *                 example: ClaveSegura2026!
 *               rol:
 *                 type: string
 *                 example: administrador
 *                 description: Este campo es ignorado por seguridad.
 *     responses:
 *       '201': { description: Usuario normal registrado }
 *       '400': { description: Datos inválidos }
 *       '409': { description: Correo duplicado }
 *
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión y obtener JWT
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@parkcontrol.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ClaveAdmin2026!
 *     responses:
 *       '200': { description: JWT generado }
 *       '400': { description: Datos inválidos }
 *       '401': { description: Credenciales inválidas }
 *
 * /api/auth/usuarios:
 *   post:
 *     tags: [Autenticación]
 *     summary: Crear usuario desde administración
 *     description: Solo administradores pueden crear usuarios con roles específicos.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password, rol]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Administrador Secundario
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin2@parkcontrol.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 10
 *                 example: ClaveSegura2026!
 *               rol:
 *                 type: string
 *                 enum: [usuario, administrador]
 *                 example: administrador
 *     responses:
 *       '201': { description: Usuario creado correctamente }
 *       '400': { description: Datos inválidos o rol no permitido }
 *       '401': { description: No autenticado }
 *       '403': { description: Solo administradores }
 *       '409': { description: Correo duplicado }
 *
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar perfil autenticado
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200': { description: Usuario autenticado }
 *       '401': { description: No autenticado }
 */

// Registro público
router.post(
  "/registro",
  validarRegistro,
  registrar
);

// Login
router.post(
  "/login",
  validarLogin,
  login
);

// Crear usuario: solo administrador
router.post(
  "/usuarios",
  autenticarJWT,
  autorizarRoles("administrador"),
  validarRegistro,
  crearPorAdministrador
);

// Perfil
router.get(
  "/perfil",
  autenticarJWT,
  (req, res) => {
    return res.status(200).json({
      mensaje: "Usuario autenticado mediante JWT",
      usuario: req.usuario,
      clienteApi: req.clienteApi,
    });
  }
);

module.exports = router;
