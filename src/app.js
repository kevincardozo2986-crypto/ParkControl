require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const { loadConfig } = require("./config");
const apiKey = require("./middlewares/apiKey.middleware");
const requestId = require("./middlewares/requestId.middleware");
const {
  rutaNoEncontrada,
  manejarError,
} = require("./middlewares/errores.middleware");

function createApp() {
  const config = loadConfig();
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy",   1);
  app.use(requestId);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.allowedOrigins.includes(origin))
          return cb(null, true);
        const err = new Error("Origen no permitido por CORS");
        err.status = 403;
        err.code = "CORS_FORBIDDEN";
        cb(err);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "X-API-Key", "X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "10kb", strict: true }));

  app.get("/", (req, res) =>
    res
      .status(200)
      .json({ nombre: "ParkControl API", version: "2.0.0", estado: "ok" }),
  );
  app.get("/health", (req, res) =>
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }),
  );
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true }),
  );
  app.get("/openapi.json", (req, res) => res.json(swaggerSpec));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMIT",
          mensaje: "Demasiadas solicitudes. Intente nuevamente más tarde.",
        },
      },
    }),
  );
  app.use("/api", apiKey(config.apiKey));

  app.use("/api/conductores", require("./routes/conductores.routes"));
  app.use("/api/vehiculos", require("./routes/vehiculos.routes"));
  app.use("/api/espacios", require("./routes/espacios.routes"));
  app.use("/api/estancias", require("./routes/estancias.routes"));
  app.use("/api/pagos", require("./routes/pagos.routes"));

  app.use(rutaNoEncontrada);
  app.use(manejarError);
  return app;
}

if (require.main === module) {
  const config = loadConfig();
  createApp().listen(config.port, () => {
    console.log(`Servidor: http://localhost:${config.port}`);
    console.log(`Swagger: http://localhost:${config.port}/api-docs`);
  });
}

module.exports = { createApp };
