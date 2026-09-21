const r = require("express").Router();
const c = require("../controllers/estancias.controller");
const v = require("../middlewares/estancias.validator");
const validar = require("../middlewares/validar.middleware");

/**
 * @openapi
 * /api/estancias/entrada:
 *   post:
 *     tags:
 *       - Estancias
 *     summary: Registrar entrada
 *     description: Registra la entrada de un vehículo a un espacio disponible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehiculoId
 *               - espacioId
 *             properties:
 *               vehiculoId:
 *                 type: integer
 *                 example: 1
 *                 description: ID del vehículo que ingresa
 *               espacioId:
 *                 type: integer
 *                 example: 1
 *                 description: ID del espacio que será ocupado
 *           example:
 *             vehiculoId: 1
 *             espacioId: 1
 *     responses:
 *       '201':
 *         description: Entrada registrada correctamente
 *       '400':
 *         description: Datos inválidos o referencias inexistentes
 *       '401':
 *         description: API Key requerida o inválida
 *       '409':
 *         description: Regla de negocio incumplida
 *
 * /api/estancias/activas:
 *   get:
 *     tags:
 *       - Estancias
 *     summary: Listar estancias activas
 *     responses:
 *       '200':
 *         description: Lista de estancias activas
 *       '401':
 *         description: API Key requerida o inválida
 *
 * /api/estancias/{id}/salida:
 *   patch:
 *     tags:
 *       - Estancias
 *     summary: Registrar salida
 *     description: Finaliza una estancia activa y libera el espacio ocupado.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la estancia
 *     responses:
 *       '200':
 *         description: Salida registrada correctamente
 *       '400':
 *         description: ID inválido
 *       '401':
 *         description: API Key requerida o inválida
 *       '404':
 *         description: Estancia no encontrada
 *       '409':
 *         description: La estancia ya no está activa
 */

r.get("/", c.todos);
r.get("/activas", c.activas);
r.post("/entrada", v.entrada, validar, c.entrada);
r.get("/:id", v.id, validar, c.porId);
r.patch("/:id/salida", v.id, validar, c.salida);

module.exports = r;