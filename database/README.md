# ParkControl — Base de datos PostgreSQL (Supabase)

**Motor:** PostgreSQL · **Plataforma:** Supabase · **Esquema:** `public`

La aplicación usa una arquitectura desacoplada:

**React + Vite → API REST Node.js/Express → PostgreSQL (Supabase)**

El frontend **nunca** se conecta directamente a PostgreSQL. Todas las operaciones pasan por el backend, que aplica autenticación JWT y autorización RBAC (administrador y operador).

## 1. Estructura de archivos

```text
database/
├── 01_esquema_parkcontrol.sql          # Esquema consolidado (base NUEVA)
├── 02_seed_roles.sql                   # Roles administrador / operador
├── 03_seed_catalogos_demo_OPCIONAL.sql # Espacios, conductores y vehículos ficticios
├── 04_seguridad_rls.sql                # RLS + REVOKE a anon/authenticated
├── 05_verificacion_lectura.sql         # Solo lectura: diagnóstico
├── 06_indices_adicionales_OPCIONAL.sql # Índices de apoyo (revisar antes)
├── 07_migracion_base_existente.sql     # Actualiza la base del Bloque 7
├── 08_quitar_rol_conductor.sql         # Retira el rol conductor (solo personal)
├── historico/                          # Scripts originales del Bloque 7.1
└── README.md
```

`historico/` conserva los scripts de laboratorios anteriores para trazabilidad; no forman parte de la instalación consolidada.

## 2. Modelo de datos (9 tablas)

| Tabla | Función | Relaciones principales |
|---|---|---|
| `roles` | Perfiles de acceso | `usuarios.rol_id → roles.id` |
| `usuarios` | Cuentas, hash de contraseña, estado y `version_sesion` | — |
| `conductores` | Fichas de los propietarios de vehículos (sin cuenta de acceso) | Referenciada por `vehiculos` |
| `vehiculos` | Vehículos y placa | `conductor_id → conductores.id` |
| `espacios` | Celdas del parqueadero y su estado | Referenciada por `estancias` |
| `estancias` | Entrada/salida y tiempo de permanencia | FK a `vehiculos` y `espacios` |
| `pagos` | Pago de una estancia finalizada | `estancia_id → estancias.id` (único) |
| `password_reset_tokens` | Recuperación administrativa (token de un solo uso, 15 min) | FK a usuario y administrador |
| `codigos_recuperacion` | Códigos de respaldo de un solo uso | FK a usuario |

Las tablas de recuperación guardan **hashes SHA-256**, nunca tokens ni códigos en texto plano.

### Reglas de integridad relevantes

- `estado` de estancia: `activa → finalizada`; un CHECK obliga a que una estancia finalizada tenga fecha de salida y tiempo.
- Índices únicos parciales `idx_estancia_vehiculo_activo` e `idx_estancia_espacio_activo`: un vehículo no puede tener dos estancias activas y un espacio no puede ocuparse dos veces.
- `pagos.estancia_id` es `UNIQUE`: una estancia solo se paga una vez, incluso ante solicitudes simultáneas.

## 3. Roles

| Rol | Permisos (aplicados en el backend) |
|---|---|
| `administrador` | Gestiona usuarios, conductores, vehículos, espacios, estancias, pagos y recuperación administrativa. |
| `operador` | Consulta el parqueadero y registra entradas, salidas y pagos. |

El sistema lo usan solo administradores y operadores. No hay registro público: las cuentas las crea un administrador.

## 4. Instalación en una base de datos NUEVA

1. En Supabase abrir **SQL Editor**.
2. Ejecutar `01_esquema_parkcontrol.sql`.
3. Ejecutar `02_seed_roles.sql`.
4. Opcional: `03_seed_catalogos_demo_OPCIONAL.sql`.
5. Revisar y ejecutar `04_seguridad_rls.sql`.
6. Ejecutar `05_verificacion_lectura.sql` y guardar capturas.
7. Configurar `.env` del backend y crear el administrador con `npm run seed:admin`.

```text
01 → 02 → 03 (opcional) → 04 (revisado) → 05 → npm run seed:admin
```

## 5. Base de datos EXISTENTE (la del Bloque 7)

Si ya tienes las 7 tablas originales en Supabase, **no** reconstruyas la base:

| Archivo | Acción |
|---|---|
| `01`, `02`, `03` | No ejecutar |
| `07_migracion_base_existente.sql` | **Ejecutar una vez** |
| `08_quitar_rol_conductor.sql` | **Ejecutar una vez, después de 07** |
| `04_seguridad_rls.sql` | Ejecutar tras revisar (cubre las 2 tablas nuevas) |
| `05_verificacion_lectura.sql` | Ejecutar para diagnóstico |
| `06_indices_adicionales_OPCIONAL.sql` | Opcional |

La migración `07` agrega `version_sesion`, las tablas de recuperación y el rol `operador`. La `08` retira el rol `conductor`: desactiva sus cuentas (sin borrarlas, para conservar el historial), revoca sus sesiones y elimina el vínculo `conductores.usuario_id`.

> Reemplazar archivos SQL en VS Code **no** modifica Supabase. La base solo cambia cuando ejecutas los scripts en el SQL Editor.

## 6. RLS y Data API

`04_seguridad_rls.sql` activa RLS en las 9 tablas sin crear políticas y revoca los privilegios de `anon` y `authenticated`, de modo que la Data API de Supabase no expone datos con la clave pública.

**Importante:** el backend se conecta con un rol (p. ej. `postgres`) que puede tener `BYPASSRLS`. Compruébalo con la consulta 5 de `05_verificacion_lectura.sql`. En ese caso RLS no filtra las consultas del backend y la protección depende de JWT + RBAC en Express.

## 7. Índices

Las restricciones `PRIMARY KEY` y `UNIQUE` crean índices automáticamente. No recrear índices a ciegas: ejecutar la consulta 3 de `05_verificacion_lectura.sql` y comparar `indexdef` antes de aplicar `06`.
