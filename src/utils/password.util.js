const bcrypt = require("bcrypt");

// ========================================
// Configuración de bcrypt
// ========================================
const SALT_ROUNDS = 12;

// ========================================
// Generar hash de contraseña
// ========================================
const generarPasswordHash = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// ========================================
// Verificar contraseña
// ========================================
const verificarPassword = async (
  password,
  passwordHash
) => {
  return bcrypt.compare(password, passwordHash);
};

module.exports = {
  generarPasswordHash,
  verificarPassword,
};