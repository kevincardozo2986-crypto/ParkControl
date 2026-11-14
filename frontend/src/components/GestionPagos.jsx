import { useMemo, useState } from "react";
import { Banknote, CircleDollarSign, CreditCard, Landmark, Receipt, RefreshCw, Search, Wallet } from "lucide-react";
import { useRecursos } from "../hooks/useRecursos";
import { useToast } from "../hooks/useFeedback";
import { useAhora } from "../hooks/useAhora";
import { listarEstancias, listarPagos, registrarPago } from "../services/recursos.service";
import Modal from "./ui/Modal";
import { Badge, Card, EmptyState, ErrorBox, FilasCarga, PageHeader, Placa, StatCard } from "./ui/elementos";
import { formatoFecha, formatoMoneda, horas, incluye } from "./formato";

const METODOS = [
  { valor: "efectivo", etiqueta: "Efectivo", icono: Banknote },
  { valor: "tarjeta", etiqueta: "Tarjeta", icono: CreditCard },
  { valor: "transferencia", etiqueta: "Transferencia", icono: Landmark },
];
const METODO = Object.fromEntries(METODOS.map((m) => [m.valor, m]));

// Administrador y operador: cobrar estancias finalizadas.
// El valor lo calcula el backend (horas × TARIFA_POR_HORA); el cliente no lo envía.
export default function GestionPagos({ token }) {
  const toast = useToast();
  const ahora = useAhora(60000);
  const { datos, errores, cargando, recargar } = useRecursos(token, { pagos: listarPagos, estancias: listarEstancias });
  const [cobrando, setCobrando] = useState(null);
  const [metodo, setMetodo] = useState("efectivo");
  const [busqueda, setBusqueda] = useState("");
  const [enviando, setEnviando] = useState(false);

  const pagos = useMemo(() => datos.pagos ?? [], [datos.pagos]);
  const pendientes = (datos.estancias ?? []).filter((e) => e.estado === "finalizada" && !e.pagada);
  const filtrados = pagos.filter((p) => incluye(`${p.placa} ${p.metodoPago}`, busqueda));
  const hoy = new Date(ahora).toDateString();
  const pagosHoy = pagos.filter((p) => new Date(p.fechaPago).toDateString() === hoy);
  const totalHoy = pagosHoy.reduce((s, p) => s + Number(p.valor || 0), 0);
  const total = filtrados.reduce((s, p) => s + Number(p.valor || 0), 0);

  async function cobrar() {
    setEnviando(true);
    try {
      const r = await registrarPago(token, { estanciaId: Number(cobrando.id), metodoPago: metodo });
      toast.exito(`Cobro registrado: ${formatoMoneda(r.pago?.valor)}`, `${cobrando.placa} · ${METODO[metodo].etiqueta}`);
      setCobrando(null); recargar();
    } catch (err) { toast.error("No se pudo registrar el cobro", err.message); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <PageHeader titulo="Cobros" descripcion="Cobra las estancias finalizadas y consulta el historial de pagos">
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
      </PageHeader>
      <ErrorBox mensaje={errores.pagos || errores.estancias} />

      <div className="pc-grid pc-grid-3 pc-mb">
        <StatCard etiqueta="Pendientes de cobro" icono={Wallet} tono={pendientes.length ? "tono-rojo" : "tono-gris"} cargando={cargando} valor={pendientes.length} pie="Estancias finalizadas sin pago" />
        <StatCard etiqueta="Recaudado hoy" icono={CircleDollarSign} tono="tono-verde" cargando={cargando} valor={formatoMoneda(totalHoy)} pie={`${pagosHoy.length} pagos hoy`} />
        <StatCard etiqueta="Pagos registrados" icono={Receipt} cargando={cargando} valor={pagos.length} pie={`Total ${formatoMoneda(pagos.reduce((s, p) => s + Number(p.valor || 0), 0))}`} />
      </div>

      <Card titulo="Pendientes de cobro" descripcion="El valor se calcula en el servidor con la tarifa por hora" cuerpo={false} className="pc-mb">
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Placa</th><th>Espacio</th><th>Salida</th><th className="num">Tiempo</th><th className="acciones">Acción</th></tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={5} filas={2} /> : pendientes.map((e) => (
                <tr key={e.id}>
                  <td><Placa valor={e.placa} /></td><td>{e.espacioNumero}</td>
                  <td className="pc-mono">{formatoFecha(e.fechaHoraSalida)}</td>
                  <td className="num"><strong>{horas(e.tiempoPermanencia)}</strong></td>
                  <td className="acciones"><button className="pc-btn pc-btn-primary pc-btn-sm" onClick={() => { setMetodo("efectivo"); setCobrando(e); }}><Wallet />Cobrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && pendientes.length === 0 && <EmptyState icono={Wallet} titulo="Todo al día" texto="No hay estancias pendientes de cobro." />}
        </div>
      </Card>

      <Card titulo="Historial de pagos" cuerpo={false}
        acciones={<div className="pc-input-icon" style={{ minWidth: 220 }}><Search /><input className="form-control" placeholder="Placa o método" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar pagos" /></div>}
        pie={filtrados.length > 0 && <><span>{filtrados.length} pagos</span><strong className="text-body">Total {formatoMoneda(total)}</strong></>}>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Fecha</th><th>Placa</th><th className="num">Tiempo</th><th>Método</th><th className="num">Valor</th></tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={5} /> : filtrados.map((p) => {
                const M = METODO[p.metodoPago]?.icono ?? Receipt;
                return (
                  <tr key={p.id}>
                    <td className="pc-mono">{formatoFecha(p.fechaPago)}</td><td><Placa valor={p.placa} /></td>
                    <td className="num">{horas(p.tiempoPermanencia)}</td>
                    <td><Badge tono="tono-gris" punto={false}><M style={{ width: 13 }} />{METODO[p.metodoPago]?.etiqueta ?? p.metodoPago}</Badge></td>
                    <td className="num"><strong>{formatoMoneda(p.valor)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!cargando && filtrados.length === 0 && <EmptyState icono={Receipt} titulo="Sin pagos" texto={busqueda ? "Ningún pago coincide con la búsqueda." : "Los cobros registrados aparecerán aquí."} />}
        </div>
      </Card>

      <Modal abierto={Boolean(cobrando)} titulo="Registrar cobro" descripcion="Confirma el método de pago. El valor final lo calcula el servidor." icono={<Wallet />} onCerrar={() => setCobrando(null)} pequeno
        onSubmit={cobrar}
        pie={<><button type="button" className="pc-btn pc-btn-secondary" onClick={() => setCobrando(null)}>Cancelar</button><button type="submit" className="pc-btn pc-btn-primary" disabled={enviando}>{enviando ? "Registrando…" : "Registrar cobro"}</button></>}>
        {cobrando && (
          <>
            <div className="pc-resumen-entrada mt-0 mb-3">
              <div><span className="pc-muted">Vehículo</span><Placa valor={cobrando.placa} /></div>
              <div><span className="pc-muted">Espacio</span><strong>{cobrando.espacioNumero}</strong></div>
              <div><span className="pc-muted">Tiempo cobrable</span><strong>{horas(cobrando.tiempoPermanencia)}</strong></div>
            </div>
            <span className="form-label d-block">Método de pago</span>
            <div className="pc-segmented w-100" role="radiogroup" aria-label="Método de pago">
              {METODOS.map((m) => {
                const I = m.icono;
                return <button key={m.valor} type="button" role="radio" aria-checked={metodo === m.valor} className={`flex-fill justify-content-center ${metodo === m.valor ? "activo" : ""}`} onClick={() => setMetodo(m.valor)}><I />{m.etiqueta}</button>;
              })}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
