import { useMemo, useState } from "react";
import {
  ArrowLeftRight, ArrowRight, Banknote, Bike, Car, CircleDollarSign, CreditCard, Landmark,
  LogIn, LogOut, RefreshCw, SquareParking, Timer, TrendingUp, Wallet,
} from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useAhora } from "../hooks/useAhora";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { registrarSalida } from "../services/recursos.service";
import { Badge, Card, EmptyState, ErrorBox, Placa } from "./ui/elementos";
import { GraficaArea, GraficaBarras } from "./ui/graficas";
import { etiquetaMes, formatoCompacto, formatoHora, formatoMoneda, horas, transcurrido, ultimosMeses } from "./formato";

const saludo = (h) => (h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
const fechaLarga = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const ICONO_METODO = { efectivo: Banknote, tarjeta: CreditCard, transferencia: Landmark };
const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Dial de ocupación con marcas (inspirado en un control de clima)
function DialOcupacion({ ocupados, total }) {
  const pct = total ? ocupados / total : 0;
  const marcas = 44;
  const encendidas = Math.round(pct * marcas);
  const estado = pct >= .9 ? ["Casi lleno", "tono-rojo"] : pct >= .6 ? ["Alta ocupación", "tono-ambar"] : ["Con cupo", "tono-verde"];
  return (
    <div className="pc-dial">
      <svg viewBox="0 0 240 140" aria-hidden="true">
        <defs>
          <linearGradient id="dial-g" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#e9a8ff" /></linearGradient>
        </defs>
        <path d="M30 125 A90 90 0 0 1 210 125" fill="none" stroke="#1f1f26" strokeWidth="16" strokeLinecap="round" />
        {pct > 0 && <path d="M30 125 A90 90 0 0 1 210 125" fill="none" stroke="url(#dial-g)" strokeWidth="16" strokeLinecap="round"
          pathLength="100" strokeDasharray={`${pct * 100} 100`} className="pc-dial-arco" />}
        {Array.from({ length: marcas + 1 }, (_, i) => {
          const a = Math.PI - (i / marcas) * Math.PI;
          const r1 = 70, r2 = i % 4 === 0 ? 60 : 64;
          return <line key={i} x1={120 + r1 * Math.cos(a)} y1={125 - r1 * Math.sin(a)} x2={120 + r2 * Math.cos(a)} y2={125 - r2 * Math.sin(a)}
            stroke={i <= encendidas && pct > 0 ? "#c084fc" : "#33333d"} strokeWidth="2" strokeLinecap="round" />;
        })}
      </svg>
      <div className="pc-dial-centro">
        <strong>{Math.round(pct * 100)}<small>%</small></strong>
        <span>ocupado</span>
      </div>
      <div className="pc-dial-pie">
        <Badge tono={estado[1]}>{estado[0]}</Badge>
        <span>{total - ocupados} libres de {total}</span>
      </div>
    </div>
  );
}

// Mapa compacto en vivo agrupado por zona
function MiniMapa({ espacios, activas, abrir }) {
  const porEspacio = Object.fromEntries(activas.map((e) => [String(e.espacioId), e]));
  const zonas = espacios.reduce((acc, e) => { (acc[e.ubicacion || "Sin zona"] ||= []).push(e); return acc; }, {});
  if (!espacios.length) return <EmptyState icono={SquareParking} titulo="Sin espacios registrados" texto="Crea las celdas del parqueadero en Espacios." />;
  return (
    <div className="pc-mini-mapa">
      {Object.entries(zonas).map(([zona, lista]) => (
        <div key={zona} className="pc-mini-zona">
          <span className="pc-mini-zona-titulo">{zona}<b>{lista.filter((e) => e.estado === "disponible").length}/{lista.length}</b></span>
          <div className="pc-mini-celdas">
            {lista.map((e) => {
              const est = porEspacio[String(e.id)];
              const Icono = e.tipo === "moto" ? Bike : Car;
              return (
                <button key={e.id} type="button" className={`pc-mini-celda ${e.estado === "disponible" ? "libre" : "ocupada"}`}
                  onClick={() => abrir("/espacios")} title={`${e.numero} · ${e.estado === "disponible" ? "libre" : `ocupado${est ? ` por ${est.placa}` : ""}`}`}>
                  <Icono />
                  <span>{e.numero}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Inicio({ token, usuario, rol, abrir }) {
  const { datos, errores, cargando, actualizar } = useDashboardData(token, rol);
  const ahora = useAhora(30000);
  const toast = useToast();
  const confirmar = useConfirmar();
  const [saliendo, setSaliendo] = useState(null);
  const nombre = (usuario?.nombre || "Usuario").split(" ")[0];

  const r = datos.resumen?.resumen;
  const espacios = useMemo(() => datos.espacios ?? [], [datos.espacios]);
  const estancias = useMemo(() => datos.estancias ?? [], [datos.estancias]);
  const pagos = useMemo(() => datos.pagos ?? [], [datos.pagos]);
  const activas = estancias.filter((e) => e.estado === "activa").sort((a, b) => new Date(a.fechaHoraEntrada) - new Date(b.fechaHoraEntrada));
  const pendientes = estancias.filter((e) => e.estado === "finalizada" && !e.pagada);
  const entradasHoy = estancias.filter((e) => mismoDia(e.fechaHoraEntrada, ahora)).length;
  const salidasHoy = estancias.filter((e) => e.fechaHoraSalida && mismoDia(e.fechaHoraSalida, ahora)).length;

  // Ingresos de los últimos 6 meses
  const serie = useMemo(() => {
    const porMes = Object.fromEntries((datos.resumen?.ingresosPorMes ?? []).map((m) => [m.mes, m]));
    return ultimosMeses(6).map((mes) => ({
      etiqueta: etiquetaMes(mes), etiquetaLarga: `${etiquetaMes(mes)} ${mes.slice(0, 4)}`,
      valor: porMes[mes]?.total ?? 0, extra: `${porMes[mes]?.pagos ?? 0} pagos`,
    }));
  }, [datos.resumen]);
  const totalSemestre = serie.reduce((s, m) => s + m.valor, 0);

  // Entradas por hora de hoy
  const porHora = useMemo(() => {
    const cubetas = Array.from({ length: 24 }, (_, h) => ({ etiqueta: `${h}h`, valor: 0 }));
    estancias.forEach((e) => { if (mismoDia(e.fechaHoraEntrada, ahora)) cubetas[new Date(e.fechaHoraEntrada).getHours()].valor += 1; });
    return cubetas.slice(6, 23);
  }, [estancias, ahora]);
  const horaPico = porHora.reduce((m, b) => (b.valor > m.valor ? b : m), { valor: 0 });

  // Feed de actividad: entradas, salidas y pagos ordenados por hora
  const actividad = useMemo(() => {
    const ev = [];
    estancias.forEach((e) => {
      ev.push({ t: e.fechaHoraEntrada, tipo: "entrada", placa: e.placa, texto: `Entró al espacio ${e.espacioNumero}` });
      if (e.fechaHoraSalida) ev.push({ t: e.fechaHoraSalida, tipo: "salida", placa: e.placa, texto: `Salió después de ${horas(e.tiempoPermanencia)}` });
    });
    pagos.forEach((p) => ev.push({ t: p.fechaPago, tipo: "pago", placa: p.placa, texto: `Pagó ${formatoMoneda(p.valor)}`, metodo: p.metodoPago }));
    return ev.sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8);
  }, [estancias, pagos]);

  async function salida(e) {
    const ok = await confirmar({ titulo: `Registrar salida de ${e.placa}`, mensaje: `Espacio ${e.espacioNumero} · lleva ${transcurrido(e.fechaHoraEntrada, ahora)}. Quedará pendiente de cobro.`, accion: "Registrar salida" });
    if (!ok) return;
    setSaliendo(e.id);
    try {
      const x = await registrarSalida(token, e.id);
      toast.exito(`Salida registrada: ${e.placa}`, `Tiempo cobrable: ${horas(x.estancia?.tiempoPermanencia)}`);
      actualizar();
    } catch (err) { toast.error("No se pudo registrar la salida", err.message); }
    finally { setSaliendo(null); }
  }

  const ocupados = espacios.filter((e) => e.estado === "ocupado").length;

  return (
    <div className="pc-centro">
      <div className="pc-hello">
        <div>
          <span className="pc-eyebrow"><span className="pc-vivo" />En vivo · {fechaLarga.format(ahora)}</span>
          <h1>{saludo(new Date(ahora).getHours())}, {nombre}</h1>
          <p>{rol === "operador" ? "Esto es lo que pasa en la portería ahora mismo." : "Así va el parqueadero en este momento."}</p>
        </div>
        <div className="pc-page-actions">
          <button className="pc-btn pc-btn-secondary" onClick={actualizar} disabled={cargando}><RefreshCw className={cargando ? "pc-girar" : ""} />Actualizar</button>
          <button className="pc-btn pc-btn-primary" onClick={() => abrir("/estancias")}><LogIn />Registrar entrada</button>
        </div>
      </div>

      <ErrorBox mensaje={errores.resumen || errores.estancias || errores.espacios} />

      {pendientes.length > 0 && (
        <div className="pc-alerta-cobro" role="status">
          <span className="pc-stat-icon tono-ambar"><Wallet /></span>
          <div><strong>{pendientes.length} {pendientes.length === 1 ? "vehículo salió y no ha pagado" : "vehículos salieron y no han pagado"}</strong><small>{pendientes.slice(0, 4).map((p) => p.placa).join(" · ")}{pendientes.length > 4 ? " …" : ""}</small></div>
          <button className="pc-btn pc-btn-primary pc-btn-sm" onClick={() => abrir("/pagos")}>Cobrar ahora <ArrowRight /></button>
        </div>
      )}

      {/* Fila principal: dial + mapa en vivo + resumen del día */}
      <section className="pc-card pc-hero-ctrl">
        <div className="pc-hero-dial">
          {cargando ? <span className="pc-skel" style={{ height: 170 }} /> : <DialOcupacion ocupados={ocupados} total={espacios.length} />}
        </div>
        <div className="pc-hero-mapa">
          <div className="pc-hero-titulo"><h2>Mapa en vivo</h2><button className="pc-btn pc-btn-ghost pc-btn-sm" onClick={() => abrir("/espacios")}>Ver espacios <ArrowRight /></button></div>
          {cargando ? <span className="pc-skel" style={{ height: 150 }} /> : <MiniMapa espacios={espacios} activas={activas} abrir={abrir} />}
        </div>
        <div className="pc-hero-turno">
          <h2>Hoy</h2>
          <div className="pc-turno-item"><span className="pc-stat-icon tono-azul"><LogIn /></span><div><b>{entradasHoy}</b><small>entradas</small></div></div>
          <div className="pc-turno-item"><span className="pc-stat-icon tono-violeta"><LogOut /></span><div><b>{salidasHoy}</b><small>salidas</small></div></div>
          <div className="pc-turno-item"><span className="pc-stat-icon tono-verde"><CircleDollarSign /></span><div><b>{r ? formatoMoneda(r.ingresosHoy) : "—"}</b><small>recaudado</small></div></div>
        </div>
      </section>

      {/* Vehículos dentro como tiquetes */}
      <section className="pc-mb">
        <div className="pc-seccion-titulo">
          <h2>En el parqueadero <span>{activas.length}</span></h2>
          <button className="pc-btn pc-btn-ghost pc-btn-sm" onClick={() => abrir("/estancias")}>Entradas y salidas <ArrowRight /></button>
        </div>
        {cargando ? <span className="pc-skel" style={{ height: 120 }} /> : activas.length === 0 ? (
          <Card><EmptyState icono={SquareParking} titulo="No hay vehículos dentro" texto="Cuando registres una entrada aparecerá aquí con su tiempo corriendo." /></Card>
        ) : (
          <div className="pc-tiquetes">
            {activas.slice(0, 8).map((e) => {
              const Icono = e.tipoVehiculo === "moto" ? Bike : Car;
              return (
                <article key={e.id} className="pc-tiquete">
                  <div className="pc-tiquete-top"><Placa valor={e.placa} /><Icono className="pc-tiquete-tipo" /></div>
                  <div className="pc-tiquete-tiempo"><Timer />{transcurrido(e.fechaHoraEntrada, ahora)}</div>
                  <div className="pc-tiquete-datos"><span>Espacio <b>{e.espacioNumero}</b></span><span>Entró {formatoHora(e.fechaHoraEntrada)}</span></div>
                  <button className="pc-btn pc-btn-secondary pc-btn-sm pc-btn-block" disabled={saliendo === e.id} onClick={() => salida(e)}><LogOut />{saliendo === e.id ? "Registrando…" : "Dar salida"}</button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="pc-grid pc-grid-main">
        <div className="pc-grid">
          <Card titulo="Ingresos" descripcion={`Últimos 6 meses · ${formatoMoneda(totalSemestre)}`}
            acciones={serie.at(-1) && <Badge tono="tono-violeta" punto={false}><TrendingUp style={{ width: 13 }} />{serie.at(-1).etiqueta} en curso · {formatoMoneda(serie.at(-1).valor)}</Badge>}>
            {cargando ? <span className="pc-skel" style={{ height: 200 }} /> : <GraficaArea datos={serie} alto={200} formato={(v, largo) => (largo ? formatoMoneda(v) : `$${formatoCompacto(v)}`)} />}
          </Card>
          <Card titulo="Entradas por hora" descripcion={horaPico.valor ? `Hora pico hoy: ${horaPico.etiqueta} (${horaPico.valor})` : "Sin entradas hoy todavía"}>
            {cargando ? <span className="pc-skel" style={{ height: 140 }} /> : horaPico.valor ? <GraficaBarras datos={porHora} alto={140} resaltar={new Date(ahora).getHours() - 6} /> : <EmptyState icono={LogIn} titulo="Aún no hay entradas hoy" texto="La gráfica se llena a medida que registres ingresos." />}
          </Card>
        </div>
        <Card titulo="Actividad reciente" descripcion="Entradas, salidas y pagos" cuerpo={false}>
          {cargando ? <div className="pc-card-body"><span className="pc-skel" style={{ height: 260 }} /></div> : actividad.length === 0 ? (
            <EmptyState icono={ArrowLeftRight} titulo="Sin movimientos" texto="La actividad del parqueadero aparecerá aquí." />
          ) : (
            <ol className="pc-feed">
              {actividad.map((a, i) => {
                const Icono = a.tipo === "entrada" ? LogIn : a.tipo === "salida" ? LogOut : ICONO_METODO[a.metodo] ?? Wallet;
                const hace = transcurrido(a.t, ahora);
                return (
                  <li key={i} className={`pc-feed-${a.tipo}`}>
                    <span className="pc-feed-punto"><Icono /></span>
                    <div><Placa valor={a.placa} /><p>{a.texto}</p></div>
                    <time dateTime={a.t}>{hace === "recién" ? "ahora" : `hace ${hace}`}</time>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
