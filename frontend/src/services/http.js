// Cliente HTTP único: evita repetir fetch() en cada componente.
// Solo envía el JWT (Authorization: Bearer). El navegador NO usa API Keys.
import { notificarSesionInvalida } from "./sesion-expirada";

export const API_URL = import.meta.env.VITE_API_URL;

// Extrae un mensaje legible de los distintos formatos de error de la API
function mensajeError(datos, status) {
  const detalles = datos?.error?.detalles ?? datos?.errores;
  if (Array.isArray(detalles) && detalles.length) {
    return [...new Set(detalles.map((d) => d.msg).filter(Boolean))].join(". ");
  }
  return datos?.mensaje || datos?.error?.mensaje || `Error HTTP ${status}`;
}

export async function solicitud(ruta, { token, method = "GET", body, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No fue posible conectar con la API ParkControl.", { cause: error });
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    notificarSesionInvalida(respuesta, datos, token);
    let mensaje = mensajeError(datos, respuesta.status);
    if (respuesta.status === 429) {
      const espera = Number(respuesta.headers.get("Retry-After"));
      mensaje = "Se alcanzó el límite de intentos." +
        (Number.isFinite(espera) && espera > 0
          ? ` Espera aproximadamente ${Math.ceil(espera / 60)} minuto(s).`
          : " Espera unos minutos antes de volver a intentar.");
    }
    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

// GET que debe devolver una lista
export async function listar(ruta, token, signal) {
  const datos = await solicitud(ruta, { token, signal });
  if (!Array.isArray(datos)) throw new Error("El servidor no devolvió una lista de registros");
  return datos;
}
