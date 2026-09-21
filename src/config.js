const required = ["API_KEY"];

function loadConfig() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(", ")}`,
    );
  }

  const tarifa = Number(process.env.TARIFA_POR_HORA || 3000);
  if (!Number.isFinite(tarifa) || tarifa <= 0) {
    throw new Error("TARIFA_POR_HORA debe ser un número positivo");
  }

  return {
    port: Number(process.env.PORT || 3000),
    apiKey: process.env.API_KEY,
    allowedOrigins: (process.env.ALLOWED_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    tarifaPorHora: tarifa,
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

module.exports = { loadConfig };
