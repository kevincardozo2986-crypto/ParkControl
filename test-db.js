const { pool } = require("./src/config/database");

async function probarConexion() {
    try {
        const resultado = await pool.query(
        `SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name IN (
                'roles', 'usuarios', 'conductores',
                'vehiculos', 'espacios', 'estancias', 'pagos'
            )
        ORDER BY table_name`,
        );

        console.log("Conexión exitosa a Supabase");
        console.table(resultado.rows);
    } catch (error) {
        console.error("Error de conexión:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

probarConexion();
