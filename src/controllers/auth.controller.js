const { matchedData } = require("express-validator");

const usuariosService = require("../services/usuarios.service");
const passwordResetService = require("../services/passwordReset.service");
const codigosService = require("../services/codigosRecuperacion.service");
const { generarToken } = require("../utils/jwt.util");

// ========================================
// Login
// ========================================
const login = async (req, res, next) => {
  try {
    const { email, password } = matchedData(req, { locations: ["body"] });
    const usuario = await usuariosService.verificarCredenciales(email, password);

    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: "Usuario deshabilitado" });
    }

    const token = generarToken(usuario);

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      mensaje: "Autenticación correcta",
      usuario: usuariosService.datosPublicos(usuario),
      token,
    });
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Perfil del usuario autenticado
// ========================================
const perfil = (req, res) => {
  res.set("Cache-Control", "no-store");

  return res.status(200).json({
    mensaje: "Usuario autenticado mediante JWT",
    usuario: req.usuario,
  });
};

// ========================================
// Cambiar contraseña propia
// ========================================
const cambiarPassword = async (req, res, next) => {
  try {
    const datos = matchedData(req, { locations: ["body"] });
    const resultado = await usuariosService.cambiarPasswordPropio(
      req.usuario.id,
      datos.passwordActual,
      datos.passwordNueva,
    );

    if (["CLAVE_INCORRECTA", "NO_AUTORIZADO"].includes(resultado.estado)) {
      return res.status(401).json({ mensaje: "Contraseña actual inválida" });
    }

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({ mensaje: "La nueva contraseña debe ser diferente" });
    }

    if (resultado.estado === "CONFLICTO") {
      return res.status(409).json({
        mensaje: "La contraseña cambió durante la operación; inténtelo nuevamente",
      });
    }

    return res.status(200).json({
      mensaje: "Contraseña actualizada. Inicie sesión nuevamente.",
    });
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Recuperación administrativa
// ========================================
const generarRecuperacionAdmin = async (req, res, next) => {
  try {
    const { usuarioId } = matchedData(req, { locations: ["params"] });
    const resultado = await passwordResetService.generarRecuperacion(
      usuarioId,
      req.usuario.id,
    );

    if (resultado.estado === "NO_ENCONTRADO") {
      return res.status(404).json({ mensaje: "Usuario no encontrado o inactivo" });
    }

    res.set("Cache-Control", "no-store");

    return res.status(201).json({
      mensaje: "Token generado. Entréguelo únicamente al titular verificado.",
      token: resultado.token,
      expiraEn: resultado.expiraEn,
    });
  } catch (error) {
    return next(error);
  }
};

const restablecerPassword = async (req, res, next) => {
  try {
    const { token, passwordNueva } = matchedData(req, { locations: ["body"] });
    const resultado = await passwordResetService.restablecerPassword(token, passwordNueva);

    if (resultado.estado === "TOKEN_INVALIDO") {
      return res.status(400).json({ mensaje: "Token inválido, utilizado o expirado" });
    }

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({ mensaje: "La nueva contraseña debe ser diferente" });
    }

    return res.status(200).json({
      mensaje: "Contraseña restablecida. Inicie sesión nuevamente.",
    });
  } catch (error) {
    return next(error);
  }
};

// ========================================
// Códigos de recuperación
// ========================================
const generarCodigos = async (req, res, next) => {
  try {
    const { passwordActual } = matchedData(req, { locations: ["body"] });
    const resultado = await codigosService.generar(req.usuario.id, passwordActual);

    if (resultado.estado !== "OK") {
      return res.status(401).json({ mensaje: "Reautenticación incorrecta" });
    }

    res.set("Cache-Control", "no-store");

    return res.status(201).json({
      mensaje: "Guarde estos códigos. No se mostrarán nuevamente.",
      codigos: resultado.codigos,
    });
  } catch (error) {
    return next(error);
  }
};

const estadoCodigos = async (req, res, next) => {
  try {
    return res.status(200).json({
      disponibles: await codigosService.estado(req.usuario.id),
    });
  } catch (error) {
    return next(error);
  }
};

const restablecerConCodigo = async (req, res, next) => {
  try {
    const { email, codigo, passwordNueva } = matchedData(req, { locations: ["body"] });
    const resultado = await codigosService.restablecer(email, codigo, passwordNueva);

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({ mensaje: "La nueva contraseña debe ser diferente" });
    }

    if (resultado.estado !== "OK") {
      return res.status(400).json({ mensaje: "Código o cuenta inválidos" });
    }

    return res.status(200).json({
      mensaje: "Contraseña restablecida. Inicie sesión nuevamente.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  perfil,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos,
  estadoCodigos,
  restablecerConCodigo,
};
