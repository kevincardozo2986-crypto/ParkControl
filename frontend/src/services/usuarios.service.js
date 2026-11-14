import { solicitud } from "./http";

export function listarUsuarios(token, filtros = {}) {
  const params = new URLSearchParams();
  for (const campo of ["q", "rol", "activo", "pagina"]) {
    if (filtros[campo] !== undefined && filtros[campo] !== "") params.set(campo, String(filtros[campo]));
  }
  return solicitud(`/api/usuarios?${params}`, { token });
}

export const crearUsuario = (token, datos) => solicitud("/api/usuarios", { token, method: "POST", body: datos });
export const editarUsuario = (token, id, datos) => solicitud(`/api/usuarios/${id}`, { token, method: "PUT", body: datos });
export const cambiarEstadoUsuario = (token, id, activo) => solicitud(`/api/usuarios/${id}/estado`, { token, method: "PATCH", body: { activo } });

export const eliminarUsuario = (token, id) => solicitud(`/api/usuarios/${id}`, { token, method: "DELETE" });
