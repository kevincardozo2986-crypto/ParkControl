-- SOLO LECTURA: verificar esquema, índices, políticas, roles y usuario de conexión.
-- Seguro para ejecutar sobre una base existente.

-- 1. Tablas y RLS (deben aparecer 9 con rowsecurity = true)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Políticas RLS (se espera 0 filas: acceso directo denegado)
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Definición exacta de índices (comparar indexdef antes de crear nuevos)
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Claves foráneas
SELECT tc.table_name, kcu.column_name,
       ccu.table_name AS tabla_referenciada, ccu.column_name AS columna_referenciada
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Usuario de conexión y si omite RLS
SELECT current_user, session_user,
       current_setting('row_security') AS row_security,
       (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypassrls;

-- 6. Roles y permisos directos de anon/authenticated (se esperan 0 filas)
SELECT id, nombre, activo FROM public.roles ORDER BY id;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 7. Conteos
SELECT 'roles' AS tabla, count(*) FROM public.roles UNION ALL
SELECT 'usuarios', count(*) FROM public.usuarios UNION ALL
SELECT 'conductores', count(*) FROM public.conductores UNION ALL
SELECT 'vehiculos', count(*) FROM public.vehiculos UNION ALL
SELECT 'espacios', count(*) FROM public.espacios UNION ALL
SELECT 'estancias', count(*) FROM public.estancias UNION ALL
SELECT 'pagos', count(*) FROM public.pagos;
