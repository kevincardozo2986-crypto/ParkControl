const r = require("express").Router();

const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");
const { query } = require("../config/database");

/**
 * @openapi
 * /api/estadisticas/resumen:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Indicadores del parqueadero para el dashboard
 *     description: "Roles: administrador, operador"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200': { description: Totales agregados }
 *       '401': { description: No autenticado }
 *       '403': { description: Rol no autorizado }
 */
r.get(
  "/resumen",
  autenticarJWT,
  autorizarRoles("administrador", "operador"),
  async (req, res) => {
    const resultado = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM public.usuarios) AS usuarios,
        (SELECT COUNT(*)::int FROM public.conductores) AS conductores,
        (SELECT COUNT(*)::int FROM public.vehiculos) AS vehiculos,
        (SELECT COUNT(*)::int FROM public.espacios) AS espacios,
        (SELECT COUNT(*)::int FROM public.espacios WHERE estado = 'disponible') AS "espaciosDisponibles",
        (SELECT COUNT(*)::int FROM public.estancias WHERE estado = 'activa') AS "estanciasActivas",
        (SELECT COUNT(*)::int FROM public.estancias) AS estancias,
        (SELECT COUNT(*)::int FROM public.pagos) AS pagos,
        (SELECT COALESCE(SUM(valor), 0)::float FROM public.pagos) AS ingresos,
        (SELECT COALESCE(SUM(valor), 0)::float FROM public.pagos
          WHERE fecha_pago >= date_trunc('day', NOW())) AS "ingresosHoy"
    `);

    const porMes = await query(`
      SELECT to_char(date_trunc('month', fecha_pago), 'YYYY-MM') AS mes,
             COUNT(*)::int AS pagos,
             SUM(valor)::float AS total
      FROM public.pagos
      WHERE fecha_pago >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
      ORDER BY 1
    `);

    res.set("Cache-Control", "no-store");
    return res.json({ resumen: resultado.rows[0], ingresosPorMes: porMes.rows });
  },
);

module.exports = r;
