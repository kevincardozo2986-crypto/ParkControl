import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, LockKeyhole, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cambiarPassword } from "../services/seguridad.service";
import { CampoPassword } from "./AuthLayout";
import { Card, ErrorBox, PageHeader } from "./ui/elementos";

const REGLAS = [
  ["Entre 12 y 72 caracteres", (v) => v.length >= 12 && v.length <= 72],
  ["Una letra mayúscula", (v) => /[A-Z]/.test(v)],
  ["Una letra minúscula", (v) => /[a-z]/.test(v)],
  ["Un número", (v) => /[0-9]/.test(v)],
];

export default function CambiarPassword() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [campos, setCampos] = useState({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const cumple = REGLAS.every(([, f]) => f(campos.passwordNueva));
  const coincide = campos.passwordNueva && campos.passwordNueva === campos.confirmarPassword;
  const campo = (k) => (v) => setCampos((c) => ({ ...c, [k]: v }));

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!cumple) { setError("La nueva contraseña no cumple la política."); return; }
    if (!coincide) { setError("Las contraseñas nuevas no coinciden."); return; }
    setCargando(true);
    try {
      await cambiarPassword(token, campos);
      // El backend incrementó version_sesion: el JWT actual ya no es válido.
      logout();
      navigate("/login", { replace: true, state: { aviso: "Contraseña actualizada. Inicia sesión con la nueva contraseña." } });
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  return (
    <>
      <PageHeader titulo="Cambiar contraseña" descripcion="Al terminar se cerrará esta sesión y cualquier otra abierta con tu cuenta." />
      <div className="pc-grid pc-grid-main">
        <Card>
          <form onSubmit={enviar} style={{ maxWidth: 460 }}>
            <CampoPassword id="passwordActual" etiqueta="Contraseña actual" valor={campos.passwordActual} onCambio={campo("passwordActual")} />
            <CampoPassword id="passwordNueva" etiqueta="Nueva contraseña" valor={campos.passwordNueva} onCambio={campo("passwordNueva")} autoComplete="new-password" />
            <CampoPassword id="confirmarPassword" etiqueta="Confirmar nueva contraseña" valor={campos.confirmarPassword} onCambio={campo("confirmarPassword")} autoComplete="new-password"
              ayuda={campos.confirmarPassword && !coincide ? "Las contraseñas no coinciden." : undefined} />
            <ErrorBox mensaje={error} />
            <button className="pc-btn pc-btn-primary" disabled={cargando || !cumple || !coincide || !campos.passwordActual}><LockKeyhole />{cargando ? "Guardando…" : "Actualizar contraseña"}</button>
          </form>
        </Card>
        <Card titulo="Requisitos">
          <ul className="list-unstyled mb-0 d-grid gap-2">
            {REGLAS.map(([texto, f]) => {
              const ok = f(campos.passwordNueva);
              return <li key={texto} className="d-flex align-items-center gap-2" style={{ color: ok ? "var(--pc-success)" : "var(--pc-muted)" }}>{ok ? <Check style={{ width: 16 }} /> : <X style={{ width: 16 }} />}{texto}</li>;
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
