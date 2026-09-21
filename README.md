# ParkControl API v2

API REST segura para administrar conductores, vehículos, espacios, estancias y pagos de un parqueadero.

## Mejoras principales
- Autenticación por `X-API-Key` para todas las rutas `/api`.
- Swagger con botón **Authorize** y esquema `ApiKeyAuth`.
- Helmet, CORS por allowlist, rate limiting, límite JSON de 10 KB y ocultamiento de `X-Powered-By`.
- Validación y allowlist de datos con `express-validator` + `matchedData`.
- `X-Request-Id` para trazabilidad de solicitudes.
- Validación obligatoria de configuración al iniciar.
- Integridad referencial con `409 Conflict`.
- Reglas de negocio: placa/documento/espacio únicos, compatibilidad vehículo-espacio, una estancia activa por vehículo, un vehículo por espacio, salida única y pago único.
- Endpoint público `/health`.

## Instalación
```bash
npm install
cp .env.example .env
npm run dev
```
En Windows puedes copiar `.env.example` como `.env` manualmente. Cambia `API_KEY` antes de usar la API.

- API: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Autenticación
Envía en cada endpoint `/api`:
```http
X-API-Key: valor-de-API_KEY
```
Sin clave o con clave incorrecta se responde `401`.

## Flujo funcional recomendado
1. Crear conductor: `POST /api/conductores`
2. Crear vehículo: `POST /api/vehiculos`
3. Consultar espacio: `GET /api/espacios/disponibles`
4. Registrar entrada: `POST /api/estancias/entrada`
5. Registrar salida: `PATCH /api/estancias/:id/salida`
6. Registrar pago: `POST /api/pagos`

## Integridad referencial
- No se elimina un conductor con vehículos asociados (`409`).
- No se elimina un vehículo con estancias asociadas (`409`).
- No se elimina un espacio con estancias asociadas (`409`).

## Seguridad estática
```bash
npm audit
npx semgrep scan --config auto src
```

> El proyecto académico conserva almacenamiento en memoria. Para producción se recomienda PostgreSQL, autenticación por usuarios/roles, HTTPS detrás de proxy y gestión de secretos.
