// Gráficas SVG ligeras (sin dependencias) para el panel.
import { useId, useState } from "react";

// Área con línea suave y punto activo al pasar el mouse
export function GraficaArea({ datos, formato = (v) => v, alto = 220 }) {
  const id = useId().replace(/:/g, "");
  const [activo, setActivo] = useState(null);
  const W = 640, H = alto, m = { t: 16, r: 12, b: 28, l: 52 };
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const techo = Math.ceil(max / 4 / Math.pow(10, Math.floor(Math.log10(max / 4 || 1)))) * Math.pow(10, Math.floor(Math.log10(max / 4 || 1))) * 4 || 1;
  const x = (i) => m.l + (i * (W - m.l - m.r)) / Math.max(1, datos.length - 1);
  const y = (v) => m.t + (H - m.t - m.b) * (1 - v / techo);
  const puntos = datos.map((d, i) => [x(i), y(d.valor)]);
  const linea = puntos.map(([px, py], i) => {
    if (!i) return `M${px},${py}`;
    const [ax, ay] = puntos[i - 1];
    const c = (px - ax) / 2;
    return `C${ax + c},${ay} ${px - c},${py} ${px},${py}`;
  }).join(" ");
  const area = `${linea} L${x(datos.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const p = activo != null ? datos[activo] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg className="pc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de ingresos por mes" onMouseLeave={() => setActivo(null)}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a855f7" stopOpacity=".35" />
            <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((k) => {
          const v = (techo / 4) * k;
          return <g key={k}><line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="#26262e" strokeDasharray={k ? "3 4" : ""} /><text x={m.l - 10} y={y(v) + 4} textAnchor="end">{formato(v)}</text></g>;
        })}
        <path d={area} fill={`url(#g${id})`} />
        <path d={linea} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
        {datos.map((d, i) => (
          <g key={d.etiqueta}>
            <text x={x(i)} y={H - 8} textAnchor="middle">{d.etiqueta}</text>
            <rect x={x(i) - 30} y={m.t} width="60" height={H - m.t - m.b} fill="transparent" onMouseEnter={() => setActivo(i)} />
            <circle cx={x(i)} cy={y(d.valor)} r={activo === i ? 5.5 : 3.5} fill="#fff" stroke="#a855f7" strokeWidth="2.5" pointerEvents="none" />
          </g>
        ))}
        {p && <line x1={x(activo)} x2={x(activo)} y1={m.t} y2={y(0)} stroke="#a855f7" strokeOpacity=".25" pointerEvents="none" />}
      </svg>
      {p && (
        <div className="pc-card" style={{ position: "absolute", left: `${(x(activo) / W) * 100}%`, top: 0, transform: "translateX(-50%)", padding: "8px 12px", fontSize: 12.5, pointerEvents: "none", boxShadow: "var(--pc-shadow)" }}>
          <div className="pc-muted">{p.etiquetaLarga ?? p.etiqueta}</div>
          <strong>{formato(p.valor, true)}</strong>{p.extra && <div className="pc-muted">{p.extra}</div>}
        </div>
      )}
    </div>
  );
}

// Barras verticales simples (p. ej. entradas por hora)
export function GraficaBarras({ datos, alto = 160, color = "#a855f7", resaltar }) {
  const W = 640, H = alto, m = { t: 12, b: 22 };
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const ancho = (W / datos.length) * 0.62;
  return (
    <svg className="pc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de barras">
      <line x1="0" x2={W} y1={H - m.b} y2={H - m.b} stroke="#26262e" />
      {datos.map((d, i) => {
        const cx = (i + 0.5) * (W / datos.length);
        const h = ((H - m.t - m.b) * d.valor) / max;
        return (
          <g key={d.etiqueta}>
            <rect x={cx - ancho / 2} y={H - m.b - Math.max(h, d.valor ? 3 : 0)} width={ancho} height={Math.max(h, d.valor ? 3 : 0)} rx="3"
              fill={resaltar === i ? color : color} fillOpacity={resaltar === i ? 1 : 0.55}>
              <title>{`${d.etiqueta}: ${d.valor}`}</title>
            </rect>
            {i % Math.ceil(datos.length / 8) === 0 && <text x={cx} y={H - 6} textAnchor="middle">{d.etiqueta}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Dona de ocupación
export function Dona({ valor, total, tamano = 132, color = "#a855f7", etiqueta }) {
  const r = 52, c = 2 * Math.PI * r;
  const p = total ? valor / total : 0;
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 132 132" role="img" aria-label={`${Math.round(p * 100)} % ${etiqueta ?? ""}`}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="#24242c" strokeWidth="14" />
      {p > 0 && <circle cx="66" cy="66" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 66 66)" style={{ transition: "stroke-dasharray .5s" }} />}
      <text x="66" y="64" textAnchor="middle" style={{ fontSize: 24, fontWeight: 700, fill: "#f4f4f6" }}>{Math.round(p * 100)}%</text>
      <text x="66" y="84" textAnchor="middle" style={{ fontSize: 11, fill: "#8e8e9a" }}>{etiqueta}</text>
    </svg>
  );
}
