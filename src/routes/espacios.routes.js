const r = require("express").Router(),
  c = require("../controllers/espacios.controller"),
  v = require("../middlewares/espacios.validator"),
  validar = require("../middlewares/validar.middleware");
r.get("/", c.todos);
r.get("/disponibles", c.disponibles);
r.post("/", v.campos, validar, c.crear);
r.get("/:id", v.id, validar, c.porId);
r.put("/:id", v.id, v.campos, validar, c.actualizar);
r.patch("/:id", v.id, v.parcial, validar, c.parcial);
r.delete("/:id", v.id, validar, c.eliminar);
module.exports = r;
