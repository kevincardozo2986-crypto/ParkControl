// ========================================
// Middleware de autorización por roles
// ========================================

const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {

    // Verificar que exista un usuario autenticado
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    // Verificar si tiene un rol permitido
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: "No tiene permisos para realizar esta operación"
      });
    }

    next();
  };
};

module.exports = autorizarRoles;