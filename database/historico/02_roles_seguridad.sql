
-- BLOQUE 7.1 - PARKCONTROL
-- Roles, permisos y seguridad de la base de datos

-- 1. Activar Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- 2. Evitar acceso directo de clientes anonimos
-- y autenticados de Supabase a las tablas.
REVOKE ALL ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public
FROM anon, authenticated;

-- 3. Evitar que futuros objetos reciban
-- permisos automaticamente.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 4. Las operaciones de ParkControl se realizaran
-- desde el backend Express mediante PostgreSQL.
-- No se crean politicas de acceso publico.

-- 5. Verificar que RLS esta activado
SELECT
    schemaname,
    tablename,
    rowsecurity
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
