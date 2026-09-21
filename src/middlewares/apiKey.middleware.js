const crypto = require("crypto");

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = (expectedKey) => (req, res, next) => {
  const received = req.get("X-API-Key");
  if (!received) {
    return res
      .status(401)
      .json({
        error: { code: "API_KEY_REQUIRED", mensaje: "API Key requerida" },
      });
  }
  if (!safeEqual(received, expectedKey)) {
    return res
      .status(401)
      .json({
        error: { code: "API_KEY_INVALID", mensaje: "API Key inválida" },
      });
  }
  next();
};
