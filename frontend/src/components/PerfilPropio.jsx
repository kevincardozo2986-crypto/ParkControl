import { useEffect, useState } from "react";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { consultarPerfil } from "../services/seguridad.service";
import { Avatar, Badge, Card, PageHeader } from "./ui/elementos";
import { ROLES } from "./formato";

export default function PerfilPropio({ token, usuario, abrir }) {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    consultarPerfil(token, controller.signal)
      .then((p) => setPerfil(p.usuario))
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [token]);

  const actual = perfil || usuario || {};
  const rol = ROLES[actual.rol];

  return (
    <>
      <PageHeader titulo="Mi perfil" descripcion="Información de tu cuenta" />
      {error && <div className="pc-error" role="alert">{error}</div>}
      <div className="pc-grid pc-grid-main">
        <Card cuerpo={false}>
          <div className="pc-card-body d-flex align-items-center gap-3" style={{ borderBottom: "1px solid var(--pc-border)" }}>
            <Avatar nombre={actual.nombre || "?"} tamano={56} />
            <div>
              <h2 className="h5 fw-bold mb-1">{actual.nombre || "—"}</h2>
              <div className="d-flex gap-2 align-items-center flex-wrap"><span className="pc-muted">{actual.email}</span>{rol && <Badge tono={rol.tono} punto={false}>{rol.etiqueta}</Badge>}</div>
            </div>
          </div>
          <div className="pc-card-body">
            <dl className="pc-dl">
              <dt>Nombre de cuenta</dt><dd>{actual.nombre || "—"}</dd>
              <dt>Correo de acceso</dt><dd>{actual.email || "—"}</dd>
              <dt>Rol</dt><dd>{rol?.etiqueta ?? actual.rol ?? "—"}</dd>
            </dl>
          </div>
        </Card>
        <Card titulo="Seguridad" descripcion="Protege el acceso a tu cuenta">
          <div className="pc-quick">
            <button onClick={() => abrir("/cambiar-password")}><span className="pc-stat-icon tono-azul"><LockKeyhole /></span><span><strong>Cambiar contraseña</strong><small>Cierra las sesiones abiertas</small></span></button>
            <button onClick={() => abrir("/codigos-recuperacion")}><span className="pc-stat-icon tono-verde"><KeyRound /></span><span><strong>Códigos de respaldo</strong><small>Recupera el acceso sin ayuda</small></span></button>
          </div>
          <p className="pc-muted small mt-3 mb-0 d-flex gap-2"><ShieldCheck style={{ width: 16, flexShrink: 0 }} />Tu rol y tus datos de identificación solo pueden cambiarse desde administración.</p>
        </Card>
      </div>
    </>
  );
}
