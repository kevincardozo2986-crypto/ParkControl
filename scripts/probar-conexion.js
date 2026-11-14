// Diagnóstico de conexión PostgreSQL (Supabase) para ParkControl.
// Uso: node scripts/probar-conexion.js
const { pool, consultar } = require("../src/config/database");

async function probarConexion() {
  try {
    console.log("Conectando con Supabase...");

    const seguridad = await consultar(`
      SELECT current_user AS usuario,
             session_user AS sesion,
             current_setting('row_security') AS rls_configuracion,
             rolbypassrls AS puede_omitir_rls
      FROM pg_roles
      WHERE rolname = current_user
    `);
    console.log("Seguridad PostgreSQL:");
    console.table(seguridad.rows);

    const tablas = await consultar(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log("Tablas del esquema public:");
    console.table(tablas.rows);

    const roles = await consultar(
      "SELECT id, nombre, activo FROM public.roles ORDER BY id",
    );
    console.log("Roles registrados:");
    console.table(roles.rows);

    const ssl = await consultar(
      "SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid()",
    );
    console.log("TLS de la conexión:");
    console.table(ssl.rows);

    console.log("Conexión PostgreSQL exitosa");
  } catch (error) {
    console.error("Error de conexión:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarConexion();
