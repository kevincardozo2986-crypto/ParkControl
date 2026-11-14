import { solicitud } from "./http";

export const consultarPerfil = (token, signal) => solicitud("/api/auth/perfil", { token, signal });

export const cambiarPassword = (token, datos) =>
  solicitud("/api/auth/cambiar-password", { token, method: "PATCH", body: datos });

export const estadoCodigos = (token, signal) =>
  solicitud("/api/auth/codigos-recuperacion/estado", { token, signal });

export const generarCodigos = (token, passwordActual, regenerar) =>
  solicitud(regenerar ? "/api/auth/codigos-recuperacion/regenerar" : "/api/auth/codigos-recuperacion", {
    token, method: "POST", body: { passwordActual },
  });

export const restablecerConCodigo = (datos) =>
  solicitud("/api/auth/restablecer-con-codigo", { method: "POST", body: datos });

// Recuperación administrativa
export const generarTokenRecuperacionAdmin = (usuarioId, token) =>
  solicitud(`/api/auth/recuperacion/admin/${encodeURIComponent(usuarioId)}`, { token, method: "POST" });

export const restablecerConTokenAdmin = (datos) =>
  solicitud("/api/auth/restablecer-password", { method: "POST", body: datos });

// Solo el administrador puede consultar el directorio mínimo de cuentas.
export const buscarUsuariosRecuperacion = (texto, token, signal) =>
  solicitud(`/api/usuarios/busqueda-recuperacion?q=${encodeURIComponent(texto)}`, { token, signal });
