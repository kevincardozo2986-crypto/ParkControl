// Utilidades de presentación compartidas
const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const compacta = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const fechaHora = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const soloHora = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" });

export const formatoMoneda = (valor) => (valor == null || valor === "" ? "—" : moneda.format(Number(valor)));
export const formatoCompacto = (valor) => (valor == null ? "—" : compacta.format(Number(valor)));

export const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "—" : fechaHora.format(fecha);
};

export const formatoHora = (valor) => {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "—" : soloHora.format(fecha);
};

export const horas = (n) => (n == null ? "—" : `${n} h`);

// "2 h 15 min" desde una fecha hasta ahora
export function transcurrido(desde, ahora = Date.now()) {
  const ms = ahora - new Date(desde).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ${min % 60} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

export const incluye = (texto, busqueda) =>
  String(texto ?? "").toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es"));

export const iniciales = (nombre = "") =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

// Color estable por nombre para avatares
const PALETA = [["rgba(168, 85, 247, .18)", "#d8b4fe"], ["rgba(52, 211, 153, .16)", "#6ee7b7"], ["rgba(251, 191, 36, .16)", "#fcd34d"], ["rgba(96, 165, 250, .16)", "#93c5fd"], ["rgba(244, 114, 182, .16)", "#f9a8d4"], ["rgba(45, 212, 191, .16)", "#5eead4"]];
export function colorAvatar(nombre = "") {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [bg, fg] = PALETA[h % PALETA.length];
  return { background: bg, color: fg };
}

export const ROLES = {
  administrador: { etiqueta: "Administrador", tono: "tono-violeta" },
  operador: { etiqueta: "Operador", tono: "tono-azul" },
};

// Meses para gráficas
const nombresMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const etiquetaMes = (yyyymm) => nombresMes[Number(yyyymm.slice(5)) - 1];

// Últimos n meses (YYYY-MM) terminando en el actual
export function ultimosMeses(n = 6, base = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

