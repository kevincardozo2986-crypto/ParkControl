import { useMemo, useState } from "react";
import { ArrowLeftRight, Bike, Car, Clock, LogIn, LogOut, RefreshCw, Search, SquareParking } from "lucide-react";
import { useRecursos } from "../hooks/useRecursos";
import { useAhora } from "../hooks/useAhora";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { listarEspacios, listarEstancias, listarVehiculos, registrarEntrada, registrarSalida } from "../services/recursos.service";
import MapaEspacios from "./MapaEspacios";
import { Badge, Card, EmptyState, ErrorBox, FilasCarga, PageHeader, Placa } from "./ui/elementos";
import { formatoFecha, horas, incluye, transcurrido } from "./formato";

// Administrador y operador: registrar entradas (mapa interactivo) y salidas.
export default function GestionEstancias({ token, abrir }) {
  const toast = useToast();
  const confirmar = useConfirmar();
  const ahora = useAhora(30000);
  const { datos, errores, cargando, recargar } = useRecursos(token, {
    estancias: listarEstancias, espacios: listarEspacios, vehiculos: listarVehiculos,
  });
  const [vehiculoId, setVehiculoId] = useState("");
  const [espacioId, setEspacioId] = useState(null);
  const [filtroVeh, setFiltroVeh] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [operando, setOperando] = useState(false);

  const estancias = useMemo(() => datos.estancias ?? [], [datos.estancias]);
  const espacios = useMemo(() => datos.espacios ?? [], [datos.espacios]);
  const vehiculos = useMemo(() => datos.vehiculos ?? [], [datos.vehiculos]);
  const activas = estancias.filter((e) => e.estado === "activa");
  const dentro = new Set(activas.map((e) => String(e.vehiculoId)));
  const candidatos = vehiculos.filter((v) => !dentro.has(String(v.id)) && incluye(`${v.placa} ${v.marca} ${v.color}`, filtroVeh));
  const vehiculo = vehiculos.find((v) => String(v.id) === vehiculoId);
  const espacio = espacios.find((e) => String(e.id) === String(espacioId));
  const historial = estancias.filter((e) => e.estado === "finalizada" && incluye(`${e.placa} ${e.espacioNumero}`, busqueda)).slice(0, 25);
  const libres = espacios.filter((e) => e.estado === "disponible").length;

  async function entrada() {
    if (!vehiculo || !espacio) return;
    setOperando(true);
    try {
      await registrarEntrada(token, { vehiculoId: Number(vehiculo.id), espacioId: Number(espacio.id) });
      toast.exito(`Entrada registrada: ${vehiculo.placa}`, `Espacio ${espacio.numero}`);
      setVehiculoId(""); setEspacioId(null); setFiltroVeh(""); recargar();
    } catch (err) { toast.error("No se pudo registrar la entrada", err.message); }
    finally { setOperando(false); }
  }

  async function salida(e) {
    const ok = await confirmar({ titulo: `Registrar salida de ${e.placa}`, mensaje: `Espacio ${e.espacioNumero} · lleva ${transcurrido(e.fechaHoraEntrada, ahora)}. El espacio quedará libre y la estancia pasará a cobro.`, accion: "Registrar salida" });
    if (!ok) return;
    setOperando(true);
    try {
      const r = await registrarSalida(token, e.id);
      toast.exito(`Salida registrada: ${e.placa}`, `Tiempo cobrable: ${horas(r.estancia?.tiempoPermanencia)}. Pendiente de cobro.`);
      recargar();
    } catch (err) { toast.error("No se pudo registrar la salida", err.message); }
    finally { setOperando(false); }
  }

  return (
    <>
      <PageHeader titulo="Entradas y salidas" descripcion={`${activas.length} vehículos dentro · ${libres} de ${espacios.length} espacios libres`}>
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
        <button className="pc-btn pc-btn-secondary" onClick={() => abrir("/pagos")}><ArrowLeftRight />Ir a cobros</button>
      </PageHeader>
      <ErrorBox mensaje={errores.estancias || errores.espacios || errores.vehiculos} />

      <div className="pc-steps pc-mb">
        <Card titulo={<><span className="pc-step-n">1</span>Vehículo</>} descripcion="Solo vehículos que no están dentro">
          <div className="pc-input-icon mb-2" style={{ maxWidth: "none" }}><Search /><input className="form-control" placeholder="Buscar placa, marca o color" value={filtroVeh} onChange={(e) => setFiltroVeh(e.target.value)} aria-label="Buscar vehículo" /></div>
          <div className="pc-pick" role="listbox" aria-label="Vehículos disponibles para entrar">
            {cargando ? <span className="pc-skel" style={{ height: 120 }} /> : candidatos.length === 0 ? <p className="pc-muted small mb-0 p-2">No hay vehículos disponibles{filtroVeh ? " con ese filtro" : ""}.</p> : candidatos.map((v) => {
              const Icono = v.tipo === "moto" ? Bike : Car;
              return (
                <button key={v.id} type="button" role="option" aria-selected={vehiculoId === String(v.id)} className={vehiculoId === String(v.id) ? "activo" : ""}
                  onClick={() => { setVehiculoId(String(v.id)); setEspacioId(null); }}>
                  <Placa valor={v.placa} />
                  <span><strong>{v.marca}</strong><small>{v.color} · {v.tipo}</small></span>
                  <Icono style={{ marginLeft: "auto", width: 16, color: "var(--pc-subtle)" }} />
                </button>
              );
            })}
          </div>
          <div className="pc-resumen-entrada">
            <div><span className="pc-muted">Vehículo</span>{vehiculo ? <Placa valor={vehiculo.placa} /> : <span className="pc-muted">—</span>}</div>
            <div><span className="pc-muted">Espacio</span><strong>{espacio ? `${espacio.numero} · ${espacio.ubicacion}` : "—"}</strong></div>
            <button className="pc-btn pc-btn-primary pc-btn-block mt-1" onClick={entrada} disabled={operando || !vehiculo || !espacio}><LogIn />{operando ? "Registrando…" : "Registrar entrada"}</button>
          </div>
        </Card>
        <Card titulo={<><span className="pc-step-n">2</span>Espacio</>} descripcion={vehiculo ? `Elige una celda libre para ${vehiculo.tipo === "moto" ? "moto" : "carro"}` : "Selecciona primero un vehículo"}>
          {cargando ? <span className="pc-skel" style={{ height: 260 }} /> : espacios.length === 0 ? <EmptyState icono={SquareParking} titulo="No hay espacios registrados" /> : (
            <MapaEspacios espacios={espacios} estanciasActivas={activas} tipoPermitido={vehiculo?.tipo} seleccionado={espacioId} onSeleccionar={vehiculo ? setEspacioId : undefined} />
          )}
        </Card>
      </div>

      <Card titulo="Vehículos dentro" descripcion="Registra la salida cuando el vehículo abandone el parqueadero" cuerpo={false} className="pc-mb">
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Placa</th><th>Tipo</th><th>Espacio</th><th>Entrada</th><th>Tiempo</th><th className="acciones">Acción</th></tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={6} filas={3} /> : activas.map((e) => (
                <tr key={e.id}>
                  <td><Placa valor={e.placa} /></td>
                  <td className="text-capitalize">{e.tipoVehiculo}</td>
                  <td><strong>{e.espacioNumero}</strong></td>
                  <td className="pc-mono">{formatoFecha(e.fechaHoraEntrada)}</td>
                  <td><Badge tono="tono-ambar"><Clock style={{ width: 12 }} />{transcurrido(e.fechaHoraEntrada, ahora)}</Badge></td>
                  <td className="acciones"><button className="pc-btn pc-btn-secondary pc-btn-sm" disabled={operando} onClick={() => salida(e)}><LogOut />Registrar salida</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && activas.length === 0 && <EmptyState icono={SquareParking} titulo="No hay vehículos dentro" texto="Registra una entrada eligiendo vehículo y espacio." />}
        </div>
      </Card>

      <Card titulo="Historial reciente" cuerpo={false}
        acciones={<div className="pc-input-icon" style={{ minWidth: 220 }}><Search /><input className="form-control" placeholder="Placa o espacio" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar en historial" /></div>}>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Placa</th><th>Espacio</th><th>Entrada</th><th>Salida</th><th className="num">Tiempo</th><th>Cobro</th></tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={6} filas={3} /> : historial.map((e) => (
                <tr key={e.id}>
                  <td><Placa valor={e.placa} /></td><td>{e.espacioNumero}</td>
                  <td className="pc-mono">{formatoFecha(e.fechaHoraEntrada)}</td><td className="pc-mono">{formatoFecha(e.fechaHoraSalida)}</td>
                  <td className="num">{horas(e.tiempoPermanencia)}</td>
                  <td>{e.pagada ? <Badge tono="tono-verde">Pagada</Badge> : <Badge tono="tono-rojo">Pendiente</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && historial.length === 0 && <EmptyState icono={Clock} titulo="Sin estancias finalizadas" texto={busqueda ? "Prueba con otra placa o espacio." : "Aquí verás las estancias cuando registres salidas."} />}
        </div>
      </Card>
    </>
  );
}
