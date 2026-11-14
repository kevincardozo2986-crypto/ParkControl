import { useEffect, useState } from "react";
import { Copy, Download, KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useFeedback";
import { estadoCodigos, generarCodigos } from "../services/seguridad.service";
import { CampoPassword } from "./AuthLayout";
import { Badge, Card, ErrorBox, PageHeader } from "./ui/elementos";

export default function CodigosRecuperacion() {
  const { token, logout } = useAuth();
  const toast = useToast();
  const [disponibles, setDisponibles] = useState(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [codigos, setCodigos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    estadoCodigos(token, controller.signal)
      .then((datos) => setDisponibles(datos.disponibles))
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [token]);

  async function generar(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      const datos = await generarCodigos(token, passwordActual, disponibles > 0);
      setCodigos(datos.codigos);
      setDisponibles(datos.codigos.length);
      setPasswordActual("");
    } catch (e) {
      // 401 por contraseña incorrecta: se cierra la sesión por seguridad
      if (e.status === 401) { logout(); return; }
      setError(e.message);
    } finally { setCargando(false); }
  }

  function descargar() {
    const texto = ["ParkControl — códigos de recuperación", "Guárdelos fuera del dispositivo compartido.", "", ...codigos].join("\n");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "codigos-recuperacion-parkcontrol.txt";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(codigos.join("\n")); toast.exito("Códigos copiados al portapapeles"); }
    catch { toast.error("No se pudo copiar", "Descarga el archivo .txt en su lugar."); }
  }

  return (
    <>
      <PageHeader titulo="Códigos de respaldo" descripcion="Te permiten recuperar el acceso si olvidas la contraseña. Cada código funciona una sola vez." />
      <div className="pc-grid pc-grid-main">
        <Card titulo={codigos.length ? "Guarda tus códigos ahora" : disponibles > 0 ? "Regenerar códigos" : "Generar códigos"}
          acciones={disponibles != null && <Badge tono={disponibles ? "tono-verde" : "tono-gris"}>{disponibles} disponibles</Badge>}>
          {codigos.length > 0 ? (
            <>
              <div className="pc-aviso tono-ambar"><TriangleAlert />No volverán a mostrarse. Guárdalos en un lugar seguro, fuera de equipos compartidos.</div>
              <div className="pc-codes">{codigos.map((c) => <code key={c}>{c}</code>)}</div>
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="pc-btn pc-btn-secondary" onClick={descargar}><Download />Descargar .txt</button>
                <button type="button" className="pc-btn pc-btn-secondary" onClick={copiar}><Copy />Copiar</button>
                <button type="button" className="pc-btn pc-btn-primary ms-auto" onClick={() => setCodigos([])}>Ya los guardé</button>
              </div>
            </>
          ) : (
            <form onSubmit={generar} style={{ maxWidth: 460 }}>
              {disponibles > 0 && <div className="pc-aviso tono-ambar"><TriangleAlert />Regenerar invalida todos los códigos anteriores, incluso los que no has usado.</div>}
              <CampoPassword id="passwordActualCodigos" etiqueta="Confirma tu contraseña actual" valor={passwordActual} onCambio={setPasswordActual} />
              <ErrorBox mensaje={error} />
              <button className="pc-btn pc-btn-primary" disabled={cargando || disponibles === null}><KeyRound />{cargando ? "Procesando…" : disponibles > 0 ? "Regenerar ocho códigos" : "Generar ocho códigos"}</button>
            </form>
          )}
        </Card>
        <Card titulo="¿Cómo funcionan?">
          <ol className="ps-3 mb-0 d-grid gap-2 pc-muted">
            <li>Genera ocho códigos y guárdalos.</li>
            <li>Si olvidas la contraseña, entra a «¿Olvidaste tu contraseña?» en el inicio de sesión.</li>
            <li>Usa un código junto con tu correo para definir una nueva contraseña.</li>
          </ol>
          <p className="pc-muted small mt-3 mb-0 d-flex gap-2"><ShieldCheck style={{ width: 16, flexShrink: 0 }} />Solo guardamos una huella cifrada de cada código.</p>
        </Card>
      </div>
    </>
  );
}
