const usuarios = require("../data/usuarios");

const {
  generarPasswordHash,
  verificarPassword,
} = require("../utils/password.util");

// ========================================
// Buscar usuario por email
// ========================================
const buscarPorEmail = (email) => {
  return usuarios.find(
    (usuario) =>
      usuario.email.toLowerCase() === email.toLowerCase(),
  );
};

// ========================================
// Crear usuario
// ========================================
const crearUsuario = async ({
  nombre,
  email,
  password,
}) => {
  // Verificar si el correo ya existe
  const usuarioExistente = buscarPorEmail(email);

  if (usuarioExistente) {
    const error = new Error(
      "El correo ya se encuentra registrado",
    );

    error.status = 409;
    throw error;
  }

  // Generar hash con bcrypt
  const passwordHash =
    await generarPasswordHash(password);

  // Crear usuario
  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    email: email.toLowerCase(),
    passwordHash,

    // Datos necesarios para JWT
    rol: "usuario",
    activo: true,
  };

  usuarios.push(nuevoUsuario);

  // Nunca devolver passwordHash
  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol,
    activo: nuevoUsuario.activo,
  };
};

// ========================================
// Autenticar usuario
// ========================================
const autenticarUsuario = async (
  email,
  password,
) => {
  const usuario = buscarPorEmail(email);

  // Usuario inexistente
  if (!usuario) {
    return null;
  }

  // Comparar contraseña con bcrypt
  const passwordValida =
    await verificarPassword(
      password,
      usuario.passwordHash,
    );

  // Contraseña incorrecta
  if (!passwordValida) {
    return null;
  }

  // Usuario deshabilitado
  if (!usuario.activo) {
    return null;
  }

  // Nunca devolver passwordHash
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
  };
};

module.exports = {
  buscarPorEmail,
  crearUsuario,
  autenticarUsuario,
};