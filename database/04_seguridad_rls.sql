-- Habilita RLS en las 9 tablas de ParkControl y retira el acceso directo
-- de los roles de Supabase (anon, authenticated) a tablas y secuencias.
-- No crea políticas: el acceso directo queda denegado por defecto.
-- IMPORTANTE: un rol con BYPASSRLS (p. ej. postgres) omite RLS; en ese caso
-- la protección depende de JWT + RBAC + BOLA implementados en Express.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'roles','usuarios','conductores','vehiculos','espacios',
    'estancias','pagos','password_reset_tokens','codigos_recuperacion'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
  END LOOP;
END $$;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM anon, authenticated;
