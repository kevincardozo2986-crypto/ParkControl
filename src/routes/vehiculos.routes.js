const r = require("express").Router(),
  c = require("../controllers/vehiculos.controller"),
  v = require("../middlewares/vehiculos.validator"),
  validar = require("../middlewares/validar.middleware");
/** @openapi
 * /api/vehiculos:
 *   get: { tags: [Vehículos], summary: Listar vehículos, responses: { '200': { description: OK } } }
 *   post: { tags: [Vehículos], summary: Registrar vehículo, responses: { '201': { description: Creado }, '409': { description: Placa duplicada } } }
 */
r.get("/", c.todos);
r.post("/", v.campos, validar, c.crear);
r.get("/:id", v.id, validar, c.porId);
r.put("/:id", v.id, v.campos, validar, c.actualizar);
r.patch("/:id", v.id, v.parcial, validar, c.parcial);
r.delete("/:id", v.id, validar, c.eliminar);
module.exports = r;
