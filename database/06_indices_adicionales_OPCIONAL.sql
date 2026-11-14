-- OPCIONAL: índices de apoyo para consultas frecuentes del dashboard y del portal.
-- Antes de ejecutar, revisar 05_verificacion_lectura.sql (consulta 3) para evitar
-- duplicados. Los índices UNIQUE (placa, documento, numero, email) ya existen por
-- restricción y los índices parciales de estancias activas ya impiden doble ocupación.

-- Consulta de inspección
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('estancias', 'pagos')
ORDER BY tablename, indexname;

-- Listados ordenados por fecha (dashboard, historial)
CREATE INDEX IF NOT EXISTS idx_estancias_fecha_entrada
ON public.estancias (fecha_hora_entrada DESC);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha
ON public.pagos (fecha_pago DESC);

-- Filtro por estado
CREATE INDEX IF NOT EXISTS idx_estancias_estado
ON public.estancias (estado);
