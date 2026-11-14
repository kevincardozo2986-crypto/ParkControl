
const r = require("express").Router();

const c = require("../controllers/pagos.controller");
const v = require("../middlewares/pagos.validator");
const validar = require("../middlewares/validar.middleware");

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

/**
 * @openapi
 * /api/pagos:
 *   get:
 *     tags: [Pagos]
 *     summary: Listar pagos
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200': { description: Lista de pagos }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *   post:
 *     tags: [Pagos]
 *     summary: Registrar pago (solo administrador)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estanciaId, metodoPago]
 *             properties:
 *               estanciaId:
 *                 type: integer
 *                 example: 1
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia]
 *                 example: efectivo
 *     responses:
 *       '201': { description: Pago registrado }
 *       '400': { description: Datos inválidos }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *       '409': { description: Pago duplicado o estancia activa }
 *
 * /api/pagos/{id}:
 *   get:
 *     tags: [Pagos]
 *     summary: Consultar pago por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200': { description: Pago encontrado }
 *       '401': { description: No autenticado }
 *       '403': { description: Sin permisos }
 *       '404': { description: Pago no encontrado }
 */

// Consultas
r.get(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  c.todos
);

r.get(
  "/:id",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  v.id,
  validar,
  c.porId
);

// Registro de pagos
r.post(
  "/",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  v.campos,
  validar,
  c.crear
);

module.exports = r;
