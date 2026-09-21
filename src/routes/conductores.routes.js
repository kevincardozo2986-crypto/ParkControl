const r = require("express").Router(),
  c = require("../controllers/conductores.controller"),
  v = require("../middlewares/conductores.validator"),
  validar = require("../middlewares/validar.middleware");
/** @openapi
 * /api/conductores:
 *   get: { tags: [Conductores], summary: Listar conductores, responses: { '200': { description: OK } } }
 *   post: { tags: [Conductores], summary: Registrar conductor, responses: { '201': { description: Creado }, '400': { description: Datos inválidos }, '409': { description: Documento duplicado } } }
 */
r.get("/", c.todos);
r.post("/", v.campos, validar, c.crear);
r.get("/:id", v.id, validar, c.porId);
r.put("/:id", v.id, v.campos, validar, c.actualizar);
r.patch("/:id", v.id, v.parcial, validar, c.parcial);
r.delete("/:id", v.id, validar, c.eliminar);
module.exports = r;
