
-- BLOQUE 7.1 - PARKCONTROL
-- Verificacion del esquema y seguridad

-- 1. Comprobar que existen las siete tablas
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'roles',
    'usuarios',
    'conductores',
    'vehiculos',
    'espacios',
    'estancias',
    'pagos'
  )
ORDER BY table_name;

-- 2. Comprobar las claves primarias y foraneas
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'roles',
    'usuarios',
    'conductores',
    'vehiculos',
    'espacios',
    'estancias',
    'pagos'
  )
ORDER BY tc.table_name, tc.constraint_type;

-- 3. Verificar RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_activado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'roles',
    'usuarios',
    'conductores',
    'vehiculos',
    'espacios',
    'estancias',
    'pagos'
  )
ORDER BY tablename;

-- 4. Verificar los roles iniciales de ParkControl
SELECT id, nombre, activo
FROM public.roles
ORDER BY id;

-- 5. Comprobar los permisos directos
SELECT
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'roles',
    'usuarios',
    'conductores',
    'vehiculos',
    'espacios',
    'estancias',
    'pagos'
  )
ORDER BY table_name, grantee;
