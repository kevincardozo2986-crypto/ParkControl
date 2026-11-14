import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { restablecerConTokenAdmin } from "../services/seguridad.service";
import AuthLayout, { CampoPassword } from "../components/AuthLayout";
import { ErrorBox } from "../components/ui/elementos";

const segura = (v) => v.length >= 12 && v.length <= 72 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);

export default function RestablecerTokenPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function enviar(e) {
    e.preventDefault(); setError("");
    if (!/^[a-fA-F0-9]{64}$/.test(token.trim())) { setError("El token debe contener 64 caracteres hexadecimales."); return; }
    if (!segura(passwordNueva)) { setError("Utiliza de 12 a 72 caracteres con mayúscula, minúscula y número."); return; }
    if (passwordNueva !== confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
    setCargando(true);
    try {
      await restablecerConTokenAdmin({ token: token.trim(), passwordNueva, confirmarPassword });
      navigate("/login", { replace: true, state: { aviso: "Contraseña restablecida mediante recuperación administrativa. Inicia sesión nuevamente." } });
    } catch (err) {
      setError(err.status === 429 ? "Demasiados intentos. Intenta más tarde." : err.status === 400 ? "Token inválido, expirado, utilizado o datos incorrectos." : err.message || "No fue posible restablecer la contraseña.");
    } finally { setCargando(false); }
  }

  return (
    <AuthLayout titulo="Token de recuperación" descripcion="Introduce el token temporal que te entregó el administrador tras verificar tu identidad. Vence a los 15 minutos.">
      <form onSubmit={enviar}>
        <div className="mb-3">
          <label htmlFor="token-temporal" className="form-label">Token temporal</label>
          <textarea id="token-temporal" className="form-control font-monospace" rows="3" autoComplete="off" spellCheck="false" required value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <CampoPassword id="password-nueva-admin" etiqueta="Nueva contraseña" valor={passwordNueva} onCambio={setPasswordNueva} autoComplete="new-password" minLength={12} maxLength={72}
          ayuda="Entre 12 y 72 caracteres, con mayúscula, minúscula y número." />
        <CampoPassword id="confirmar-admin" etiqueta="Confirmar contraseña" valor={confirmarPassword} onCambio={setConfirmarPassword} autoComplete="new-password" minLength={12} maxLength={72} />
        <ErrorBox mensaje={error} />
        <button type="submit" className="pc-btn pc-btn-primary pc-btn-lg pc-btn-block" disabled={cargando}><ShieldCheck />{cargando ? "Restableciendo…" : "Restablecer contraseña"}</button>
      </form>
      <div className="pc-auth-links"><Link to="/login"><ArrowLeft style={{ width: 14 }} /> Volver al inicio de sesión</Link></div>
    </AuthLayout>
  );
}
