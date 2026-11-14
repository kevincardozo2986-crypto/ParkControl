// Re-escaneo de verificación (spider + pasivo) tras corregir hallazgos DAST.
const [dir] = process.argv.slice(2);
const ZAP = "http://127.0.0.1:8090";
const zap = async (ruta, params = {}) => (await fetch(`${ZAP}${ruta}?${new URLSearchParams(params)}`)).json();
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
(async () => {
  await zap("/JSON/core/action/newSession/", { name: "reescaneo", overwrite: "true" });
  for (const u of ["http://localhost:3000/", "http://localhost:3000/health", "http://localhost:3000/api-docs/", "http://localhost:3000/api-docs/swagger-ui-bundle.js", "http://localhost:3000/openapi.json", "http://localhost:4173/"]) {
    await zap("/JSON/core/action/accessUrl/", { url: u, followRedirects: "true" });
  }
  for (const u of ["http://localhost:3000/api-docs/", "http://localhost:4173/"]) {
    const s = await zap("/JSON/spider/action/scan/", { url: u });
    while (Number((await zap("/JSON/spider/view/status/", { scanId: s.scan })).status) < 100) await esperar(2000);
  }
  while (Number((await zap("/JSON/pscan/view/recordsToScan/")).recordsToScan)) await esperar(2000);
  for (const [sitio, nombre] of [["http://localhost:3000", "zap-api-reescaneo"], ["http://localhost:4173", "zap-frontend-reescaneo"]]) {
    for (const [t, ext] of [["traditional-html", "html"], ["traditional-json", "json"]]) {
      await zap("/JSON/reports/action/generate/", { title: `ParkControl - ZAP re-escaneo - ${nombre}`, template: t, reportDir: dir, reportFileName: `${nombre}.${ext}`, sites: sitio, display: "false" });
    }
  }
  console.log("ok");
})();
