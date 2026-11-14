# ParkControl Segura — React + Vite, Express y Supabase/PostgreSQL

**Guía de cierre** (adaptación de la guía "API Hospital Segura" al dominio de parqueadero)

## 1. Objetivo y arquitectura

ParkControl es una aplicación web cliente-servidor desacoplada para gestionar conductores, vehículos, espacios, estancias (entrada/salida) y pagos de un parqueadero.

- **Frontend:** SPA en **React 19 + Vite 8 + React Router 7 + Bootstrap 5.3** (carpeta `frontend/`).
- **Backend:** API REST con **Node.js + Express 5 (CommonJS)** y PostgreSQL administrado en **Supabase**.
- **Seguridad:** JWT para autenticación y **RBAC** con dos roles (administrador y operador). Swagger/OpenAPI documenta los endpoints.
- **Usuarios del sistema:** solo el personal del parqueadero. Los conductores son **fichas** (propietarios de vehículos) sin cuenta de acceso.

```text
Navegador → React/Vite (localhost:5173)
          → fetch / HTTP JSON + JWT (Authorization: Bearer)
          → Express (localhost:3000)
          → rutas → middlewares (JWT → RBAC → validación) → controladores → servicios
          → pg.Pool + TLS → PostgreSQL (Supabase)
```

| Rol | Equivalente en el insumo | Puede |
|---|---|---|
| `administrador` | administrador | Todo: usuarios, conductores, vehículos, espacios, estancias, pagos, recuperación administrativa |
| `operador` | médico | Consultar el parqueadero y registrar entradas, salidas y pagos |

## 2. Requisitos previos

- Node.js `^20.19.0 || >=22.12.0` (exigido por Vite 8) y npm. Verificar con `node --version`.
- VS Code, PowerShell, navegador, Postman (opcional) y un proyecto Supabase.
- Certificado CA de Supabase en `certs/prod-ca-2021.crt` (ver `certs/README.md`).
- Los secretos viven en `.env` locales: **no** subir `.env` a GitHub ni poner contraseñas o API Keys en el frontend.

## 3. Estructura del repositorio

```text
ParkControl_API/
├── certs/                 # CA de Supabase (prod-ca-2021.crt)
├── database/              # SQL 01–07 + README (ver database/README.md)
├── docs/                  # Estrategia y evidencias de pruebas
├── frontend/              # SPA React + Vite
├── scripts/               # probar-conexion.js
├── src/                   # API Express
├── .env.example
└── package.json
```

## 4. Backend

### 4.1 Instalación

```powershell
npm ci
copy .env.example .env      # completar valores reales
npm run db:test             # diagnóstico de conexión, TLS y RLS
npm run seed:admin          # SOLO la primera vez: crea el administrador inicial
npm run dev
```

`npm run seed:admin` ejecuta `src/scripts/crearAdmin.js` y requiere `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` (≥ 12 caracteres). Nunca modifica un administrador existente ni eleva otra cuenta. El servidor **ya no crea usuarios al arrancar**.

### 4.2 Estructura del backend

| Ruta | Función |
|---|---|
| `src/app.js` | Express, Helmet, CORS, JSON 10 KB, rate limiting, Swagger, separación clientes web (JWT) / privados (API Key) y montaje de rutas. |
| `src/config/database.js` | Pool `pg` (`max: 5`) con `DATABASE_URL` o `DB_*`; TLS con CA y `rejectUnauthorized: true` si existe `certs/prod-ca-2021.crt`. |
| `src/routes/` | Endpoints y cadena JWT → RBAC → validación. |
| `src/controllers/` | Interpretan la petición y construyen la respuesta HTTP. |
| `src/services/` | Consultas SQL parametrizadas y reglas de negocio. |
| `src/middlewares/auth.middleware.js` | Verifica el JWT, consulta la cuenta en PostgreSQL, rechaza cuentas inactivas y tokens con `version_sesion` anterior. |
| `src/middlewares/roles.middleware.js` | RBAC según el rol **vigente en la base**. |
| `src/middlewares/*.validator.js` | Validación de parámetros y cuerpos (`express-validator` + `matchedData`). |
| `src/middlewares/apiKey.middleware.js` | API Key para integraciones privadas (Postman, móvil, `/api/seguridad`). |
| `src/middlewares/errores.middleware.js` | Errores centralizados; `503` si la base no está disponible. |
| `src/docs/swagger.js` | Especificación OpenAPI. |
| `src/utils/jwt.util.js` | Emisión/verificación HS256 con `sub`, `rol`, `vs` (versión de sesión). |
| `src/utils/password.util.js` | bcrypt (12 rondas). |
| `src/services/passwordReset.service.js` | Token administrativo de un solo uso (hash SHA-256, 15 min). |
| `src/services/codigosRecuperacion.service.js` | 8 códigos de respaldo de un solo uso (hash SHA-256). |
| `src/scripts/crearAdmin.js` | Bootstrap controlado del primer administrador. |
| `scripts/probar-conexion.js` | Diagnóstico: usuario, BYPASSRLS, tablas, roles y TLS. |

### 4.3 Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` **o** `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD/DB_SSL` | Conexión a Supabase (pooler, puerto 6543). |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del JWT (p. ej. `1h`). |
| `ALLOWED_ORIGIN` | Orígenes CORS separados por coma. Debe incluir `http://localhost:5173`. |
| `API_KEY_POSTMAN`, `API_KEY_ADMIN`, `API_KEY_MOVIL` | Clientes privados. **Nunca** en el navegador. |
| `TARIFA_POR_HORA` | Valor por hora para calcular el pago (por defecto 3000). |
| `ADMIN_*` | Solo para `npm run seed:admin`. |
| `PORT` | Puerto de la API (3000). |

## 5. Frontend

### 5.1 Instalación

```powershell
cd frontend
npm ci
copy .env.example .env
npm run dev
```

El proyecto se creó con `npm create vite@latest frontend -- --template react` y `npm install react-router-dom bootstrap`.

```dotenv
VITE_API_URL=http://localhost:3000
```

`import.meta.env.VITE_*` queda expuesto en el navegador: **nunca** colocar ahí `DATABASE_URL`, `JWT_SECRET`, contraseñas ni API Keys.

### 5.2 Anatomía del frontend

| Ruta | Responsabilidad |
|---|---|
| `index.html` | Documento raíz con el nodo de montaje. |
| `src/main.jsx` | Punto de entrada; importa Bootstrap y estilos. |
| `src/App.jsx` | Rutas públicas (login, recuperación) y protegidas. |
| `src/App.css`, `src/index.css` | Layout, tarjetas, mapa de espacios. |
| `src/context/AuthContext.jsx` | Sesión en `sessionStorage`, expiración JWT, revalidación con `/api/auth/perfil`. |
| `src/hooks/useAuth.js` | Acceso al contexto de autenticación. |
| `src/hooks/useRecursos.js` | Carga en paralelo de varias consultas con cancelación. |
| `src/hooks/useDashboardData.js` | Fuentes del dashboard según el rol. |
| `src/services/http.js` | Cliente HTTP único: `Authorization: Bearer`, manejo de 401/429/503. |
| `src/services/api.js` | Login (`POST /api/auth/login`). |
| `src/services/*.service.js` | Funciones HTTP por recurso. |
| `src/services/sesion-expirada.js` | Evento de fin de sesión ante 401. |
| `src/pages/modulos.js` | Catálogo de módulos por rol. |
| `src/components/RutaProtegida.jsx` | Restringe navegación; **no sustituye** la validación del backend. |

### 5.3 Componentes de negocio

| Componente | Función | Roles |
|---|---|---|
| `ResumenParqueadero.jsx` | KPIs, ocupación por tipo, ingresos por mes, vehículos dentro | todos (datos según rol) |
| `GestionUsuarios.jsx` | Cuentas y roles, activar/desactivar | administrador |
| `GestionConductores.jsx` | Fichas de los propietarios de vehículos | administrador (operador: lectura) |
| `GestionVehiculos.jsx` | Placas y propietario | administrador (operador: lectura) |
| `GestionEspacios.jsx` | Celdas en mapa o tabla | administrador (operador: lectura) |
| `MapaEspacios.jsx` | Mapa interactivo de ocupación (equivale a la agenda del insumo) | — |
| `GestionEstancias.jsx` | Entrada (vehículo + espacio compatible en el mapa) y salida | administrador, operador |
| `GestionPagos.jsx` | Cobro de estancias finalizadas; el valor lo calcula el backend | administrador, operador |
| `PerfilPropio.jsx` | Cuenta autenticada y ficha vinculada | todos |
| `CodigosRecuperacion.jsx` | Generar/regenerar 8 códigos | todos |
| `RecuperacionAdministrativa.jsx` | Token temporal para un titular verificado | administrador |
| `CambiarPassword.jsx` | Cambio de contraseña (revoca JWT) | todos |

## 6. Autenticación y control de acceso

1. El usuario envía credenciales a `POST /api/auth/login` (limitado a 10 intentos fallidos / 15 min).
2. El backend valida con bcrypt y emite un JWT HS256 con `sub`, `rol` y `vs` (versión de sesión).
3. React guarda la sesión en `sessionStorage` y envía `Authorization: Bearer <token>`.
4. En cada petición el backend consulta la cuenta, verifica que esté activa, que `vs` coincida con `version_sesion` y usa el **rol vigente** en PostgreSQL.
5. RBAC filtra la ruta según el rol (administrador u operador).
6. Al expirar o revocarse el token (cambio de contraseña, desactivación) la API responde `401` y el frontend cierra la sesión.

**Clientes web vs. privados:** las rutas de recursos y de cuenta propia usan solo JWT. `/api/seguridad/*` y otras integraciones exigen `X-API-Key`. No hay registro público: solo un administrador crea cuentas. El navegador nunca contiene una API Key.


**Estados de estancia:** `activa → finalizada`. La entrada bloquea el espacio (`FOR UPDATE`) en una transacción; índices únicos parciales impiden dos estancias activas por vehículo o por espacio. El pago es único por estancia (`UNIQUE`) y el valor = horas × `TARIFA_POR_HORA`.

## 7. Base de datos

9 tablas en `public`: `roles`, `usuarios`, `conductores`, `vehiculos`, `espacios`, `estancias`, `pagos`, `password_reset_tokens`, `codigos_recuperacion`. Las tablas de recuperación guardan **hashes**, no tokens ni códigos en texto plano.

- **Base nueva:** `01 → 02 → 03 (opcional) → 04 → 05 → npm run seed:admin`.
- **Base existente del Bloque 7:** ejecutar **`07_migracion_base_existente.sql`** y luego **`08_quitar_rol_conductor.sql`**, una vez cada uno; después `04` y `05`.

Detalle completo, RLS y advertencia sobre `BYPASSRLS` en [database/README.md](database/README.md).

## 8. Pruebas finales sugeridas

| Prueba | Resultado esperado |
|---|---|
| Login correcto | `200`, JWT y usuario |
| Login con contraseña incorrecta | `401`; tras 10 fallos, `429` |
| Crear una cuenta con rol `conductor` | `400` (solo administrador u operador) |
| Operador registra entrada y salida | `201` / `200` |
| Operador intenta crear un usuario | `403` |
| Entrada en espacio ocupado o incompatible | `409` |
| Segundo pago de la misma estancia | `409` |
| Administrador consulta `/api/estadisticas/resumen` | `200` con indicadores |
| JWT expirado, alterado o revocado | `401` y cierre de sesión en el frontend |
| Cambiar contraseña | Revoca tokens anteriores (`version_sesion`) |
| Código de recuperación usado | No puede reutilizarse (`400`) |
| `npm run lint` y `npm run build` en `frontend/` | Sin errores |

Estrategia SCA / SAST / DAST / API y resultados: [docs/ESTRATEGIA_PRUEBAS.md](docs/ESTRATEGIA_PRUEBAS.md).

## 9. Comandos de verificación

**Terminal 1 — backend:**

```powershell
npm ci
npm run db:test
npm run dev
```

**Terminal 2 — frontend:**

```powershell
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

Accesos locales: frontend `http://localhost:5173` · API `http://localhost:3000` · Swagger `http://localhost:3000/api-docs` · OpenAPI `http://localhost:3000/openapi.json` · Health `http://localhost:3000/health`.

## 10. Alcance y cierre

Frontend SPA, backend REST, persistencia relacional, autenticación JWT con revocación, RBAC de dos roles (administrador y operador), estancias con mapa interactivo, pagos, recuperación (administrativa y por códigos) y dashboard. Documentar cada prueba con fecha, rol, entrada, respuesta HTTP y evidencia.
