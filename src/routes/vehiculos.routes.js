
const r = require("express").Router();

const c = require("../controllers/vehiculos.controller");
const v = require("../middlewares/vehiculos.validator");
const validar = require("../middlewares/validar.middleware");

// ========================================
// Seguridad JWT y RBAC
// ========================================
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

/**
 * @openapi
 * /api/vehiculos:
 *   get:
 *     tags:
 *       - Vehículos
 *     summary: Listar vehículos
 *     description: Disponible para administradores y usuarios autenticados.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de vehículos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *
 *   post:
 *     tags:
 *       - Vehículos
 *     summary: Registrar vehículo
 *     description: Solo administradores pueden registrar vehículos.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - tipo
 *               - marca
 *               - color
 *               - conductorId
 *             properties:
 *               placa:
 *                 type: string
 *                 example: ABC123
 *               tipo:
 *                 type: string
 *                 enum: [carro, moto]
 *                 example: carro
 *               marca:
 *                 type: string
 *                 example: Toyota
 *               color:
 *                 type: string
 *                 example: Negro
 *               conductorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '201':
 *         description: Vehículo registrado correctamente
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Sin permisos
 *       '409':
 *         description: Placa duplicada
 */

/**
 * @openapi
 * /api/vehiculos/{id}:
 *   get:
 *     tags:
 *       - Vehículos
 *     summary: Consultar vehículo por ID
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Vehículo encontrado
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Vehículo no encontrado
 *
 *   put:
 *     tags:
 *       - Vehículos
 *     summary: Actualizar vehículo completamente
 *     description: Solo administradores.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
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
 *               - placa
 *               - tipo
 *               - marca
 *               - color
 *               - conductorId
 *             properties:
 *               placa:
 *                 type: string
 *                 example: ABC123
 *               tipo:
 *                 type: string
 *                 enum: [carro, moto]
 *               marca:
 *                 type: string
 *                 example: Chevrolet
 *               color:
 *                 type: string
 *                 example: Blanco
 *               conductorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '200':
 *         description: Vehículo actualizado
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Vehículo no encontrado
 *
 *   patch:
 *     tags:
 *       - Vehículos
 *     summary: Actualizar parcialmente un vehículo
 *     description: Solo administradores.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
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
 *               placa:
 *                 type: string
 *                 example: XYZ789
 *               tipo:
 *                 type: string
 *                 enum: [carro, moto]
 *               marca:
 *                 type: string
 *                 example: Mazda
 *               color:
 *                 type: string
 *                 example: Rojo
 *               conductorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '200':
 *         description: Vehículo actualizado parcialmente
 *       '400':
 *         description: Datos inválidos
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Vehículo no encontrado
 *
 *   delete:
 *     tags:
 *       - Vehículos
 *     summary: Eliminar vehículo
 *     description: Solo administradores.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Vehículo eliminado
 *       '204':
 *         description: Vehículo eliminado sin contenido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: Acceso denegado
 *       '404':
 *         description: Vehículo no encontrado
 */

// ========================================
// GET - Listar vehículos
// ========================================
r.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  c.todos
);

// ========================================
// GET - Vehículo por ID
// ========================================
r.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  v.id,
  validar,
  c.porId
);

// ========================================
// POST - Registrar vehículo
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
// PUT - Actualizar vehículo
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
// PATCH - Actualizar parcialmente
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
// DELETE - Eliminar vehículo
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
