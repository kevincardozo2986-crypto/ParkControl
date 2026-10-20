
const {
  crearUsuario,
  crearUsuarioAdministrativo,
  autenticarUsuario,
} = require("../services/usuarios.service");

const {
  generarToken,
} = require("../utils/jwt.util");

// Registro público
const registrar = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const usuario = await crearUsuario({
      nombre,
      email,
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

// Creación de usuarios por administrador
const crearPorAdministrador = async (req, res, next) => {
  try {
    const {
      nombre,
      email,
      password,
      rol,
    } = req.body;

    const usuario = await crearUsuarioAdministrativo({
      nombre,
      email,
      password,
      rol,
    });

    return res.status(201).json({
      mensaje: "Usuario creado por el administrador",
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

// Inicio de sesión
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await autenticarUsuario(
      email.trim(),
      password
    );

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales inválidas",
      });
    }

    const token = generarToken(usuario);

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
  crearPorAdministrador,
  login,
};
