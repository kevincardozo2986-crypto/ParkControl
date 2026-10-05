const {
  crearUsuario,
  autenticarUsuario,
} = require("../services/usuarios.service");

const {
  generarToken,
} = require("../utils/jwt.util");

// ========================================
// Registrar usuario
// ========================================
const registrar = async (req, res, next) => {
  try {
    const {
      nombre,
      email,
      password,
    } = req.body;

    const usuario = await crearUsuario({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
    });

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// Iniciar sesión
// ========================================
const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const usuario = await autenticarUsuario(
      email.trim(),
      password,
    );

    // Credenciales incorrectas
    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales inválidas",
      });
    }

    // Generar JWT
    const token = generarToken(usuario);

    // Login correcto
    return res.status(200).json({
      mensaje: "Autenticación correcta",
      usuario,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrar,
  login,
};