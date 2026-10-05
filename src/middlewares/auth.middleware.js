const {
  verificarToken,
} = require("../utils/jwt.util");

// ========================================
// Autenticar mediante JWT
// ========================================
const autenticarJWT = (req, res, next) => {
  const authorization =
    req.get("Authorization");

  // --------------------------------------
  // Header ausente
  // --------------------------------------
  if (!authorization) {
    return res.status(401).json({
      mensaje:
        "Token de autenticación requerido",
    });
  }

  // --------------------------------------
  // Validar formato Bearer
  // --------------------------------------
  const partes = authorization.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer" ||
    !partes[1]
  ) {
    return res.status(401).json({
      mensaje: "Formato de token inválido",
    });
  }

  const token = partes[1];

  try {
    // ------------------------------------
    // Verificar firma y expiración
    // ------------------------------------
    const payload = verificarToken(token);

    // ------------------------------------
    // Asociar usuario a la petición
    // ------------------------------------
    req.usuario = {
      id: Number(payload.sub),
      email: payload.email,
      rol: payload.rol,
    };

    next();
  } catch (error) {
    // Token expirado
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensaje: "Token expirado",
      });
    }

    // Token inválido o alterado
    return res.status(401).json({
      mensaje: "Token inválido",
    });
  }
};

module.exports = autenticarJWT;