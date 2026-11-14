import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Power, RefreshCw, Search, Trash2, UserCog, Users } from "lucide-react";
import { useConfirmar, useToast } from "../hooks/useFeedback";
import { listarUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario, eliminarUsuario } from "../services/usuarios.service";
import { CampoPassword } from "./AuthLayout";
import Modal from "./ui/Modal";
import { Badge, Card, EmptyState, ErrorBox, FilasCarga, PageHeader, Persona } from "./ui/elementos";
import { ROLES, formatoFecha } from "./formato";

const vacio = { nombre: "", email: "", password: "", rol: "operador" };

export default function GestionUsuarios({ token, usuario: actual }) {
  const toast = useToast();
  const confirmar = useConfirmar();
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState({ usuarios: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [revision, setRevision] = useState(0);

  // La carga se dispara al cambiar filtros, página o revisión.
  useEffect(() => {
    let vigente = true;
    listarUsuarios(token, { q, rol, activo, pagina })
      .then((datos) => { if (vigente) { setResultado(datos); setError(""); } })
      .catch((err) => { if (vigente) setError(err.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [token, q, rol, activo, pagina, revision]);

  const recargar = useCallback(() => { setCargando(true); setRevision((n) => n + 1); }, []);
  const filtrar = (fn) => (e) => { fn(e.target.value); setPagina(1); setCargando(true); };
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / 20));

  async function guardar() {
    setGuardando(true);
    try {
      if (editando) await editarUsuario(token, editando.id, { nombre: form.nombre.trim(), email: form.email.trim() });
      else await crearUsuario(token, { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, rol: form.rol });
      toast.exito(editando ? "Usuario actualizado" : "Cuenta creada", form.email.trim());
      setForm(null); recargar();
    } catch (err) { toast.error("No se pudo guardar", err.message); }
    finally { setGuardando(false); }
  }

  async function eliminar(u) {
    const ok = await confirmar({
      titulo: `Eliminar la cuenta de ${u.nombre}`,
      mensaje: `${u.email} perderá el acceso de forma permanente. Esta acción no se puede deshacer; si solo quieres bloquearla temporalmente, usa Desactivar.`,
      accion: "Eliminar cuenta", peligro: true,
    });
    if (!ok) return;
    try { await eliminarUsuario(token, u.id); toast.exito("Cuenta eliminada", u.email); recargar(); }
    catch (err) { toast.error("No se pudo eliminar la cuenta", err.message); }
  }

  async function alternar(u) {
    const desactivar = u.activo;
    const ok = await confirmar({
      titulo: `${desactivar ? "Desactivar" : "Activar"} la cuenta de ${u.nombre}`,
      mensaje: desactivar ? "La persona no podrá iniciar sesión y sus sesiones abiertas se cerrarán de inmediato." : "La persona podrá volver a iniciar sesión.",
      accion: desactivar ? "Desactivar" : "Activar", peligro: desactivar,
    });
    if (!ok) return;
    try { await cambiarEstadoUsuario(token, u.id, !u.activo); toast.exito(desactivar ? "Cuenta desactivada" : "Cuenta activada", u.email); recargar(); }
    catch (err) { toast.error("No se pudo cambiar el estado", err.message); }
  }

  return (
    <>
      <PageHeader titulo="Usuarios y roles" descripcion="Cuentas de acceso de administradores y operadores">
        <button className="pc-btn pc-btn-secondary" onClick={recargar} disabled={cargando}><RefreshCw />Actualizar</button>
        <button className="pc-btn pc-btn-primary" onClick={() => { setEditando(null); setForm({ ...vacio }); }}><Plus />Crear cuenta</button>
      </PageHeader>
      <ErrorBox mensaje={error} />

      <Card cuerpo={false}
        pie={<><span>{resultado.total} usuarios · página {pagina} de {totalPaginas}</span>
          <div className="d-flex gap-2">
            <button className="pc-btn pc-btn-secondary pc-btn-sm" disabled={pagina <= 1} onClick={() => { setPagina((p) => p - 1); setCargando(true); }}><ChevronLeft />Anterior</button>
            <button className="pc-btn pc-btn-secondary pc-btn-sm" disabled={pagina >= totalPaginas} onClick={() => { setPagina((p) => p + 1); setCargando(true); }}>Siguiente<ChevronRight /></button>
          </div></>}>
        <div className="pc-toolbar">
          <div className="pc-input-icon"><Search /><input className="form-control" value={q} maxLength={100} onChange={filtrar(setQ)} placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios" /></div>
          <select className="form-select" value={rol} onChange={filtrar(setRol)} aria-label="Filtrar por rol"><option value="">Todos los roles</option>{Object.entries(ROLES).map(([v, r]) => <option key={v} value={v}>{r.etiqueta}</option>)}</select>
          <select className="form-select" value={activo} onChange={filtrar(setActivo)} aria-label="Filtrar por estado"><option value="">Todos los estados</option><option value="true">Activos</option><option value="false">Inactivos</option></select>
        </div>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Registro</th><th>Estado</th><th className="acciones">Acciones</th></tr></thead>
            <tbody>
              {cargando ? <FilasCarga columnas={5} /> : resultado.usuarios.map((u) => (
                <tr key={u.id} style={u.activo ? undefined : { opacity: .65 }}>
                  <td><Persona nombre={u.nombre} detalle={u.email} /></td>
                  <td><Badge tono={ROLES[u.rol]?.tono} punto={false}>{ROLES[u.rol]?.etiqueta ?? u.rol}</Badge></td>
                  <td className="pc-mono">{formatoFecha(u.fechaRegistro)}</td>
                  <td>{u.activo ? <Badge tono="tono-verde">Activo</Badge> : <Badge tono="tono-gris">Inactivo</Badge>}</td>
                  <td className="acciones">
                    <button className="pc-icon-btn" onClick={() => { setEditando(u); setForm({ nombre: u.nombre, email: u.email }); }} aria-label={`Editar ${u.nombre}`} title="Editar"><Pencil /></button>
                    <button className={`pc-icon-btn ${u.activo ? "danger" : ""}`} disabled={String(u.id) === String(actual?.id)} onClick={() => alternar(u)} aria-label={`${u.activo ? "Desactivar" : "Activar"} ${u.nombre}`} title={String(u.id) === String(actual?.id) ? "No puedes desactivar tu propia cuenta" : u.activo ? "Desactivar" : "Activar"}><Power /></button>
                    <button className="pc-icon-btn danger" disabled={String(u.id) === String(actual?.id)} onClick={() => eliminar(u)} aria-label={`Eliminar ${u.nombre}`} title={String(u.id) === String(actual?.id) ? "No puedes eliminar tu propia cuenta" : "Eliminar"}><Trash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && resultado.usuarios.length === 0 && <EmptyState icono={Users} titulo="Sin usuarios" texto="Ninguna cuenta coincide con los filtros." />}
        </div>
      </Card>

      <Modal abierto={Boolean(form)} titulo={editando ? "Editar usuario" : "Crear cuenta"} descripcion={editando ? "El rol y la contraseña no se cambian desde aquí." : "Elige si la persona administra el sistema o solo opera la portería."}
        icono={<UserCog />} onCerrar={() => setForm(null)} onSubmit={guardar}
        pie={<><button type="button" className="pc-btn pc-btn-secondary" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className="pc-btn pc-btn-primary" disabled={guardando}>{guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cuenta"}</button></>}>
        {form && (
          <>
            <div className="mb-3"><label className="form-label" htmlFor="nombreNuevo">Nombre</label><input id="nombreNuevo" className="form-control" minLength={3} maxLength={100} required value={form.nombre} onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label" htmlFor="emailNuevo">Correo</label><input id="emailNuevo" type="email" className="form-control" required value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} /></div>
            {!editando && <>
              <span className="form-label d-block">Rol</span>
              <div className="pc-segmented w-100 mb-3" role="radiogroup" aria-label="Rol">{Object.entries(ROLES).map(([v, r]) => <button key={v} type="button" role="radio" aria-checked={form.rol === v} className={`flex-fill justify-content-center ${form.rol === v ? "activo" : ""}`} onClick={() => setForm((f) => ({ ...f, rol: v }))}>{r.etiqueta}</button>)}</div>
              <CampoPassword id="claveNueva" etiqueta="Contraseña inicial" valor={form.password} onCambio={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" minLength={12} maxLength={72} ayuda="12 a 72 caracteres con mayúscula, minúscula y número." />
            </>}
          </>
        )}
      </Modal>
    </>
  );
}
