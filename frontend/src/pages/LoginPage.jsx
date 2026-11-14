import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CircleCheck, KeyRound, LoaderCircle, Mail, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { CLAVE_AVISO } from "../context/auth-context";
import AuthLayout, { Campo, CampoPassword } from "../components/AuthLayout";
import { ErrorBox } from "../components/ui/elementos";

export default function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoSesion] = useState(() => {
    const aviso = sessionStorage.getItem(CLAVE_AVISO);
    sessionStorage.removeItem(CLAVE_AVISO);
    return aviso;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [intentos, setIntentos] = useState(0);
  const [cargando, setCargando] = useState(false);

  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function manejarLogin(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "No fue posible iniciar sesión");
      setIntentos((n) => n + 1);   // dispara la sacudida de la tarjeta
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout titulo="Bienvenido de nuevo" descripcion="Ingresa con tu cuenta para gestionar el parqueadero." sacudir={intentos}>
      {avisoSesion && <div className="pc-aviso tono-ambar" role="status"><TriangleAlert />{avisoSesion}</div>}
      {location.state?.aviso && <div className="pc-aviso tono-verde" role="status"><CircleCheck />{location.state.aviso}</div>}
      <form onSubmit={manejarLogin}>
        <Campo id="email" etiqueta="Correo electrónico" icono={Mail} type="email" autoComplete="username" placeholder="nombre@empresa.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <CampoPassword id="password" etiqueta="Contraseña" valor={password} onCambio={setPassword} placeholder="••••••••••••"
          accion={<Link to="/recuperar-password" className="pc-label-link">¿La olvidaste?</Link>} />
        <ErrorBox mensaje={error} />
        <button className="pc-btn pc-btn-primary pc-btn-lg pc-btn-block pc-btn-entrar" type="submit" disabled={cargando}>
          {cargando ? <><LoaderCircle className="pc-girar" />Validando…</> : <>Iniciar sesión<ArrowRight className="pc-flecha" /></>}
        </button>
      </form>
      <div className="pc-separador"><span>o</span></div>
      <Link to="/restablecer-token" className="pc-btn pc-btn-fantasma pc-btn-block"><KeyRound />Tengo un token del administrador</Link>
    </AuthLayout>
  );
}
