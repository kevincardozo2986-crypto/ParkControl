// DAST con OWASP ZAP (daemon en 127.0.0.1:8090) controlado por su API REST.
// Uso: node dast-zap.js <credenciales.json> <dir-reportes>
const fs = require("node:fs");
const [credPath, dir] = process.argv.slice(2);
const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
const ZAP = "http://127.0.0.1:8090";
const API = "http://localhost:3000";
const FE = "http://localhost:5173";

const zap = async (ruta, params = {}) => {
  const r = await fetch(`${ZAP}${ruta}?${new URLSearchParams(params)}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${ruta}: ${JSON.stringify(d)}`);
  return d;
};
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function hasta(fn, etiqueta) {
  for (;;) {
    const p = await fn();
    process.stdout.write(`\r${etiqueta}: ${p}%   `);
    if (Number(p) >= 100) { console.log(); return; }
    await esperar(5000);
  }
}

(async () => {
  for (;;) { try { console.log("ZAP", (await zap("/JSON/core/view/version/")).version); break; } catch { await esperar(2000); } }

  // Datos y sesión de prueba
  const login = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cred.admin) })).json();
  const token = login.token;
  if (!token) throw new Error("No se obtuvo el JWT de prueba");

  // Todas las peticiones de ZAP llevan el JWT del administrador de prueba
  await zap("/JSON/replacer/action/addRule/", { description: "jwt-admin", enabled: "true", matchType: "REQ_HEADER", matchRegex: "false", matchString: "Authorization", replacement: `Bearer ${token}`, initiators: "" });

  // Limites del escaneo activo
  await zap("/JSON/ascan/action/setOptionMaxScanDurationInMins/", { Integer: "20" });
  await zap("/JSON/ascan/action/setOptionMaxRuleDurationInMins/", { Integer: "3" });
  await zap("/JSON/ascan/action/setOptionThreadPerHost/", { Integer: "4" });

  // ---------- API ----------
  console.log("Importando OpenAPI…");
  await zap("/JSON/openapi/action/importUrl/", { url: `${API}/openapi.json`, hostOverride: "" });
  await zap("/JSON/core/action/accessUrl/", { url: `${API}/`, followRedirects: "false" });
  await zap("/JSON/core/action/accessUrl/", { url: `${API}/health`, followRedirects: "false" });
  const sp = await zap("/JSON/spider/action/scan/", { url: `${API}/api-docs/`, maxChildren: "20" });
  await hasta(async () => (await zap("/JSON/spider/view/status/", { scanId: sp.scan })).status, "Spider API");

  const as = await zap("/JSON/ascan/action/scan/", { url: API, recurse: "true", inScopeOnly: "false" });
  const inicio = Date.now();
  await hasta(async () => (await zap("/JSON/ascan/view/status/", { scanId: as.scan })).status, "Escaneo activo API");
  const duracionApi = Math.round((Date.now() - inicio) / 1000);

  // ---------- Frontend (spider + escaneo pasivo) ----------
  const spf = await zap("/JSON/spider/action/scan/", { url: FE });
  await hasta(async () => (await zap("/JSON/spider/view/status/", { scanId: spf.scan })).status, "Spider frontend");

  for (;;) { const n = Number((await zap("/JSON/pscan/view/recordsToScan/")).recordsToScan); if (!n) break; process.stdout.write(`\rPasivo pendiente: ${n}   `); await esperar(2000); }
  console.log();

  const mensajes = (await zap("/JSON/core/view/numberOfMessages/", { baseurl: API })).numberOfMessages;
  const mensajesFe = (await zap("/JSON/core/view/numberOfMessages/", { baseurl: FE })).numberOfMessages;

  for (const [sitio, nombre] of [[API, "zap-api"], [FE, "zap-frontend"]]) {
    for (const [plantilla, ext] of [["traditional-html", "html"], ["traditional-json", "json"]]) {
      await zap("/JSON/reports/action/generate/", { title: `ParkControl - OWASP ZAP - ${nombre}`, template: plantilla, reportDir: dir, reportFileName: `${nombre}.${ext}`, sites: sitio, display: "false" });
    }
  }
  fs.writeFileSync(`${dir}/zap-meta.json`, JSON.stringify({ fecha: new Date().toISOString(), duracionApiSeg: duracionApi, mensajesApi: mensajes, mensajesFrontend: mensajesFe }, null, 2));
  console.log("Reportes generados", { mensajes, mensajesFe, duracionApi });
})().catch((e) => { console.error(e); process.exitCode = 1; });
