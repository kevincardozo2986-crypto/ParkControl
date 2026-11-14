-- Ejecutar solo tras 01_esquema_parkcontrol.sql en una base NUEVA.
-- Idempotente por nombre; no crea cuentas ni contraseñas.
INSERT INTO public.roles (nombre, descripcion, activo) VALUES
('administrador', 'Gestiona usuarios, conductores, vehículos, espacios, estancias y pagos', TRUE),
('operador',      'Registra entradas, salidas y pagos en la portería del parqueadero', TRUE)
ON CONFLICT (nombre) DO NOTHING;
