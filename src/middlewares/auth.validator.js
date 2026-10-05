// ========================================
// Validar registro de usuario
// ========================================
const validarRegistro = (req, res, next) => {
  const { nombre, email, password } = req.body;

  // Validar nombre
  if (
    !nombre ||
    typeof nombre !== "string" ||
    nombre.trim().length < 2
  ) {
    return res.status(400).json({
      mensaje:
        "El nombre es obligatorio y debe tener al menos 2 caracteres",
    });
  }

  // Validar email
  if (
    !email ||
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return res.status(400).json({
      mensaje: "Debe proporcionar un email válido",
    });
  }

  // Validar contraseña
  if (
    !password ||
    typeof password !== "string" ||
    password.length < 10
  ) {
    return res.status(400).json({
      mensaje:
        "La contraseña debe tener al menos 10 caracteres",
    });
  }

  next();
};

// ========================================
// Validar login
// ========================================
const validarLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (
    !email ||
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return res.status(400).json({
      mensaje: "Debe proporcionar un email válido",
    });
  }

  if (
    !password ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      mensaje: "La contraseña es obligatoria",
    });
  }

  next();
};

module.exports = {
  validarRegistro,
  validarLogin,
};