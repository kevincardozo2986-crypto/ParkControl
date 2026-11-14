# Pruebas de seguridad — ParkControl

- **Informe:** [Informe_Pruebas_Seguridad_ParkControl.pdf](Informe_Pruebas_Seguridad_ParkControl.pdf) (SCA, SAST, DAST y pruebas de API).
- **Evidencias:** `evidencias/` (salidas de npm audit, Semgrep, reportes HTML/JSON de OWASP ZAP y resultados de API; las capturas van dentro del PDF).
- **Scripts:** `scripts/`

| Script | Uso |
|---|---|
| `pruebas-api.js` | `node scripts/pruebas-api.js <raiz-proyecto> <credenciales.json> <salida.json>` — 72 casos contra `http://localhost:3000` |
| `dast-zap.js` | Con ZAP en modo daemon (`127.0.0.1:8090`, `api.disablekey=true`): `node scripts/dast-zap.js <credenciales.json> <dir-reportes>` |
| `dast-reescaneo.js` | Re-escaneo pasivo de verificación: `node scripts/dast-reescaneo.js <dir-reportes>` |

`credenciales.json` (no versionar) debe contener cuentas **de prueba**:

```json
{
  "admin":      { "email": "admin@parkcontrol.test",      "password": "..." },
  "operador":   { "email": "operador@parkcontrol.test",   "password": "..." },
  "conductor":  { "email": "conductor@parkcontrol.test",  "password": "..." },
  "conductor2": { "email": "conductor2@parkcontrol.test", "password": "..." }
}
```

> **Nota:** `pruebas-api.js` corresponde a la versión con rol `conductor`; los casos de conductor, BOLA y registro público ya no aplican tras la migración `08`.

`pruebas-api.js` crea las cuentas de operador y conductores, cambia contraseñas y desactiva una cuenta: ejecútalo **solo sobre una base de pruebas** recién creada (`01 → 02 → 03 → 04` + `npm run seed:admin`). El último caso activa el bloqueo de login por 15 minutos desde la misma IP.
