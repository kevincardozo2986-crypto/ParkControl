-- ========================================
-- PARKCONTROL - Retiro del rol conductor
-- ========================================
-- El sistema lo usan solo administradores y operadores.
-- Los conductores siguen existiendo como FICHAS (con sus vehículos,
-- estancias y pagos), pero ya no tienen cuenta de acceso.
--
-- Ejecutar UNA vez sobre la base que ya aplicó 07_migracion_base_existente.sql.
-- Es idempotente. No borra cuentas: las de rol conductor quedan inactivas
-- (sus sesiones se revocan) para conservar el historial.
-- ========================================

BEGIN;

-- 1. Desactivar cuentas con rol conductor y revocar sus JWT
UPDATE public.usuarios
SET activo = FALSE,
    version_sesion = version_sesion + 1
WHERE activo = TRUE
  AND rol_id = (SELECT id FROM public.roles WHERE nombre = 'conductor');

-- 2. Desactivar el rol (no se elimina porque las cuentas lo referencian)
UPDATE public.roles SET activo = FALSE WHERE nombre = 'conductor';

-- 3. Quitar el vínculo ficha de conductor -> cuenta
ALTER TABLE public.conductores DROP CONSTRAINT IF EXISTS conductores_usuario_id_fkey;
ALTER TABLE public.conductores DROP CONSTRAINT IF EXISTS conductores_usuario_id_key;
ALTER TABLE public.conductores DROP COLUMN IF EXISTS usuario_id;

COMMIT;

-- Comprobación
SELECT r.nombre AS rol, r.activo,
       COUNT(u.id) FILTER (WHERE u.activo) AS cuentas_activas,
       COUNT(u.id) AS cuentas_totales
FROM public.roles r
LEFT JOIN public.usuarios u ON u.rol_id = r.id
GROUP BY r.nombre, r.activo
ORDER BY r.nombre;
