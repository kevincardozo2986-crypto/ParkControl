import { useCallback, useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { FeedbackContext } from "./feedback-context";
import Modal from "./Modal";

const ICONOS = { exito: CircleCheck, error: CircleAlert, info: Info };

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialogo, setDialogo] = useState(null);
  const resolver = useRef(null);
  const siguiente = useRef(0);

  const cerrarToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback((tipo, titulo, detalle) => {
    const id = ++siguiente.current;
    setToasts((t) => [...t.slice(-3), { id, tipo, titulo, detalle }]);
    setTimeout(() => cerrarToast(id), tipo === "error" ? 7000 : 4500);
  }, [cerrarToast]);

  const toast = useMemo(() => ({
    exito: (titulo, detalle) => mostrar("exito", titulo, detalle),
    error: (titulo, detalle) => mostrar("error", titulo, detalle),
    info: (titulo, detalle) => mostrar("info", titulo, detalle),
  }), [mostrar]);

  const confirmar = useCallback((opciones) => new Promise((resolve) => {
    resolver.current = resolve;
    setDialogo(opciones);
  }), []);

  const responder = useCallback((valor) => {
    resolver.current?.(valor);
    resolver.current = null;
    setDialogo(null);
  }, []);

  const valor = useMemo(() => ({ toast, confirmar }), [toast, confirmar]);

  return (
    <FeedbackContext.Provider value={valor}>
      {children}

      <Modal abierto={Boolean(dialogo)} pequeno titulo={dialogo?.titulo} descripcion={dialogo?.mensaje}
        icono={<TriangleAlert />} tono={dialogo?.peligro ? "tono-rojo" : "tono-ambar"}
        onCerrar={() => responder(false)}
        pie={<>
          <button type="button" className="pc-btn pc-btn-secondary" onClick={() => responder(false)}>Cancelar</button>
          <button type="button" className={`pc-btn ${dialogo?.peligro ? "pc-btn-danger" : "pc-btn-primary"}`} onClick={() => responder(true)}>{dialogo?.accion || "Confirmar"}</button>
        </>} />

      <div className="pc-toasts" aria-live="polite">
        {toasts.map((t) => {
          const Icono = ICONOS[t.tipo];
          return (
            <div key={t.id} className={`pc-toast ${t.tipo}`} role={t.tipo === "error" ? "alert" : "status"}>
              <Icono />
              <div><strong>{t.titulo}</strong>{t.detalle && <span>{t.detalle}</span>}</div>
              <button type="button" className="pc-icon-btn" aria-label="Cerrar notificación" onClick={() => cerrarToast(t.id)}><X /></button>
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}
