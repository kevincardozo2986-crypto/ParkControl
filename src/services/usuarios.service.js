
const usuarios = require("../data/usuarios");

const {
  generarPasswordHash,
  verificarPassword,
} = require("../utils/password.util");

const buscarPorEmail = (email) => {
  return usuarios.find(
    (usuario) =>
      usuario.email.toLowerCase() === email.toLowerCase()
  );
};

const siguienteId = () => {
  return usuarios.length > 0
    ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
    : 1;
};

const datosPublicos = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  activo: usuario.activo,
});

const guardarUsuario = async ({
  nombre,
  email,
  password,
  rol,
}) => {
  const emailNormalizado = email.trim().toLowerCase();

  if (buscarPorEmail(emailNormalizado)) {
    const error = new Error(
      "El correo ya se encuentra registrado"
    );
    error.status = 409;
    throw error;
  }

  const passwordHash = await generarPasswordHash(password);

  const nuevoUsuario = {
    id: siguienteId(),
    nombre: nombre.trim(),
    email: emailNormalizado,
    passwordHash,
    rol,
    activo: true,
  };

  usuarios.push(nuevoUsuario);

  return datosPublicos(nuevoUsuario);
};

// Registro público: SIEMPRE usuario normal.
const crearUsuario = async ({
  nombre,
  email,
  password,
}) => {
  return guardarUsuario({
    nombre,
    email,
    password,
    rol: "usuario",
  });
};

// Creación administrativa: permite roles autorizados.
const crearUsuarioAdministrativo = async ({
  nombre,
  email,
  password,
  rol,
}) => {
  const rolesPermitidos = [
    "usuario",
    "administrador",
  ];

  if (!rolesPermitidos.includes(rol)) {
    const error = new Error("Rol no permitido");
    error.status = 400;
    throw error;
  }

  return guardarUsuario({
    nombre,
    email,
    password,
    rol,
  });
};

const autenticarUsuario = async (
  email,
  password,
) => {
  const usuario = buscarPorEmail(email);

  if (!usuario || !usuario.activo) {
    return null;
  }

  const passwordValida = await verificarPassword(
    password,
    usuario.passwordHash
  );

  if (!passwordValida) {
    return null;
  }

  return datosPublicos(usuario);
};

const crearAdministradorInicial = async () => {
  const nombre = process.env.ADMIN_NOMBRE;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    console.warn("Administrador inicial no configurado");
    return null;
  }

  const existente = buscarPorEmail(email);

  if (existente) {
    return existente;
  }

  const passwordHash = await generarPasswordHash(password);

  const administrador = {
    id: siguienteId(),
    nombre,
    email: email.trim().toLowerCase(),
    passwordHash,
    rol: "administrador",
    activo: true,
  };

  usuarios.push(administrador);

  console.log("Administrador inicial creado");

  return administrador;
};

module.exports = {
  buscarPorEmail,
  crearUsuario,
  crearUsuarioAdministrativo,
  autenticarUsuario,
  crearAdministradorInicial,
};
