const crypto = require("crypto");
module.exports = (req, res, next) => {
  req.id = req.get("X-Request-Id") || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};
