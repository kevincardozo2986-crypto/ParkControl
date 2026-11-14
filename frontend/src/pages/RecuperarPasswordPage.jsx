import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { restablecerConCodigo } from "../services/seguridad.service";
import AuthLayout, { CampoPassword } from "../components/AuthLayout";
import { ErrorBox } from "../components/ui/elementos";

const passwordSegura = (v) => v.length >= 12 && v.length <= 72 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);

export default function RecuperarPasswordPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    if (!passwordSegura(passwordNueva)) { setError("La contraseña debe tener 12 a 72 caracteres, mayúscula, minúscula y número."); return; }
    if (passwordNueva !== confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
    setCargando(true);
    try {
      await restablecerConCodigo({ email: email.trim(), codigo: codigo.trim(), passwordNueva, confirmarPassword });
      navigate("/login", { replace: true, state: { aviso: "Contraseña restablecida. Inicia sesión con tu nueva contraseña." } });
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Espera antes de volver a intentarlo."
        : err.status === 400 ? "No se pudo restablecer la contraseña. Revisa el código y los datos ingresados."
          : err.message || "No fue posible restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout titulo="Recuperar acceso" descripcion="Usa uno de los ocho códigos de respaldo que guardaste. Cada código funciona una sola vez.">
      <form onSubmit={enviar}>
        <div className="mb-3">
          <label htmlFor="rec-email" className="form-label">Correo electrónico</label>
          <input id="rec-email" className="form-control" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label htmlFor="rec-codigo" className="form-label">Código de respaldo</label>
          <input id="rec-codigo" className="form-control font-monospace" type="text" autoComplete="off" spellCheck="false" required
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
        </div>
        <CampoPassword id="rec-password" etiqueta="Nueva contraseña" valor={passwordNueva} onCambio={setPasswordNueva} autoComplete="new-password" minLength={12} maxLength={72}
          ayuda="Entre 12 y 72 caracteres, con mayúscula, minúscula y número." />
        <CampoPassword id="rec-confirmar" etiqueta="Confirmar contraseña" valor={confirmarPassword} onCambio={setConfirmarPassword} autoComplete="new-password" minLength={12} maxLength={72} />
        <ErrorBox mensaje={error} />
        <button type="submit" className="pc-btn pc-btn-primary pc-btn-lg pc-btn-block" disabled={cargando}><KeyRound />{cargando ? "Restableciendo…" : "Restablecer contraseña"}</button>
      </form>
      <div className="pc-auth-links"><Link to="/login"><ArrowLeft style={{ width: 14 }} /> Volver al inicio de sesión</Link></div>
    </AuthLayout>
  );
}
