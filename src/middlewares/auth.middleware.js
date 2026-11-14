const { verificarToken } = require("../utils/jwt.util");
const usuariosService = require("../services/usuarios.service");

// ========================================
// Autenticar mediante JWT + PostgreSQL
// ========================================
// 1. Valida formato Bearer, firma y expiración.
// 2. Consulta la cuenta real en PostgreSQL.
// 3. Rechaza cuentas inactivas y tokens emitidos antes
//    de un cambio de contraseña (version_sesion).
// 4. Usa el rol VIGENTE en la base, no el del token.
const autenticarJWT = async (req, res, next) => {
  const authorization = req.get("Authorization");

  if (!authorization) {
    return res.status(401).json({
      mensaje: "Token de autenticación requerido",
    });
  }

  const partes = authorization.trim().split(/\s+/);

  if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
    return res.status(401).json({
      mensaje: "Formato de token inválido",
    });
  }

  try {
    const payload = verificarToken(partes[1]);

    if (typeof payload.sub !== "string" || !/^[1-9]\d*$/.test(payload.sub)) {
      return res.status(401).json({ mensaje: "Token inválido" });
    }

    const usuario = await usuariosService.obtenerUsuarioPorId(payload.sub);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "La cuenta asociada al token no existe",
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: "Usuario deshabilitado" });
    }

    if (
      !Number.isSafeInteger(payload.vs) ||
      payload.vs !== usuario.versionSesion
    ) {
      return res.status(401).json({ mensaje: "Sesión revocada" });
    }

    req.usuario = {
      id: String(usuario.id),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ mensaje: "Token expirado" });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({ mensaje: "Token inválido" });
    }

    return next(error);
  }
};

module.exports = autenticarJWT;
