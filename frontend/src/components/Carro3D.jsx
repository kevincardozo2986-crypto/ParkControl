import { useEffect, useRef, useState } from "react";

// Modelo 3D: "Car Concept" — Khronos Group, glTF Sample Assets (CC BY 4.0),
// optimizado por Eric Chadwick (Darmstadt Graphics Group) a partir de un modelo
// de dominio público de "Unity Fan" en Sketchfab.
// https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
// Comprimido para la web (meshopt + texturas WebP): 11,8 MB → 2,4 MB.
import modelo from "../assets/carro.glb?url";

// Tiempos de la maniobra (ms)
const ENTRADA = 2600;     // el carro entra y frena
const GIRO = 3000;        // vuelta de 360° al parquear

const reducido = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// fase: "cargando" → "entrando" → "girando" → "parqueado"
export default function Carro3D({ vuelta, onFase }) {
  const ref = useRef(null);
  const [listo, setListo] = useState(false);
  const [fase, setFase] = useState("cargando");

  // model-viewer pesa (incluye three.js): se carga solo cuando se muestra el login
  useEffect(() => {
    let vivo = true;
    import("@google/model-viewer").then(({ ModelViewerElement }) => {
      // El decodificador meshopt viene incluido; este archivo local solo marca que está listo
      ModelViewerElement.meshoptDecoderLocation = "/meshopt-listo.js";
      if (vivo) setListo(true);
    });
    return () => { vivo = false; };
  }, []);

  // Cada "vuelta" (o la primera carga) repite: entrar → girar 360° → quedar girando despacio
  useEffect(() => {
    const mv = ref.current;
    if (!listo || !mv) return;
    const timers = [];
    const cambiar = (f) => { setFase(f); onFase?.(f); };

    const maniobra = () => {
      mv.autoRotate = false;
      mv.cameraOrbit = "-90deg 76deg 105%";   // de perfil, con el frente hacia la derecha (cámara en -X)
      mv.jumpCameraToGoal?.();
      mv.resetTurntableRotation?.(0);
      if (reducido()) { cambiar("parqueado"); return; }
      cambiar("entrando");
      timers.push(setTimeout(() => {
        cambiar("girando");
        mv.rotationPerSecond = "120deg";       // 360° en 3 s
        mv.autoRotateDelay = 0;
        mv.autoRotate = true;
      }, ENTRADA));
      timers.push(setTimeout(() => {
        mv.rotationPerSecond = "14deg";        // luego sigue girando despacio
        mv.autoRotateDelay = 2500;             // al soltar el mouse, retoma
        cambiar("parqueado");
      }, ENTRADA + GIRO));
    };

    if (mv.loaded) maniobra();
    else mv.addEventListener("load", maniobra, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      mv.removeEventListener("load", maniobra);
    };
  }, [listo, vuelta, onFase]);

  if (!listo) return <div className="pc-3d-cargando" aria-hidden="true" />;

  return (
    <div className={`pc-3d pc-3d-${fase}`} key={vuelta}>
      <model-viewer
        ref={ref}
        src={modelo}
        alt="Modelo 3D de un carro concepto que gira sobre la plataforma"
        camera-orbit="-90deg 76deg 105%"
        min-camera-orbit="auto 55deg auto"
        max-camera-orbit="auto 90deg auto"
        field-of-view="21deg"
        camera-controls=""
        disable-zoom=""
        disable-pan=""
        interaction-prompt="none"
        environment-image="neutral"
        exposure="1.15"
        shadow-intensity="1.1"
        shadow-softness="0.9"
        tone-mapping="aces"
        loading="eager"
        style={{ width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" }}
      />
    </div>
  );
}
