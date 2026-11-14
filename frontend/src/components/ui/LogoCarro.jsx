import { useId } from "react";

// Logo de ParkControl: carro deportivo en perfil sobre insignia morada,
// con faro encendido, líneas de velocidad y destello animado.
export default function LogoCarro({ tamano = 36, animado = true, className = "" }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={`pc-logo-carro ${animado ? "animado" : ""} ${className}`} style={{ width: tamano, height: tamano }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <linearGradient id={`lc-fondo-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c084fc" />
            <stop offset=".55" stopColor="#8b45f5" />
            <stop offset="1" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id={`lc-carro-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e9d5ff" />
          </linearGradient>
          <radialGradient id={`lc-faro-${id}`} cx="0" cy=".5" r="1">
            <stop offset="0" stopColor="#fff7d6" stopOpacity=".95" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`lc-clip-${id}`}><rect width="64" height="64" rx="18" /></clipPath>
        </defs>

        <g clipPath={`url(#lc-clip-${id})`}>
          <rect width="64" height="64" fill={`url(#lc-fondo-${id})`} />
          {/* brillo superior */}
          <path d="M0 0 H64 V20 C44 28 20 28 0 22 Z" fill="#fff" opacity=".14" />
          {/* piso */}
          <path d="M6 47.5 H60" stroke="#fff" strokeOpacity=".28" strokeWidth="1.4" strokeLinecap="round" />
          {/* líneas de velocidad */}
          <g className="pc-logo-velocidad" stroke="#fff" strokeLinecap="round">
            <path d="M3 29 H11" strokeWidth="2" strokeOpacity=".75" />
            <path d="M1 34.5 H9" strokeWidth="2" strokeOpacity=".5" />
            <path d="M4 40 H10" strokeWidth="2" strokeOpacity=".35" />
          </g>
          {/* haz del faro */}
          <path className="pc-logo-haz" d="M57 33 L64 29 L64 40 Z" fill={`url(#lc-faro-${id})`} />
          {/* sombra */}
          <ellipse cx="35" cy="46.5" rx="22" ry="2.2" fill="#2e1065" opacity=".55" />
          {/* carrocería */}
          <path d="M11 39.5 C11.5 35 15 32.6 21 31.8 L28.5 25.2 C30.6 23.4 33.2 22.5 36 22.5 L43 22.5 C47 22.5 50.2 24.2 52.6 27.3 L55.4 31 C57.6 31.8 59 33.6 59 36 L59 39.2 C59 40.8 57.9 41.8 56.3 41.8 L13.4 41.8 C11.9 41.8 10.9 40.9 11 39.5 Z" fill={`url(#lc-carro-${id})`} />
          {/* ventanas */}
          <path d="M30.6 30.8 L34.6 26.2 C35.5 25.3 36.6 24.9 37.9 24.9 L41.6 24.9 L41.6 30.8 Z" fill="#3b0764" opacity=".85" />
          <path d="M43.6 24.9 C46.4 25 48.4 26.4 49.8 28.4 L51.4 30.8 L43.6 30.8 Z" fill="#3b0764" opacity=".85" />
          {/* línea lateral */}
          <path d="M16 35.6 H54" stroke="#a855f7" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
          {/* faro y piloto */}
          <rect className="pc-logo-faro" x="54.6" y="32.6" width="4" height="2.2" rx="1.1" fill="#fde68a" />
          <rect x="11.4" y="34.2" width="2.6" height="2" rx="1" fill="#f87171" />
          {/* ruedas */}
          {[21, 48].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="42" r="5.6" fill="#1e0b3b" stroke="#fff" strokeWidth="1.8" />
              <circle cx={cx} cy="42" r="2" fill="#c084fc" />
            </g>
          ))}
        </g>
      </svg>
    </span>
  );
}
