# ParkControl — Estrategia de pruebas de seguridad

| Técnica | Herramienta | Propósito |
|---|---|---|
| SCA | `npm audit` | Identificar dependencias vulnerables |
| SAST | Semgrep | Analizar vulnerabilidades potenciales en el código |
| DAST | OWASP ZAP | Evaluar la aplicación mediante solicitudes HTTP |
| Pruebas de API | Swagger UI | Verificar autenticación, autorización y validaciones |

Registrar cada ejecución con **fecha, herramienta/rol, entrada, respuesta HTTP y evidencia (captura)**. No incluir contraseñas, JWT, API Keys ni cadenas de conexión en las capturas.

---

## 1. SCA — `npm audit`

```powershell
# Backend (dependencias de producción)
npm audit --omit=dev

# Frontend
cd frontend
npm audit
```

**Resultado de la integración (2026-11-11):**

| Proyecto | Antes | Acción | Después |
|---|---|---|---|
| Backend | 6 (1 alta `body-parser` DoS; 5 moderadas `fast-uri`, `glob`, `minimatch`, `qs`) | `npm audit fix` (sin cambios mayores) | **0** |
| Frontend | 0 | — | **0** |

Criterio de aceptación: 0 vulnerabilidades altas o críticas. Repetir antes de cada entrega.

## 2. SAST — Semgrep

```powershell
semgrep scan --metrics=off --config p/javascript --config p/nodejs --config p/react `
  --exclude node_modules --exclude dist src scripts frontend/src
```

**Resultado (2026-11-11):** 68 reglas sobre 88 archivos, **1 hallazgo**:

| Regla | Archivo | Severidad | Análisis |
|---|---|---|---|
| `bypass-tls-verification` | `src/config/database.js` | WARNING | Rama de respaldo `rejectUnauthorized: false` cuando **no** existe `certs/prod-ca-2021.crt`. La conexión sigue cifrada pero sin verificar el servidor. **Mitigación:** descargar el CA de Supabase en `certs/`; con el archivo presente se usa `rejectUnauthorized: true` y esta rama no se ejecuta. |

Revisiones manuales complementarias:

- Todas las consultas SQL son parametrizadas (`$1, $2…`); los únicos fragmentos interpolados son listas de columnas constantes y el `LIMIT` fijo.
- Contraseñas con bcrypt (12 rondas); tokens y códigos de recuperación guardados como SHA-256.
- El rol del JWT no se usa para autorizar: se consulta el rol vigente en PostgreSQL.

## 3. DAST — OWASP ZAP

1. Levantar backend (`npm run dev`) y frontend (`cd frontend && npm run dev`).
2. **Escaneo de la API** con la especificación OpenAPI:
   - ZAP → *Import → Import an OpenAPI definition from a URL* → `http://localhost:3000/openapi.json`.
   - Para rutas protegidas: iniciar sesión en Swagger, copiar el JWT y configurar en ZAP *Replacer* una cabecera `Authorization: Bearer <token>` (usar una cuenta de **prueba**).
   - Ejecutar *Active Scan* sobre `http://localhost:3000/api`.
3. **Escaneo del frontend:** *Automated Scan* sobre `http://localhost:5173` (spider + AJAX spider).
4. Exportar el reporte HTML (*Report → Generate Report*) y adjuntarlo como evidencia.

Hallazgos esperados y su tratamiento:

| Posible alerta | Estado esperado |
|---|---|
| Cabeceras de seguridad ausentes | Mitigado en la API por Helmet (`X-Content-Type-Options`, `Strict-Transport-Security`, etc.). |
| `X-Powered-By` | Deshabilitado (`app.disable("x-powered-by")`). |
| CORS permisivo | Solo orígenes de `ALLOWED_ORIGIN`. |
| CSP en la API | Desactivada a propósito para que funcione Swagger UI (`contentSecurityPolicy: false`); documentar como riesgo aceptado en desarrollo. |
| Cabeceras en el servidor de Vite | El servidor de desarrollo no es producción; en despliegue servir `dist/` con cabeceras de seguridad. |

## 4. Pruebas de API — Swagger UI

`http://localhost:3000/api-docs` → **Authorize** → `BearerAuth` (pegar solo el token). Para `/api/auth/registro` y `/api/seguridad/cliente` usar `ApiKeyAuth`.

Crear tres cuentas de prueba (administrador por `npm run seed:admin`; operador y conductor desde *Usuarios y roles*) y vincular la cuenta conductor a una ficha en *Conductores → Cuenta*.

| # | Rol | Petición | Esperado | Obtenido | Evidencia |
|---|---|---|---|---|---|
| 1 | — | `POST /api/auth/login` correcto | 200 + token | | |
| 2 | — | `POST /api/auth/login` clave errada | 401 (429 tras 10) | | |
| 3 | — | `GET /api/estancias` sin token | 401 | | |
| 4 | — | `GET /api/estancias` con JWT alterado | 401 Token inválido | | |
| 5 | conductor | `GET /api/vehiculos/mis-vehiculos` | 200, solo propios | | |
| 6 | conductor | `GET /api/vehiculos/{id ajeno}` | 403 | | |
| 7 | conductor | `GET /api/pagos/{id ajeno}` | 403 | | |
| 8 | conductor | `GET /api/vehiculos` (listado global) | 403 | | |
| 9 | conductor | `POST /api/estancias/entrada` | 403 | | |
| 10 | operador | `POST /api/estancias/entrada` espacio libre compatible | 201 | | |
| 11 | operador | Entrada en espacio ocupado / tipo distinto | 409 | | |
| 12 | operador | `PATCH /api/estancias/{id}/salida` | 200 | | |
| 13 | operador | `POST /api/pagos` estancia finalizada | 201 | | |
| 14 | operador | `POST /api/pagos` misma estancia | 409 | | |
| 15 | operador | `POST /api/usuarios` | 403 | | |
| 16 | admin | `GET /api/estadisticas/resumen` | 200 | | |
| 17 | admin | `PATCH /api/usuarios/{propio}/estado` `{activo:false}` | 409 | | |
| 18 | admin | `PATCH /api/conductores/{id}/cuenta` con cuenta de otro rol | 400 | | |
| 19 | cualquiera | `PATCH /api/auth/cambiar-password` y reutilizar token viejo | 200, luego 401 Sesión revocada | | |
| 20 | — | `POST /api/auth/restablecer-con-codigo` con código ya usado | 400 | | |
| 21 | — | `POST /api/vehiculos` con `placa: "A"` | 400 VALIDATION_ERROR | | |
| 22 | — | Origen no permitido (`Origin: http://evil.test`) | 403 CORS | | |

### Verificación automatizada realizada en la integración (2026-11-11)

| Verificación | Resultado |
|---|---|
| Arranque de la API, `/health`, Swagger (36 rutas documentadas) | OK |
| `GET /api/estancias` sin token | 401 |
| `GET /api/seguridad/cliente` sin API Key | 401 |
| Login con correo inválido | 400 VALIDATION_ERROR |
| CORS preflight desde `localhost:5173` permite `Authorization` | OK |
| Middleware BOLA aislado (7 casos: admin, operador, propio, **ajeno → 403**, sin ficha → 403, inexistente → 404, sin sesión → 401) | 7/7 OK |
| Frontend `npm run lint` / `npm run build` | 0 advertencias / OK |
| UI por rol (admin, operador, conductor) contra API simulada | Menús, módulos y bloqueo de rutas de otro rol OK |

Pendiente: la tabla de 22 casos contra Supabase real (la base no respondía durante la integración: error del pooler `tenant/user not found`).

---

## Ejecución completa

> **Nota:** el informe se ejecutó cuando el sistema tenía tres roles (incluido `conductor`). Desde la migración `08` el sistema solo tiene administrador y operador, por lo que los casos BOLA/IDOR del conductor y el registro público ya no aplican.

La ejecución de las cuatro técnicas con resultados, correcciones y evidencias está en [pruebas/Informe_Pruebas_Seguridad_ParkControl.pdf](pruebas/Informe_Pruebas_Seguridad_ParkControl.pdf) (72/72 casos de API, SCA 0 en producción, SAST 1 hallazgo, DAST sin alertas altas abiertas).
