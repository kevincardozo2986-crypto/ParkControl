import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import GarajeHero from "./GarajeHero";
import LogoCarro from "./ui/LogoCarro";

// Pantalla dividida (oscura) para login y recuperación de contraseña
export default function AuthLayout({ titulo, descripcion, children, sacudir }) {
  return (
    <div className="pc-auth">
      <aside className="pc-auth-show">
        <div className="pc-auth-centro">
          <div className="pc-auth-hero">
            <h2>Cada vehículo, bajo control.</h2>
            <p>Entradas, salidas, ocupación y cobros del parqueadero en un solo lugar.</p>
          </div>
          <GarajeHero />
          <div className="pc-tiles">
            <div className="pc-tile pc-tile-big">
              <div>
                <b>Ocupación<span className="pc-barras" aria-hidden="true"><i /><i /><i /><i className="off" /></span></b>
                <small>En vivo, por zona y tipo</small>
              </div>
              <span className="pc-tile-sep" aria-hidden="true" />
              <div>
                <b>Cobro<span>/ hora</span></b>
                <small>Calculado en el servidor</small>
              </div>
            </div>
            <div className="pc-tile pc-tile-small"><span className="pc-tile-icon"><LockKeyhole /></span><div><strong>Sesión</strong><small>Protegida con JWT</small></div></div>
            <div className="pc-tile pc-tile-small"><span className="pc-tile-icon"><Users /></span><div><strong>2 roles</strong><small>Administrador · operador</small></div></div>
          </div>
        </div>

      </aside>

      <main className="pc-auth-form">
        <div className={`pc-auth-card ${sacudir ? "pc-sacudir" : ""}`} key={sacudir || "card"}>
          <span className="pc-auth-orbe" aria-hidden="true"><LogoCarro tamano={56} /></span>
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
          {children}
          <div className="pc-auth-foot"><span title="La sesión se cierra al cerrar la pestaña"><ShieldCheck />Conexión segura · sesión con JWT</span></div>
        </div>
      </main>
    </div>
  );
}

// Campo de texto con icono a la izquierda
export function Campo({ id, etiqueta, icono: Icono, accion, ...resto }) {
  return (
    <div className="mb-3">
      <div className="pc-label-fila">
        <label className="form-label" htmlFor={id}>{etiqueta}</label>
        {accion}
      </div>
      <div className="pc-campo">
        {Icono && <Icono className="pc-campo-icono" aria-hidden="true" />}
        <input id={id} className="form-control" {...resto} />
      </div>
    </div>
  );
}

// Contraseña con mostrar/ocultar y aviso de Bloq Mayús
export function CampoPassword({ id, etiqueta, valor, onCambio, autoComplete = "current-password", ayuda, accion, ...resto }) {
  const [ver, setVer] = useState(false);
  const [mayus, setMayus] = useState(false);
  const revisar = (e) => setMayus(Boolean(e.getModifierState?.("CapsLock")));
  return (
    <div className="mb-3">
      <div className="pc-label-fila">
        <label className="form-label" htmlFor={id}>{etiqueta}</label>
        {accion}
      </div>
      <div className="pc-campo pc-pass">
        <LockKeyhole className="pc-campo-icono" aria-hidden="true" />
        <input id={id} className="form-control" type={ver ? "text" : "password"} autoComplete={autoComplete}
          value={valor} onChange={(e) => onCambio(e.target.value)} onKeyUp={revisar} onKeyDown={revisar} onBlur={() => setMayus(false)}
          required aria-describedby={mayus ? `${id}-mayus` : undefined} {...resto} />
        <button type="button" className="pc-icon-btn" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {ver ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {mayus && <div className="pc-mayus" id={`${id}-mayus`} role="status"><TriangleAlert />Bloq Mayús está activado</div>}
      {ayuda && <div className="form-text">{ayuda}</div>}
    </div>
  );
}
