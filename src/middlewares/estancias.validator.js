const { body, param } = require("express-validator");
module.exports = {
  id: [param("id").isInt({ min: 1 })],
  entrada: [
    body("vehiculoId").isInt({ min: 1 }),
    body("espacioId").isInt({ min: 1 }),
  ],
};
