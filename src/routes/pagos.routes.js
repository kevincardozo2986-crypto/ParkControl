const r = require("express").Router(),
  c = require("../controllers/pagos.controller"),
  v = require("../middlewares/pagos.validator"),
  validar = require("../middlewares/validar.middleware");
/** @openapi
 * /api/pagos:
 *   get: { tags: [Pagos], summary: Listar pagos, responses: { '200': { description: OK } } }
 *   post: { tags: [Pagos], summary: Registrar pago calculado según permanencia, responses: { '201': { description: Pago registrado }, '409': { description: Pago duplicado o estancia activa } } }
 */
r.get("/", c.todos);
r.post("/", v.campos, validar, c.crear);
r.get("/:id", v.id, validar, c.porId);
module.exports = r;
