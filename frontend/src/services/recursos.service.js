// Funciones HTTP por recurso de ParkControl.
import { listar, solicitud } from "./http";

const enviar = (ruta, token, method, body) => solicitud(ruta, { token, method, body });

// Conductores
export const listarConductores = (token, signal) => listar("/api/conductores", token, signal);
export const crearConductor = (token, datos) => enviar("/api/conductores", token, "POST", datos);
export const actualizarConductor = (token, id, datos) => enviar(`/api/conductores/${id}`, token, "PUT", datos);
export const eliminarConductor = (token, id) => enviar(`/api/conductores/${id}`, token, "DELETE");

// Vehículos
export const listarVehiculos = (token, signal) => listar("/api/vehiculos", token, signal);
export const crearVehiculo = (token, datos) => enviar("/api/vehiculos", token, "POST", datos);
export const actualizarVehiculo = (token, id, datos) => enviar(`/api/vehiculos/${id}`, token, "PUT", datos);
export const eliminarVehiculo = (token, id) => enviar(`/api/vehiculos/${id}`, token, "DELETE");

// Espacios
export const listarEspacios = (token, signal) => listar("/api/espacios", token, signal);
export const crearEspacio = (token, datos) => enviar("/api/espacios", token, "POST", datos);
export const actualizarEspacio = (token, id, datos) => enviar(`/api/espacios/${id}`, token, "PUT", datos);
export const eliminarEspacio = (token, id) => enviar(`/api/espacios/${id}`, token, "DELETE");

// Estancias
export const listarEstancias = (token, signal) => listar("/api/estancias", token, signal);
export const registrarEntrada = (token, datos) => enviar("/api/estancias/entrada", token, "POST", datos);
export const registrarSalida = (token, id) => enviar(`/api/estancias/${id}/salida`, token, "PATCH");

// Pagos
export const listarPagos = (token, signal) => listar("/api/pagos", token, signal);
export const registrarPago = (token, datos) => enviar("/api/pagos", token, "POST", datos);

// Estadísticas
export const resumenParqueadero = (token, signal) => solicitud("/api/estadisticas/resumen", { token, signal });
