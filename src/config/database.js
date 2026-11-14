require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

// ========================================
// Certificado CA de Supabase (opcional)
// ========================================
// Descargar desde Supabase: Project Settings > Database > SSL Configuration
// y guardar como certs/prod-ca-2021.crt
const rutaCertificado = path.resolve(
  __dirname,
  "../../certs/prod-ca-2021.crt",
);

const configurarSsl = () => {
  if (fs.existsSync(rutaCertificado)) {
    return {
      ca: fs.readFileSync(rutaCertificado, "utf8"),
      rejectUnauthorized: true,
    };
  }

  if (process.env.DB_SSL === "true" || process.env.DATABASE_URL) {
    console.warn(
      "[database] Sin certs/prod-ca-2021.crt: TLS activo pero sin verificar " +
        "el certificado del servidor. Agregue el CA de Supabase.",
    );
    return { rejectUnauthorized: false };
  }

  return false;
};

// ========================================
// Conexión: DATABASE_URL o variables DB_*
// ========================================
const conexion = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 6543),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error("Configure DATABASE_URL o DB_HOST en el archivo .env");
}

const pool = new Pool({
  ...conexion,
  ssl: configurarSsl(),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Error en conexión PostgreSQL inactiva:", error.message);
});

// Consultas parametrizadas
const query = (text, params = []) => pool.query(text, params);

const cerrarPool = () => pool.end();

module.exports = {
  pool,
  query,
  consultar: query,
  cerrarPool,
};
