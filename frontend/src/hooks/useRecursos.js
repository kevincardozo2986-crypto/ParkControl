import { useCallback, useEffect, useRef, useState } from "react";

// Carga en paralelo varias consultas: { clave: (token, signal) => Promise }.
// Devuelve datos por clave, errores por clave y una función para recargar.
export function useRecursos(token, cargadores) {
  const ref = useRef(cargadores);
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState({ datos: {}, errores: {}, cargando: true });

  // Mantener la referencia actualizada (se declara antes del efecto de carga)
  useEffect(() => { ref.current = cargadores; });

  useEffect(() => {
    const controller = new AbortController();
    const entradas = Object.entries(ref.current);
    Promise.allSettled(entradas.map(([, cargar]) => cargar(token, controller.signal)))
      .then((resultados) => {
        if (controller.signal.aborted) return;
        const datos = {};
        const errores = {};
        resultados.forEach((resultado, i) => {
          const clave = entradas[i][0];
          if (resultado.status === "fulfilled") datos[clave] = resultado.value;
          else errores[clave] = resultado.reason?.message || "Error al consultar";
        });
        setEstado({ datos, errores, cargando: false });
      });
    return () => controller.abort();
  }, [token, version]);

  const recargar = useCallback(() => {
    setEstado((previo) => ({ ...previo, cargando: true }));
    setVersion((v) => v + 1);
  }, []);

  return { ...estado, recargar };
}
