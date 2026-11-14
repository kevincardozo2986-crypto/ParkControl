import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Diálogo accesible: Escape cierra, foco inicial dentro, clic fuera cierra.
export default function Modal({ abierto, titulo, descripcion, icono, tono = "tono-azul", onCerrar, children, pie, pequeno = false, onSubmit }) {
  const id = useId();
  const ref = useRef(null);
  const cerrarRef = useRef(onCerrar);
  useEffect(() => { cerrarRef.current = onCerrar; });

  // Solo al abrir: enfocar el primer campo y escuchar Escape
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement;
    const enfocable = ref.current?.querySelector("input:not([type=checkbox]), select, textarea, button:not(.pc-modal-cerrar)");
    enfocable?.focus();
    const tecla = (e) => { if (e.key === "Escape") cerrarRef.current?.(); };
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      previo?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;
  const Contenedor = onSubmit ? "form" : "div";

  return (
    <div className="pc-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar?.(); }}>
      <Contenedor ref={ref} className={`pc-modal ${pequeno ? "pc-modal-sm" : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}
        {...(onSubmit ? { onSubmit: (e) => { e.preventDefault(); onSubmit(e); } } : {})}>
        <div className="pc-modal-head">
          {icono && <span className={`pc-modal-icon ${tono}`}>{icono}</span>}
          <div>
            <h2 id={`${id}-t`}>{titulo}</h2>
            {descripcion && <p>{descripcion}</p>}
          </div>
          <button type="button" className="pc-icon-btn pc-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}><X /></button>
        </div>
        {children && <div className="pc-modal-body">{children}</div>}
        {pie && <div className="pc-modal-foot">{pie}</div>}
      </Contenedor>
    </div>
  );
}
