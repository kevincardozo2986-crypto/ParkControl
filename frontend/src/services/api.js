// Solicitud de login al backend; usa VITE_API_URL.
import { solicitud } from "./http";

export async function iniciarSesion(email, password) {
  const datos = await solicitud("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!datos.token || !datos.usuario) {
    throw new Error("La respuesta de autenticación está incompleta.");
  }
  return datos;
}
