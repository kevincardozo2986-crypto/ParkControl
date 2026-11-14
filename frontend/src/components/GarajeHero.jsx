// Escena animada del login: vehículo sobre plataforma con aro de luz,
// barrido luminoso, partículas y faros que encienden al entrar.
//
// Foto real: guarda una imagen del carro (ideal PNG/WebP con fondo transparente,
// vista frontal) como src/assets/carro.png | carro.webp | carro.jpg y se usará
// automáticamente en lugar de la ilustración.
// Foto actual: Kia K4, Hyundai Motor Group en Unsplash (Unsplash License)
// https://unsplash.com/photos/a-car-is-shown-in-a-dark-room-inMbhliWblc
import { lazy, Suspense, useState } from "react";

const fotos = import.meta.glob("../assets/carro.{png,webp,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
const FOTO = Object.values(fotos)[0] ?? null;

// Modelo 3D (src/assets/carro.glb): si existe, tiene prioridad sobre la foto
const HAY_MODELO = Object.keys(import.meta.glob("../assets/carro.glb")).length > 0;
const Carro3D = lazy(() => import("./Carro3D"));
const soporta3D = () => {
  try { const c = document.createElement("canvas"); return Boolean(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
};

// Posiciones fijas de las partículas (determinísticas para no re-renderizar distinto)
const PARTICULAS = [
  [12, 0, 7], [22, 1.6, 9], [31, 3.1, 6], [40, 0.8, 8], [49, 2.4, 10], [58, 4.2, 7],
  [66, 1.1, 9], [74, 3.6, 6], [83, 0.4, 8], [90, 2.9, 7], [18, 5.0, 9], [62, 5.6, 8],
];

function CarroIlustrado() {
  return (
    <svg className="pc-garaje-svg" viewBox="96 52 328 180" aria-hidden="true">
      <defs>
        <linearGradient id="gh-carro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ececf1" />
          <stop offset=".5" stopColor="#a6a6b1" />
          <stop offset="1" stopColor="#55555f" />
        </linearGradient>
        <linearGradient id="gh-vidrio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3d48" />
          <stop offset="1" stopColor="#0f0f14" />
        </linearGradient>
        <linearGradient id="gh-reflejo" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="gh-brillo" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
        <clipPath id="gh-silueta">
          <path d="M150 112 C160 78 186 62 216 60 L304 60 C334 62 360 78 370 112 L398 128 C412 136 418 150 416 166 L412 196 C411 208 402 216 390 216 L130 216 C118 216 109 208 108 196 L104 166 C102 150 108 136 122 128 Z" />
        </clipPath>
      </defs>
      <rect x="128" y="182" width="42" height="46" rx="10" fill="#0e0e12" />
      <rect x="350" y="182" width="42" height="46" rx="10" fill="#0e0e12" />
      <path d="M150 112 C160 78 186 62 216 60 L304 60 C334 62 360 78 370 112 L398 128 C412 136 418 150 416 166 L412 196 C411 208 402 216 390 216 L130 216 C118 216 109 208 108 196 L104 166 C102 150 108 136 122 128 Z" fill="url(#gh-carro)" />
      <path d="M170 112 C178 88 196 76 220 75 L300 75 C324 76 342 88 350 112 Z" fill="url(#gh-vidrio)" />
      <path d="M186 104 C192 90 204 84 222 83 L250 83" stroke="#fff" strokeOpacity=".18" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M150 112 l-22 -6 c-6 -2 -9 4 -5 8 l20 10 z" fill="#8c8c97" />
      <path d="M370 112 l22 -6 c6 -2 9 4 5 8 l-20 10 z" fill="#8c8c97" />
      <path d="M126 130 C200 118 320 118 394 130" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
      <rect x="128" y="152" width="40" height="10" rx="4" fill="#1b1b22" />
      <rect x="352" y="152" width="40" height="10" rx="4" fill="#1b1b22" />
      <path d="M140 176 L380 176 L372 204 L148 204 Z" fill="#26262e" />
      <rect x="222" y="182" width="76" height="20" rx="3" fill="#f5c200" stroke="#111" strokeWidth="1.5" />
      <text x="260" y="196.5" textAnchor="middle" style={{ font: "800 12px Inter Variable, Arial, sans-serif", letterSpacing: ".12em", fill: "#111" }}>PARK·01</text>
      <path d="M252 128 h16 a6 6 0 0 1 0 12 h-10 v6" fill="none" stroke="#2b2b33" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Faros: encienden con parpadeo al entrar y luego "respiran" */}
      <g className="pc-faros">
        <rect x="120" y="140" width="98" height="6" rx="3" fill="#fff" filter="url(#gh-brillo)" />
        <rect x="302" y="140" width="98" height="6" rx="3" fill="#fff" filter="url(#gh-brillo)" />
        <rect x="120" y="140" width="98" height="6" rx="3" fill="#fff" />
        <rect x="302" y="140" width="98" height="6" rx="3" fill="#fff" />
        <rect x="218" y="141.5" width="84" height="3" rx="1.5" fill="#e9d5ff" />
      </g>
      {/* Reflejo que recorre la carrocería */}
      <g clipPath="url(#gh-silueta)">
        <rect className="pc-reflejo" x="60" y="40" width="70" height="200" fill="url(#gh-reflejo)" transform="skewX(-18)" />
      </g>
    </svg>
  );
}

export default function GarajeHero() {
  // Cada clic vuelve a montar el carro para repetir la maniobra de parqueo
  const [vuelta, setVuelta] = useState(0);
  const [fase, setFase] = useState(null);
  const [usar3D] = useState(() => HAY_MODELO && soporta3D());
  const repetir = () => setVuelta((v) => v + 1);
  return (
    <div className={`pc-garaje ${usar3D ? "con-3d" : FOTO ? "con-foto" : ""}`} aria-label="Vehículo entrando y parqueando sobre la plataforma" role="img"
      title={usar3D ? "Arrastra para girar el carro · doble clic para volver a parquear" : "Clic para volver a parquear"}
      onClick={usar3D ? undefined : repetir} onDoubleClick={usar3D ? repetir : undefined}>
      <div className="pc-garaje-aurora" aria-hidden="true" />
      <svg className="pc-garaje-base" viewBox="0 0 520 300" aria-hidden="true">
        <defs>
          <radialGradient id="gb-piso" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#a855f7" stopOpacity=".4" />
            <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gb-aro" x1="0" x2="1">
            <stop offset="0" stopColor="#7c3aed" stopOpacity=".25" />
            <stop offset=".5" stopColor="#d08bff" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity=".25" />
          </linearGradient>
          <linearGradient id="gb-plataforma" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#202028" />
            <stop offset="1" stopColor="#0c0c10" />
          </linearGradient>
          <filter id="gb-brillo" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <ellipse className="pc-piso" cx="260" cy="250" rx="250" ry="50" fill="url(#gb-piso)" />
        <ellipse cx="260" cy="236" rx="196" ry="30" fill="url(#gb-plataforma)" />
        <path d="M64 236 a196 30 0 0 0 392 0 v14 a196 30 0 0 1 -392 0 z" fill="#0b0b0f" />
        {/* Destello del aro cuando el carro termina de parquear */}
        {(!usar3D || fase === "girando") && <ellipse key={`llegada-${vuelta}-${fase}`} className={`pc-aro-llegada ${usar3D ? "ya" : ""}`} cx="260" cy="244" rx="206" ry="34" fill="none" stroke="#e9d5ff" strokeWidth="5" filter="url(#gb-brillo)" />}
        <ellipse className="pc-aro-halo" cx="260" cy="244" rx="206" ry="34" fill="none" stroke="url(#gb-aro)" strokeWidth="8" filter="url(#gb-brillo)" />
        <ellipse cx="260" cy="244" rx="206" ry="34" fill="none" stroke="url(#gb-aro)" strokeWidth="2.5" />
        {/* Destello que recorre el aro */}
        <ellipse className="pc-aro-luz" cx="260" cy="244" rx="206" ry="34" fill="none" stroke="#f3e8ff" strokeWidth="3.5" strokeLinecap="round" pathLength="100" strokeDasharray="10 90" filter="url(#gb-brillo)" />
        <ellipse className="pc-aro-luz" cx="260" cy="244" rx="206" ry="34" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" pathLength="100" strokeDasharray="6 94" />
        {/* Ondas que salen de la plataforma */}
        <ellipse className="pc-onda" cx="260" cy="244" rx="206" ry="34" fill="none" stroke="#a855f7" strokeWidth="1.5" />
        <ellipse className="pc-onda pc-onda-2" cx="260" cy="244" rx="206" ry="34" fill="none" stroke="#a855f7" strokeWidth="1.5" />
        <ellipse cx="260" cy="226" rx="150" ry="13" fill="#000" opacity=".6" />
      </svg>

      {usar3D ? (
        <>
          {fase === "entrando" && <div className="pc-estela pc-estela-3d" key={`e-${vuelta}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>}
          <Suspense fallback={<div className="pc-3d-cargando" aria-hidden="true" />}>
            <Carro3D vuelta={vuelta} onFase={setFase} />
          </Suspense>
        </>
      ) : (
      <div className="pc-garaje-carro" key={vuelta}>
        {FOTO && <div className="pc-estela" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
        <div className="pc-garaje-flotar">
          {FOTO ? (
            <div className="pc-foto-wrap">
              <img src={FOTO} alt="" className="pc-garaje-foto" draggable="false" />
              <span className="pc-foto-faro" aria-hidden="true" />
              <span className="pc-foto-haz" aria-hidden="true" />
              <span className="pc-foto-freno" aria-hidden="true" />
              <span className="pc-foto-barrido" aria-hidden="true" />
            </div>
          ) : <CarroIlustrado />}
        </div>
      </div>
      )}

      <div className="pc-particulas" aria-hidden="true">
        {PARTICULAS.map(([x, retraso, dur], i) => (
          <span key={i} style={{ left: `${x}%`, animationDelay: `${retraso}s`, animationDuration: `${dur}s` }} />
        ))}
      </div>
    </div>
  );
}
