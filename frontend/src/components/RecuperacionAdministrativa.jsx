import { useEffect, useState } from "react";
import { Copy, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useFeedback";
import { buscarUsuariosRecuperacion, generarTokenRecuperacionAdmin } from "../services/seguridad.service";
import { Badge, Card, EmptyState, ErrorBox, PageHeader, Persona } from "./ui/elementos";
import { ROLES } from "./formato";

export default function RecuperacionAdministrativa() {
  const { token, usuario } = useAuth();
  const toast = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (busqueda.trim().length < 2 || !token || usuario?.rol !== "administrador") return;
    const controller = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const datos = await buscarUsuariosRecuperacion(busqueda.trim(), token, controller.signal);
        if (!controller.signal.aborted) setUsuarios(datos.usuarios ?? []);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || "Error al buscar usuarios.");
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 350);
    return () => { clearTimeout(temporizador); controller.abort(); };
  }, [busqueda, token, usuario?.rol]);

  async function generar(evento) {
    evento.preventDefault();
    if (!confirmado || !seleccionado) return;
    setError(""); setResultado(null); setCargando(true);
    try {
      setResultado(await generarTokenRecuperacionAdmin(seleccionado.id, token));
      setConfirmado(false);
    } catch (err) { setError(err.message || "No fue posible generar el token."); }
    finally { setCargando(false); }
  }

  if (usuario?.rol !== "administrador") return <div className="pc-error">Acceso restringido.</div>;

  return (
    <>
      <PageHeader titulo="Recuperación de acceso" descripcion="Genera un token temporal para un titular cuya identidad verificaste. Vence a los 15 minutos y se usa una sola vez." />
      <div className="pc-grid pc-grid-main">
        <Card titulo="1. Busca la cuenta" cuerpo={false}>
          <div className="pc-toolbar">
            <div className="pc-input-icon" style={{ maxWidth: "none" }}><Search /><input className="form-control" autoComplete="off" value={busqueda} maxLength={100} placeholder="Nombre o correo (mínimo 2 caracteres)" aria-label="Buscar cuenta"
              onChange={(e) => { setBusqueda(e.target.value); setSeleccionado(null); setUsuarios([]); setResultado(null); setError(""); }} /></div>
          </div>
          {busqueda.trim().length < 2 ? <EmptyState icono={Search} titulo="Busca una cuenta activa" texto="Se muestran hasta 20 coincidencias." /> :
            buscando ? <div className="pc-card-body"><span className="pc-skel" style={{ height: 80 }} /></div> :
              usuarios.length === 0 ? <EmptyState icono={Search} titulo="Sin coincidencias" /> : (
                <ul className="pc-list" role="listbox" aria-label="Cuentas encontradas">
                  {usuarios.map((u) => (
                    <li key={u.id} role="option" aria-selected={seleccionado?.id === u.id} style={{ cursor: "pointer", background: seleccionado?.id === u.id ? "var(--pc-primary-50)" : undefined }}
                      onClick={() => { setSeleccionado(u); setResultado(null); }}>
                      <Persona nombre={u.nombre} detalle={u.email} />
                      <div className="derecha"><Badge tono={ROLES[u.rol]?.tono} punto={false}>{ROLES[u.rol]?.etiqueta ?? u.rol}</Badge></div>
                    </li>
                  ))}
                </ul>
              )}
        </Card>

        <Card titulo="2. Genera el token">
          {resultado ? (
            <>
              <div className="pc-aviso tono-ambar"><TriangleAlert />Se muestra solo ahora. Entrégalo únicamente al titular verificado; no lo compartas por canales públicos.</div>
              <div className="pc-token mb-2">{resultado.token}</div>
              <p className="pc-muted small">Vence: {new Date(resultado.expiraEn).toLocaleString("es-CO")}</p>
              <div className="d-flex gap-2">
                <button className="pc-btn pc-btn-secondary" onClick={async () => { try { await navigator.clipboard.writeText(resultado.token); toast.exito("Token copiado"); } catch { toast.error("No se pudo copiar"); } }}><Copy />Copiar</button>
                <button className="pc-btn pc-btn-ghost" onClick={() => setResultado(null)}>Ocultar</button>
              </div>
            </>
          ) : (
            <form onSubmit={generar}>
              {seleccionado ? <div className="pc-resumen-entrada mt-0 mb-3"><Persona nombre={seleccionado.nombre} detalle={seleccionado.email} /></div> : <p className="pc-muted">Selecciona una cuenta de la lista.</p>}
              <div className="form-check mb-3">
                <input id="identidad-confirmada" className="form-check-input" type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
                <label htmlFor="identidad-confirmada" className="form-check-label">Verifiqué la identidad del titular por un procedimiento autorizado.</label>
              </div>
              <ErrorBox mensaje={error} />
              <button className="pc-btn pc-btn-primary" type="submit" disabled={cargando || !confirmado || !seleccionado}><ShieldCheck />{cargando ? "Generando…" : "Generar token temporal"}</button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
