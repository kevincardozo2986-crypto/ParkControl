
const r = require("express").Router();

const c = require("../controllers/estancias.controller");
const v = require("../middlewares/estancias.validator");
const validar = require("../middlewares/validar.middleware");

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

/**
 * @openapi
 * /api/estancias:
 *   get:
 *     tags: [Estancias]
 *     summary: Listar todas las estancias
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200': { description: Lista de estancias }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *
 * /api/estancias/activas:
 *   get:
 *     tags: [Estancias]
 *     summary: Listar estancias activas
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       '200': { description: Estancias activas }
 *       '401': { description: No autenticado }
 *
 * /api/estancias/entrada:
 *   post:
 *     tags: [Estancias]
 *     summary: Registrar entrada (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehiculoId, espacioId]
 *             properties:
 *               vehiculoId:
 *                 type: integer
 *                 example: 1
 *               espacioId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '201': { description: Entrada registrada }
 *       '400': { description: Datos inválidos }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *       '409': { description: Conflicto de negocio }
 *
 * /api/estancias/{id}:
 *   get:
 *     tags: [Estancias]
 *     summary: Consultar estancia por ID
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200': { description: Estancia encontrada }
 *       '404': { description: No encontrada }
 *
 * /api/estancias/{id}/salida:
 *   patch:
 *     tags: [Estancias]
 *     summary: Registrar salida (solo administrador)
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200': { description: Salida registrada }
 *       '400': { description: ID inválido }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *       '404': { description: Estancia no encontrada }
 *       '409': { description: Estancia no activa }
 */

// Consultas
r.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  c.todos
);

r.get(
  "/activas",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  c.activas
);

r.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "usuario"),
  v.id,
  validar,
  c.porId
);

// Operaciones administrativas
r.post(
  "/entrada",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.entrada,
  validar,
  c.entrada
);

r.patch(
  "/:id/salida",
  autenticarJWT,
  autorizarRoles("administrador"),
  v.id,
  validar,
  c.salida
);

module.exports = r;
