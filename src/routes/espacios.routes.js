
const r = require("express").Router();

const c = require("../controllers/espacios.controller");
const v = require("../middlewares/espacios.validator");
const validar = require("../middlewares/validar.middleware");

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

/**
 * @openapi
 * /api/espacios:
 *   get:
 *     tags: [Espacios]
 *     summary: Listar espacios
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200': { description: Lista de espacios }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *   post:
 *     tags: [Espacios]
 *     summary: Crear espacio (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero: { type: string, example: "A10" }
 *               tipo: { type: string, enum: [carro, moto], example: carro }
 *               estado: { type: string, enum: [disponible, ocupado], example: disponible }
 *               ubicacion: { type: string, example: "Primer piso" }
 *     responses:
 *       '201': { description: Espacio creado }
 *       '400': { description: Datos inválidos }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *
 * /api/espacios/disponibles:
 *   get:
 *     tags: [Espacios]
 *     summary: Listar espacios disponibles
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200': { description: Espacios disponibles }
 *       '401': { description: No autenticado }
 *
 * /api/espacios/{id}:
 *   get:
 *     tags: [Espacios]
 *     summary: Consultar espacio por ID
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200': { description: Espacio encontrado }
 *       '404': { description: No encontrado }
 *   put:
 *     tags: [Espacios]
 *     summary: Actualizar espacio (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero: { type: string, example: "A10" }
 *               tipo: { type: string, enum: [carro, moto] }
 *               estado: { type: string, enum: [disponible, ocupado] }
 *               ubicacion: { type: string, example: "Primer piso" }
 *     responses:
 *       '200': { description: Espacio actualizado }
 *       '403': { description: Sin permisos }
 *   patch:
 *     tags: [Espacios]
 *     summary: Actualizar parcialmente espacio (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero: { type: string }
 *               tipo: { type: string }
 *               estado: { type: string }
 *               ubicacion: { type: string }
 *     responses:
 *       '200': { description: Espacio actualizado }
 *       '403': { description: Sin permisos }
 *   delete:
 *     tags: [Espacios]
 *     summary: Eliminar espacio (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200': { description: Espacio eliminado }
 *       '204': { description: Espacio eliminado }
 *       '403': { description: Sin permisos }
 */

// Consultas
r.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  c.todos
);

r.get(
  "/disponibles",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  c.disponibles
);

r.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  v.id,
  validar,
  c.porId
);

// Administración
r.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.campos,
  validar,
  c.crear
);

r.put(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  v.campos,
  validar,
  c.actualizar
);

r.patch(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  v.parcial,
  validar,
  c.parcial
);

r.delete(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  validar,
  c.eliminar
);

module.exports = r;
