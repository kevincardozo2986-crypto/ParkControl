import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Clock, House, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAhora } from "../hooks/useAhora";
import { GRUPOS, MODULOS, modulosDeRol } from "./modulos";
import { Avatar } from "../components/ui/elementos";
import LogoCarro from "../components/ui/LogoCarro";
import { ROLES, incluye } from "../components/formato";
import Inicio from "../components/Inicio";
import GestionUsuarios from "../components/GestionUsuarios";
import GestionConductores from "../components/GestionConductores";
import GestionVehiculos from "../components/GestionVehiculos";
import GestionEspacios from "../components/GestionEspacios";
import GestionEstancias from "../components/GestionEstancias";
import GestionPagos from "../components/GestionPagos";
import PerfilPropio from "../components/PerfilPropio";
import CodigosRecuperacion from "../components/CodigosRecuperacion";
import CambiarPassword from "../components/CambiarPassword";
import RecuperacionAdministrativa from "../components/RecuperacionAdministrativa";

const reloj = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Modulo({ ruta, ...p }) {
  switch (ruta) {
    case "/dashboard": return <Inicio {...p} />;
    case "/usuarios": return <GestionUsuarios {...p} />;
    case "/conductores": return <GestionConductores {...p} />;
    case "/vehiculos": return <GestionVehiculos {...p} />;
    case "/espacios": return <GestionEspacios {...p} />;
    case "/estancias": return <GestionEstancias {...p} />;
    case "/pagos": return <GestionPagos {...p} />;
    case "/mi-perfil": return <PerfilPropio {...p} />;
    case "/recuperacion-administrativa": return <RecuperacionAdministrativa {...p} />;
    case "/codigos-recuperacion": return <CodigosRecuperacion {...p} />;
    case "/cambiar-password": return <CambiarPassword {...p} />;
    default: return null;
  }
}

// Buscador de módulos (Ctrl + K)
function BuscadorModulos({ modulos, abrir }) {
  const [texto, setTexto] = useState("");
  const [foco, setFoco] = useState(false);
  const [indice, setIndice] = useState(0);
  const ref = useRef(null);
  const resultados = texto.trim() ? modulos.filter((m) => incluye(`${m.titulo} ${m.detalle} ${m.grupo}`, texto)).slice(0, 6) : [];

  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  function ir(m) { abrir(m.ruta); setTexto(""); ref.current?.blur(); }

  return (
    <div className="pc-search">
      <Search />
      <input ref={ref} className="form-control" placeholder="Buscar módulo…" value={texto} aria-label="Buscar módulo"
        onChange={(e) => { setTexto(e.target.value); setIndice(0); }}
        onFocus={() => setFoco(true)} onBlur={() => setTimeout(() => setFoco(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setIndice((i) => Math.min(i + 1, resultados.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIndice((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter" && resultados[indice]) ir(resultados[indice]);
          if (e.key === "Escape") { setTexto(""); e.currentTarget.blur(); }
        }} />
      {!texto && <kbd aria-hidden="true">Ctrl K</kbd>}
      {foco && resultados.length > 0 && (
        <div className="pc-search-results" role="listbox">
          {resultados.map((m, i) => {
            const Icono = m.icono;
            return <button key={m.ruta} type="button" role="option" aria-selected={i === indice} className={i === indice ? "activo" : ""} onMouseDown={() => ir(m)}><Icono /><span>{m.titulo}</span><small>{m.grupo}</small></button>;
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { usuario, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ahora = useAhora(30000);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const rol = usuario?.rol;
  const disponibles = useMemo(() => modulosDeRol(rol), [rol]);
  const solicitado = MODULOS.find((m) => m.ruta === location.pathname) ?? MODULOS[0];
  // Un módulo de otro rol no se renderiza (el backend también lo rechazaría con 403)
  const permitido = solicitado.roles.includes(rol);
  const modulo = permitido ? solicitado : MODULOS[0];
  const nombre = usuario?.nombre || "Usuario";

  function cerrarSesion() {
    logout();
    navigate("/login", { replace: true });
  }

  function abrir(ruta) {
    navigate(ruta ?? "/dashboard");
    setMenuAbierto(false);
    window.scrollTo(0, 0);
  }

  return (
    <div className="pc-layout">
      {menuAbierto && <button className="pc-overlay" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
      <aside className={`pc-sidebar ${menuAbierto ? "abierto" : ""}`}>
        <div className="pc-brand">
          <LogoCarro tamano={38} />
          <span><strong>ParkControl</strong><small>Gestión de parqueadero</small></span>
        </div>
        <nav className="pc-nav" aria-label="Navegación principal">
          {GRUPOS.map((grupo) => {
            const items = disponibles.filter((m) => m.grupo === grupo);
            if (!items.length) return null;
            return (
              <div className="pc-nav-group" key={grupo}>
                <div className="pc-nav-label">{grupo}</div>
                {items.map((m) => {
                  const Icono = m.icono;
                  return (
                    <button key={m.ruta} className={`pc-nav-item ${modulo.ruta === m.ruta ? "activo" : ""}`} aria-current={modulo.ruta === m.ruta ? "page" : undefined} onClick={() => abrir(m.ruta)}>
                      <Icono />{m.titulo}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="pc-side-user">
          <Avatar nombre={nombre} />
          <span style={{ minWidth: 0 }}>
            <strong className="text-truncate d-block">{nombre}</strong>
            <small>{ROLES[rol]?.etiqueta ?? rol}</small>
          </span>
          <button className="pc-icon-btn" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut /></button>
        </div>
      </aside>

      <div className="pc-main">
        <header className="pc-topbar">
          <button className="pc-icon-btn pc-menu-toggle" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><Menu /></button>
          <div className="pc-crumbs">
            <House />
            {modulo.ruta !== "/dashboard" && <><span className="d-none d-md-inline">{modulo.grupo}</span><ChevronRight className="d-none d-md-inline" /></>}
            <strong>{modulo.titulo}</strong>
          </div>
          <BuscadorModulos modulos={disponibles} abrir={abrir} />
          <span className="pc-clock"><Clock />{reloj.format(ahora)}</span>
        </header>

        <main className="pc-content">
          {!permitido && <div className="pc-aviso tono-ambar" role="alert">Tu rol no tiene acceso a «{solicitado.titulo}». Te mostramos el panel principal.</div>}
          <Modulo ruta={modulo.ruta} token={token} usuario={usuario} rol={rol} abrir={abrir} />
        </main>
        <footer className="pc-footer">ParkControl · Sesión protegida con JWT · Los permisos se validan en el servidor</footer>
      </div>
    </div>
  );
}
