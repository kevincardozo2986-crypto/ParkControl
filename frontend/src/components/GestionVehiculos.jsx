import { useMemo, useState } from "react";
import { Bike, Car, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useRecursos } from "../hooks/useRecursos";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { actualizarVehiculo, crearVehiculo, eliminarVehiculo, listarConductores, listarEstancias, listarVehiculos } from "../services/recursos.service";
import Modal from "./ui/Modal";
import { Badge, Card, EmptyState, ErrorBox, FilasCarga, PageHeader, Persona, Placa } from "./ui/elementos";
import { incluye } from "./formato";

const inicial = { placa: "", tipo: "carro", marca: "", color: "", conductorId: "" };

export default function GestionVehiculos({ token, rol }) {
  const esAdmin = rol === "administrador";
  const toast = useToast();
  const confirmar = useConfirmar();
  const { datos, errores, cargando, recargar } = useRecursos(token, { vehiculos: listarVehiculos, conductores: listarConductores, estancias: listarEstancias });
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const vehiculos = useMemo(() => datos.vehiculos ?? [], [datos.vehiculos]);
  const conductores = useMemo(() => datos.conductores ?? [], [datos.conductores]);
  const conductor = useMemo(() => Object.fromEntries(conductores.map((c) => [String(c.id), c])), [conductores]);
  const dentro = new Set((datos.estancias ?? []).filter((e) => e.estado === "activa").map((e) => String(e.vehiculoId)));
  const filtrados = vehiculos.filter((v) => (!tipo || v.tipo === tipo) && incluye(`${v.placa} ${v.marca} ${v.color} ${conductor[String(v.conductorId)]?.nombre}`, busqueda));

  function nuevo() { setEditando(null); setForm({ ...inicial, conductorId: conductores[0] ? String(conductores[0].id) : "" }); }
  function editar(v) { setEditando(v.id); setForm({ placa: v.placa, tipo: v.tipo, marca: v.marca ?? "", color: v.color ?? "", conductorId: String(v.conductorId) }); }
  const campo = (n, v) => setForm((f) => ({ ...f, [n]: v }));

  async function guardar() {
    setGuardando(true);
    try {
      const d = { placa: form.placa.trim().toUpperCase(), tipo: form.tipo, marca: form.marca.trim(), color: form.color.trim(), conductorId: Number(form.conductorId) };
      if (editando == null) await crearVehiculo(token, d); else await actualizarVehiculo(token, editando, d);
      toast.exito(editando == null ? `Vehículo ${d.placa} registrado` : `Vehículo ${d.placa} actualizado`);
      setForm(null); recargar();
    } catch (err) { toast.error("No se pudo guardar el vehículo", err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar(v) {
    if (!(await confirmar({ titulo: `Eliminar el vehículo ${v.placa}`, mensaje: "Esta acción no se puede deshacer. Los vehículos con estancias registradas no se pueden eliminar.", accion: "Eliminar", peligro: true }))) return;
    try { await eliminarVehiculo(token, v.id); toast.exito(`Vehículo ${v.placa} eliminado`); recargar(); }
    catch (err) { toast.error("No se pudo eliminar", err.message); }
  }

  return (
    <>
      <PageHeader titulo="Vehículos" descripcion={`${vehiculos.length} vehículos registrados${esAdmin ? "" : " · solo consulta"}`}>
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
        {esAdmin && <button className="pc-btn pc-btn-primary" onClick={nuevo} disabled={!conductores.length} title={conductores.length ? "" : "Registra primero un conductor"}><Plus />Nuevo vehículo</button>}
      </PageHeader>
      <ErrorBox mensaje={errores.vehiculos || errores.conductores} />

      <Card cuerpo={false} pie={<span>{filtrados.length} de {vehiculos.length} vehículos</span>}>
        <div className="pc-toolbar">
          <div className="pc-input-icon"><Search /><input className="form-control" placeholder="Buscar placa, marca, color o propietario" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar vehículos" /></div>
          <div className="pc-segmented" role="tablist" aria-label="Tipo de vehículo">
            {[["", "Todos"], ["carro", "Carros"], ["moto", "Motos"]].map(([v, t]) => <button key={v} role="tab" aria-selected={tipo === v} className={tipo === v ? "activo" : ""} onClick={() => setTipo(v)}>{t}</button>)}
          </div>
        </div>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Placa</th><th>Vehículo</th><th>Propietario</th><th>Estado</th>{esAdmin && <th className="acciones">Acciones</th>}</tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={esAdmin ? 5 : 4} /> : filtrados.map((v) => {
                const Icono = v.tipo === "moto" ? Bike : Car;
                const c = conductor[String(v.conductorId)];
                return (
                  <tr key={v.id}>
                    <td><Placa valor={v.placa} /></td>
                    <td><div className="d-flex align-items-center gap-2"><span className="pc-stat-icon tono-gris" style={{ width: 30, height: 30 }}><Icono style={{ width: 15 }} /></span><span><strong style={{ fontWeight: 600 }}>{v.marca}</strong><small className="pc-muted d-block">{v.color} · {v.tipo}</small></span></div></td>
                    <td>{c ? <Persona nombre={c.nombre} detalle={`CC ${c.documento}`} /> : <span className="pc-muted">ID {v.conductorId}</span>}</td>
                    <td>{dentro.has(String(v.id)) ? <Badge tono="tono-ambar">Dentro</Badge> : <Badge tono="tono-gris">Fuera</Badge>}</td>
                    {esAdmin && <td className="acciones">
                      <button className="pc-icon-btn" onClick={() => editar(v)} aria-label={`Editar ${v.placa}`} title="Editar"><Pencil /></button>
                      <button className="pc-icon-btn danger" onClick={() => eliminar(v)} aria-label={`Eliminar ${v.placa}`} title="Eliminar"><Trash2 /></button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!cargando && filtrados.length === 0 && <EmptyState icono={Car} titulo="Sin vehículos" texto={busqueda || tipo ? "Ningún vehículo coincide con el filtro." : "Registra el primer vehículo para empezar."} />}
        </div>
      </Card>

      <Modal abierto={Boolean(form)} titulo={editando == null ? "Nuevo vehículo" : "Editar vehículo"} descripcion="El tipo determina en qué celdas puede parquear." icono={<Car />} onCerrar={() => setForm(null)} onSubmit={guardar}
        pie={<><button type="button" className="pc-btn pc-btn-secondary" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className="pc-btn pc-btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button></>}>
        {form && (
          <div className="row g-3">
            <div className="col-6"><label htmlFor="vh-placa" className="form-label">Placa</label><input id="vh-placa" className="form-control text-uppercase fw-bold" required pattern="[A-Za-z0-9]{5,7}" title="5 a 7 letras o números" placeholder="ABC123" value={form.placa} onChange={(e) => campo("placa", e.target.value.toUpperCase())} /></div>
            <div className="col-6"><span className="form-label d-block">Tipo</span><div className="pc-segmented w-100" role="radiogroup" aria-label="Tipo">{[["carro", "Carro", Car], ["moto", "Moto", Bike]].map(([v, t, I]) => <button key={v} type="button" role="radio" aria-checked={form.tipo === v} className={`flex-fill justify-content-center ${form.tipo === v ? "activo" : ""}`} onClick={() => campo("tipo", v)}><I />{t}</button>)}</div></div>
            <div className="col-6"><label htmlFor="vh-marca" className="form-label">Marca</label><input id="vh-marca" className="form-control" required maxLength={80} placeholder="Mazda" value={form.marca} onChange={(e) => campo("marca", e.target.value)} /></div>
            <div className="col-6"><label htmlFor="vh-color" className="form-label">Color</label><input id="vh-color" className="form-control" required maxLength={50} placeholder="Gris" value={form.color} onChange={(e) => campo("color", e.target.value)} /></div>
            <div className="col-12"><label htmlFor="vh-cond" className="form-label">Propietario</label><select id="vh-cond" className="form-select" required value={form.conductorId} onChange={(e) => campo("conductorId", e.target.value)}>{conductores.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre} · CC {c.documento}</option>)}</select></div>
          </div>
        )}
      </Modal>
    </>
  );
}
