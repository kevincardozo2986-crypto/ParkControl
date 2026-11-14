// Piezas visuales reutilizables del sistema de diseño de ParkControl.
import { CircleAlert, Inbox } from "lucide-react";
import { colorAvatar, iniciales } from "../formato";

export function PageHeader({ titulo, descripcion, children }) {
  return (
    <div className="pc-page-head">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="pc-page-actions">{children}</div>}
    </div>
  );
}

export function Card({ titulo, descripcion, acciones, children, pie, className = "", cuerpo = true }) {
  return (
    <section className={`pc-card ${className}`}>
      {(titulo || acciones) && (
        <div className="pc-card-head">
          <div>{titulo && <h2>{titulo}</h2>}{descripcion && <p>{descripcion}</p>}</div>
          {acciones && <div className="d-flex gap-2 align-items-center">{acciones}</div>}
        </div>
      )}
      {cuerpo ? <div className="pc-card-body">{children}</div> : children}
      {pie && <div className="pc-card-foot">{pie}</div>}
    </section>
  );
}

export function StatCard({ etiqueta, valor, sufijo, icono: Icono, tono = "tono-azul", pie, medidor, cargando }) {
  return (
    <article className="pc-card pc-stat">
      <div className="pc-stat-top">
        <span className="pc-stat-label">{etiqueta}</span>
        {Icono && <span className={`pc-stat-icon ${tono}`}><Icono /></span>}
      </div>
      {cargando ? <span className="pc-skel" style={{ height: 28, width: "55%" }} /> : (
        <div className="pc-stat-value">{valor ?? "—"}{sufijo && <small> {sufijo}</small>}</div>
      )}
      {medidor != null && <div className="pc-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, medidor))}%` }} /></div>}
      {pie && <div className="pc-stat-foot">{pie}</div>}
    </article>
  );
}

export function Badge({ tono = "tono-gris", children, punto = true, titulo }) {
  return <span className={`pc-badge ${tono} ${punto ? "" : "sin-punto"}`} title={titulo}>{children}</span>;
}

export function Placa({ valor, grande = false }) {
  return <span className={`pc-placa ${grande ? "pc-placa-lg" : ""}`} aria-label={`Placa ${valor}`}>{valor}</span>;
}

export function Avatar({ nombre, tamano }) {
  return (
    <span className="pc-avatar" style={{ ...colorAvatar(nombre), ...(tamano ? { width: tamano, height: tamano } : {}) }} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}

export function Persona({ nombre, detalle }) {
  return (
    <div className="pc-persona">
      <Avatar nombre={nombre} />
      <div style={{ minWidth: 0 }}><strong>{nombre}</strong>{detalle && <small>{detalle}</small>}</div>
    </div>
  );
}

export function EmptyState({ icono: Icono = Inbox, titulo, texto, children }) {
  return (
    <div className="pc-empty">
      <div className="pc-empty-icon"><Icono /></div>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

export function FilasCarga({ columnas, filas = 4 }) {
  return Array.from({ length: filas }, (_, i) => (
    <tr key={i}>{Array.from({ length: columnas }, (_, j) => <td key={j}><span className="pc-skel" style={{ width: `${50 + ((i + j) % 4) * 12}%` }} /></td>)}</tr>
  ));
}

export function ErrorBox({ mensaje }) {
  if (!mensaje) return null;
  return <div className="pc-error" role="alert"><CircleAlert /><span>{mensaje}</span></div>;
}
