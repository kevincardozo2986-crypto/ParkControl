
const r = require("express").Router();

const c = require("../controllers/conductores.controller");
const v = require("../middlewares/conductores.validator");
const validar = require("../middlewares/validar.middleware");

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

/**
 * @openapi
 * /api/conductores:
 *   get:
 *     tags:
 *       - Conductores
 *     summary: Listar conductores
 *     description: Permite consultar todos los conductores a usuarios autenticados.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de conductores obtenida correctamente
 *       '401':
 *         description: Token ausente o inválido
 *       '403':
 *         description: Acceso denegado
 *
 *   post:
 *     tags:
 *       - Conductores
 *     summary: Registrar conductor
 *     description: Solo los administradores pueden registrar conductores.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - documento
 *               - telefono
 *               - correo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Conductor Prueba
 *               documento:
 *                 type: string
 *                 example: "1234567890"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: conductor.prueba@example.com
 *     responses:
 *       '201':
 *         description: Conductor creado correctamente
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: Token ausente o inválido
 *       '403':
 *         description: El usuario no tiene permisos
 *       '409':
 *         description: Documento duplicado
 */

/**
 * @openapi
 * /api/conductores/{id}:
 *   get:
 *     tags:
 *       - Conductores
 *     summary: Consultar conductor por ID
 *     description: Disponible para administradores y usuarios autenticados.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       '200':
 *         description: Conductor encontrado
 *       '400':
 *         description: ID inválido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Conductor no encontrado
 *
 *   put:
 *     tags:
 *       - Conductores
 *     summary: Actualizar conductor completamente
 *     description: Solo administradores.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - documento
 *               - telefono
 *               - correo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Conductor Actualizado
 *               documento:
 *                 type: string
 *                 example: "1234567890"
 *               telefono:
 *                 type: string
 *                 example: "3009876543"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: actualizado@example.com
 *     responses:
 *       '200':
 *         description: Conductor actualizado
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Conductor no encontrado
 *
 *   patch:
 *     tags:
 *       - Conductores
 *     summary: Actualizar parcialmente un conductor
 *     description: Solo administradores.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Nombre Actualizado
 *               documento:
 *                 type: string
 *                 example: "1234567890"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: nuevo@example.com
 *     responses:
 *       '200':
 *         description: Conductor actualizado parcialmente
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Conductor no encontrado
 *
 *   delete:
 *     tags:
 *       - Conductores
 *     summary: Eliminar conductor
 *     description: Solo administradores.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Conductor eliminado correctamente
 *       '204':
 *         description: Conductor eliminado sin contenido
 *       '400':
 *         description: ID inválido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Conductor no encontrado
 */

// ========================================
// GET - Listar conductores
// ========================================
r.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  c.todos
);

// ========================================
// GET - Buscar conductor por ID
// ========================================
r.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  v.id,
  validar,
  c.porId
);

// ========================================
// POST - Crear conductor
// Solo administrador
// ========================================
r.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.campos,
  validar,
  c.crear
);

// ========================================
// PUT - Actualización completa
// Solo administrador
// ========================================
r.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  v.campos,
  validar,
  c.actualizar
);

// ========================================
// PATCH - Actualización parcial
// Solo administrador
// ========================================
r.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  v.parcial,
  validar,
  c.parcial
);

// ========================================
// DELETE - Eliminar conductor
// Solo administrador
// ========================================
r.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  validar,
  c.eliminar
);

module.exports = r;
