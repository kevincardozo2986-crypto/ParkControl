import { useMemo, useState } from "react";
import { Pencil, Phone, Plus, RefreshCw, Search, Trash2, UserRound } from "lucide-react";
import { useRecursos } from "../hooks/useRecursos";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { actualizarConductor, crearConductor, eliminarConductor, listarConductores, listarVehiculos } from "../services/recursos.service";
import Modal from "./ui/Modal";
import { Card, EmptyState, ErrorBox, FilasCarga, PageHeader, Persona } from "./ui/elementos";
import { incluye } from "./formato";

const inicial = { nombre: "", documento: "", telefono: "", correo: "" };

export default function GestionConductores({ token, rol }) {
  const esAdmin = rol === "administrador";
  const toast = useToast();
  const confirmar = useConfirmar();
  const { datos, errores, cargando, recargar } = useRecursos(token, { conductores: listarConductores, vehiculos: listarVehiculos });
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const conductores = useMemo(() => datos.conductores ?? [], [datos.conductores]);
  const vehiculosPor = useMemo(() => (datos.vehiculos ?? []).reduce((a, v) => ({ ...a, [v.conductorId]: (a[v.conductorId] ?? 0) + 1 }), {}), [datos.vehiculos]);
  const filtrados = conductores.filter((c) => incluye(`${c.nombre} ${c.documento} ${c.correo} ${c.telefono}`, busqueda));

  function nuevo() { setEditando(null); setForm({ ...inicial }); }
  function editar(c) { setEditando(c.id); setForm({ nombre: c.nombre ?? "", documento: c.documento ?? "", telefono: c.telefono ?? "", correo: c.correo ?? "" }); }
  const campo = (n, v) => setForm((f) => ({ ...f, [n]: v }));

  async function guardar() {
    setGuardando(true);
    try {
      const d = { nombre: form.nombre.trim(), documento: form.documento.trim(), telefono: form.telefono.trim(), correo: form.correo.trim() };
      if (editando == null) await crearConductor(token, d); else await actualizarConductor(token, editando, d);
      toast.exito(editando == null ? "Conductor registrado" : "Conductor actualizado", d.nombre);
      setForm(null); recargar();
    } catch (err) { toast.error("No se pudo guardar el conductor", err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar(c) {
    if (!(await confirmar({ titulo: `Eliminar a ${c.nombre}`, mensaje: "Esta acción no se puede deshacer. No es posible eliminar conductores con vehículos asociados.", accion: "Eliminar", peligro: true }))) return;
    try { await eliminarConductor(token, c.id); toast.exito("Conductor eliminado", c.nombre); recargar(); }
    catch (err) { toast.error("No se pudo eliminar", err.message); }
  }


  return (
    <>
      <PageHeader titulo="Conductores" descripcion={`${conductores.length} fichas registradas${esAdmin ? "" : " · solo consulta"}`}>
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
        {esAdmin && <button className="pc-btn pc-btn-primary" onClick={nuevo}><Plus />Nuevo conductor</button>}
      </PageHeader>
      <ErrorBox mensaje={errores.conductores} />

      <Card cuerpo={false} pie={<span>{filtrados.length} de {conductores.length} conductores</span>}>
        <div className="pc-toolbar">
          <div className="pc-input-icon"><Search /><input className="form-control" placeholder="Buscar por nombre, documento, correo o teléfono" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar conductores" /></div>
        </div>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Conductor</th><th>Documento</th><th>Contacto</th><th className="num">Vehículos</th>{esAdmin && <th className="acciones">Acciones</th>}</tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={esAdmin ? 5 : 4} /> : filtrados.map((c) => {
                return (
                  <tr key={c.id}>
                    <td><Persona nombre={c.nombre} detalle={c.correo} /></td>
                    <td className="pc-mono">CC {c.documento}</td>
                    <td><span className="d-inline-flex align-items-center gap-1 pc-muted"><Phone style={{ width: 13 }} />{c.telefono || "—"}</span></td>
                    <td className="num">{vehiculosPor[c.id] ?? 0}</td>
                    {esAdmin && <td className="acciones">
                      <button className="pc-icon-btn" onClick={() => editar(c)} aria-label={`Editar ${c.nombre}`} title="Editar"><Pencil /></button>
                      <button className="pc-icon-btn danger" onClick={() => eliminar(c)} aria-label={`Eliminar ${c.nombre}`} title="Eliminar"><Trash2 /></button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!cargando && filtrados.length === 0 && <EmptyState icono={UserRound} titulo="Sin conductores" texto={busqueda ? "Ningún conductor coincide con la búsqueda." : "Registra el primer conductor."} />}
        </div>
      </Card>

      <Modal abierto={Boolean(form)} titulo={editando == null ? "Nuevo conductor" : "Editar conductor"} icono={<UserRound />} onCerrar={() => setForm(null)} onSubmit={guardar}
        pie={<><button type="button" className="pc-btn pc-btn-secondary" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className="pc-btn pc-btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button></>}>
        {form && (
          <div className="row g-3">
            <div className="col-12"><label htmlFor="cd-nombre" className="form-label">Nombre completo</label><input id="cd-nombre" className="form-control" required minLength={3} maxLength={100} value={form.nombre} onChange={(e) => campo("nombre", e.target.value)} /></div>
            <div className="col-6"><label htmlFor="cd-doc" className="form-label">Documento</label><input id="cd-doc" className="form-control" inputMode="numeric" required pattern="[0-9]{6,15}" title="6 a 15 dígitos" value={form.documento} onChange={(e) => campo("documento", e.target.value)} /></div>
            <div className="col-6"><label htmlFor="cd-tel" className="form-label">Teléfono</label><input id="cd-tel" className="form-control" inputMode="tel" required pattern="[0-9]{7,15}" title="7 a 15 dígitos" value={form.telefono} onChange={(e) => campo("telefono", e.target.value)} /></div>
            <div className="col-12"><label htmlFor="cd-correo" className="form-label">Correo</label><input id="cd-correo" type="email" className="form-control" required value={form.correo} onChange={(e) => campo("correo", e.target.value)} /></div>
          </div>
        )}
      </Modal>

    </>
  );
}
