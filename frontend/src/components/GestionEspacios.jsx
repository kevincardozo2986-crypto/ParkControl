import { useMemo, useState } from "react";
import { LayoutGrid, List, Pencil, Plus, RefreshCw, Search, SquareParking, Trash2 } from "lucide-react";
import { useRecursos } from "../hooks/useRecursos";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { actualizarEspacio, crearEspacio, eliminarEspacio, listarEspacios, listarEstancias } from "../services/recursos.service";
import MapaEspacios from "./MapaEspacios";
import Modal from "./ui/Modal";
import { Badge, Card, EmptyState, ErrorBox, FilasCarga, PageHeader, StatCard } from "./ui/elementos";
import { incluye } from "./formato";

const inicial = { numero: "", tipo: "carro", ubicacion: "" };

// Administrador: CRUD. Operador: consulta de disponibilidad.
export default function GestionEspacios({ token, rol }) {
  const esAdmin = rol === "administrador";
  const toast = useToast();
  const confirmar = useConfirmar();
  const { datos, errores, cargando, recargar } = useRecursos(token, { espacios: listarEspacios, estancias: listarEstancias });
  const [vista, setVista] = useState("mapa");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const espacios = useMemo(() => datos.espacios ?? [], [datos.espacios]);
  const activas = (datos.estancias ?? []).filter((e) => e.estado === "activa");
  const filtrados = espacios.filter((e) => (filtro === "todos" || e.estado === filtro || e.tipo === filtro) && incluye(`${e.numero} ${e.ubicacion} ${e.tipo}`, busqueda));
  const cuenta = (pred) => espacios.filter(pred).length;
  const libres = cuenta((e) => e.estado === "disponible");

  function nuevo() { setEditando(null); setForm({ ...inicial }); }
  function editar(e) { setEditando(e.id); setForm({ numero: e.numero, tipo: e.tipo, ubicacion: e.ubicacion ?? "" }); }

  async function guardar() {
    setGuardando(true);
    try {
      const d = { numero: form.numero.trim().toUpperCase(), tipo: form.tipo, ubicacion: form.ubicacion.trim() };
      if (editando == null) await crearEspacio(token, d); else await actualizarEspacio(token, editando, d);
      toast.exito(editando == null ? `Espacio ${d.numero} creado` : `Espacio ${d.numero} actualizado`);
      setForm(null); recargar();
    } catch (err) { toast.error("No se pudo guardar el espacio", err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar(e) {
    if (!(await confirmar({ titulo: `Eliminar el espacio ${e.numero}`, mensaje: "Esta acción no se puede deshacer. Los espacios con historial de estancias no se pueden eliminar.", accion: "Eliminar", peligro: true }))) return;
    try { await eliminarEspacio(token, e.id); toast.exito(`Espacio ${e.numero} eliminado`); recargar(); }
    catch (err) { toast.error("No se pudo eliminar", err.message); }
  }

  return (
    <>
      <PageHeader titulo={esAdmin ? "Espacios" : "Disponibilidad"} descripcion={esAdmin ? "Celdas del parqueadero por zona y tipo de vehículo" : "Espacios libres en este momento"}>
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
        {esAdmin && <button className="pc-btn pc-btn-primary" onClick={nuevo}><Plus />Nuevo espacio</button>}
      </PageHeader>
      <ErrorBox mensaje={errores.espacios} />

      <div className="pc-grid pc-grid-3 pc-mb">
        <StatCard etiqueta="Libres" icono={SquareParking} tono="tono-verde" cargando={cargando} valor={libres} sufijo={`/ ${espacios.length}`} medidor={espacios.length ? (libres / espacios.length) * 100 : 0} />
        <StatCard etiqueta="Carros libres" icono={SquareParking} cargando={cargando} valor={cuenta((e) => e.tipo === "carro" && e.estado === "disponible")} sufijo={`/ ${cuenta((e) => e.tipo === "carro")}`} />
        <StatCard etiqueta="Motos libres" icono={SquareParking} tono="tono-ambar" cargando={cargando} valor={cuenta((e) => e.tipo === "moto" && e.estado === "disponible")} sufijo={`/ ${cuenta((e) => e.tipo === "moto")}`} />
      </div>

      <Card cuerpo={false}>
        <div className="pc-toolbar">
          <div className="pc-input-icon"><Search /><input className="form-control" placeholder="Buscar número o zona" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar espacios" /></div>
          <select className="form-select" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar espacios">
            <option value="todos">Todos</option><option value="disponible">Libres</option><option value="ocupado">Ocupados</option><option value="carro">Carros</option><option value="moto">Motos</option>
          </select>
          <div className="pc-segmented ms-auto" role="tablist" aria-label="Vista">
            <button role="tab" aria-selected={vista === "mapa"} className={vista === "mapa" ? "activo" : ""} onClick={() => setVista("mapa")}><LayoutGrid />Mapa</button>
            <button role="tab" aria-selected={vista === "tabla"} className={vista === "tabla" ? "activo" : ""} onClick={() => setVista("tabla")}><List />Lista</button>
          </div>
        </div>
        {vista === "mapa" ? (
          <div className="pc-card-body">
            {cargando ? <span className="pc-skel" style={{ height: 260 }} /> : filtrados.length === 0 ? <EmptyState icono={SquareParking} titulo="Sin espacios" texto="Ningún espacio coincide con el filtro." /> : <MapaEspacios espacios={filtrados} estanciasActivas={activas} />}
          </div>
        ) : (
          <div className="pc-table-wrap">
            <table className="pc-table">
              <thead><tr><th>Número</th><th>Tipo</th><th>Zona</th><th>Estado</th>{esAdmin && <th className="acciones">Acciones</th>}</tr></thead>
              <tbody>
                {cargando ? <FilasCarga columnas={esAdmin ? 5 : 4} /> : filtrados.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.numero}</strong></td><td className="text-capitalize">{e.tipo}</td><td>{e.ubicacion}</td>
                    <td>{e.estado === "disponible" ? <Badge tono="tono-verde">Libre</Badge> : <Badge tono="tono-rojo">Ocupado</Badge>}</td>
                    {esAdmin && <td className="acciones">
                      <button className="pc-icon-btn" onClick={() => editar(e)} aria-label={`Editar ${e.numero}`} title="Editar"><Pencil /></button>
                      <button className="pc-icon-btn danger" disabled={e.estado === "ocupado"} onClick={() => eliminar(e)} aria-label={`Eliminar ${e.numero}`} title={e.estado === "ocupado" ? "No se puede eliminar un espacio ocupado" : "Eliminar"}><Trash2 /></button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal abierto={Boolean(form)} titulo={editando == null ? "Nuevo espacio" : "Editar espacio"} descripcion="Las celdas se agrupan en el mapa por su ubicación." icono={<SquareParking />} onCerrar={() => setForm(null)} onSubmit={guardar}
        pie={<><button type="button" className="pc-btn pc-btn-secondary" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className="pc-btn pc-btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button></>}>
        {form && (
          <div className="row g-3">
            <div className="col-6"><label htmlFor="es-num" className="form-label">Número</label><input id="es-num" className="form-control text-uppercase" required pattern="[A-Za-z0-9\-]{2,12}" title="2 a 12 letras, números o guion. Ej.: C-101" placeholder="C-101" value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value.toUpperCase() }))} /></div>
            <div className="col-6"><label htmlFor="es-tipo" className="form-label">Tipo</label><select id="es-tipo" className="form-select" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}><option value="carro">Carro</option><option value="moto">Moto</option></select></div>
            <div className="col-12"><label htmlFor="es-ubi" className="form-label">Ubicación / zona</label><input id="es-ubi" className="form-control" required minLength={2} maxLength={80} placeholder="Sótano 1 - Zona A" value={form.ubicacion} onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))} /></div>
          </div>
        )}
      </Modal>
    </>
  );
}
