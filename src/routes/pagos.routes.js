const r = require("express").Router();
const c = require("../controllers/pagos.controller");
const v = require("../middlewares/pagos.validator");
const validar = require("../middlewares/validar.middleware");

/**
 * @openapi
 * /api/pagos:
 *   get:
 *     tags:
 *       - Pagos
 *     summary: Listar pagos
 *     description: Obtiene todos los pagos registrados.
 *     responses:
 *       '200':
 *         description: Lista de pagos
 *       '401':
 *         description: API Key requerida o inválida
 *
 *   post:
 *     tags:
 *       - Pagos
 *     summary: Registrar pago calculado según permanencia
 *     description: Registra el pago de una estancia finalizada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estanciaId
 *               - metodoPago
 *             properties:
 *               estanciaId:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la estancia finalizada
 *               metodoPago:
 *                 type: string
 *                 enum:
 *                   - efectivo
 *                   - tarjeta
 *                   - transferencia
 *                 example: efectivo
 *                 description: Método utilizado para realizar el pago
 *           example:
 *             estanciaId: 1
 *             metodoPago: efectivo
 *     responses:
 *       '201':
 *         description: Pago registrado correctamente
 *       '400':
 *         description: Datos inválidos o estancia inexistente
 *       '401':
 *         description: API Key requerida o inválida
 *       '409':
 *         description: Pago duplicado o estancia todavía activa
 *       '500':
 *         description: Error interno del servidor
 */

r.get("/", c.todos);
r.post("/", v.campos, validar, c.crear);
r.get("/:id", v.id, validar, c.porId);

module.exports = r;