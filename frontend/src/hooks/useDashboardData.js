import { useRecursos } from "./useRecursos";
import {
  listarEspacios,
  listarEstancias,
  listarPagos,
  resumenParqueadero,
} from "../services/recursos.service";

// Fuentes de datos del dashboard según el rol autenticado
const cargadoresPorRol = {
  administrador: { resumen: resumenParqueadero, estancias: listarEstancias, espacios: listarEspacios, pagos: listarPagos },
  operador: { resumen: resumenParqueadero, estancias: listarEstancias, espacios: listarEspacios, pagos: listarPagos },
};

export function useDashboardData(token, rol) {
  const { datos, errores, cargando, recargar } = useRecursos(token, cargadoresPorRol[rol] ?? {});
  return { datos, errores, cargando, actualizar: recargar };
}
