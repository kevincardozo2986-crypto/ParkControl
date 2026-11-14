-- SOLO DATOS FICTICIOS para una base nueva o ambiente de pruebas.
-- NO ejecutar en producción sin revisión. No crea cuentas ni contraseñas.
INSERT INTO public.espacios (numero, tipo, estado, ubicacion) VALUES
('C-101', 'carro', 'disponible', 'Sótano 1 - Zona A'),
('C-102', 'carro', 'disponible', 'Sótano 1 - Zona A'),
('C-103', 'carro', 'disponible', 'Sótano 1 - Zona B'),
('M-201', 'moto',  'disponible', 'Primer piso - Zona motos'),
('M-202', 'moto',  'disponible', 'Primer piso - Zona motos')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO public.conductores (nombre, documento, telefono, correo) VALUES
('Conductor Demo Uno', '1000000001', '3000000001', 'demo1@parkcontrol.test'),
('Conductor Demo Dos', '1000000002', '3000000002', 'demo2@parkcontrol.test')
ON CONFLICT (documento) DO NOTHING;

INSERT INTO public.vehiculos (placa, tipo, marca, color, conductor_id)
SELECT 'DEM101', 'carro', 'Demo', 'Gris', id FROM public.conductores WHERE documento = '1000000001'
ON CONFLICT (placa) DO NOTHING;

INSERT INTO public.vehiculos (placa, tipo, marca, color, conductor_id)
SELECT 'DEM20A', 'moto', 'Demo', 'Negro', id FROM public.conductores WHERE documento = '1000000002'
ON CONFLICT (placa) DO NOTHING;
