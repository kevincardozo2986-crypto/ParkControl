require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./docs/swagger");
const { loadConfig } = require("./config");

// ========================================
// Middlewares
// ========================================
const validarApiKey = require("./middlewares/apiKey.middleware");
const requestId = require("./middlewares/requestId.middleware");

const {
  rutaNoEncontrada,
  manejarError,
} = require("./middlewares/errores.middleware");

// ========================================
// Clasificación de rutas /api
// ========================================
const RECURSOS_JWT = new Set([
  "conductores",
  "vehiculos",
  "espacios",
  "estancias",
  "pagos",
  "usuarios",
  "estadisticas",
]);

const AUTH_JWT = new Set([
  "perfil",
  "cambiar-password",
  "recuperacion",
  "codigos-recuperacion",
]);

const AUTH_PUBLICAS = new Set([
  "POST /login",
  "POST /restablecer-password",
  "POST /restablecer-con-codigo",
]);

// req.path es relativo a /api (p. ej. /estancias/3/salida)
const esRutaWebJWT = (req) => {
  const [, primero, segundo] = req.path.split("/");

  if (RECURSOS_JWT.has(primero)) return true;

  return primero === "auth" && AUTH_JWT.has(segundo);
};

const esRutaPublica = (req) =>
  req.path.startsWith("/auth/") &&
  AUTH_PUBLICAS.has(`${req.method} ${req.path.slice("/auth".length)}`);

// ========================================
// Crear aplicación
// ========================================
function createApp() {
  const config = loadConfig();
  const app = express();

  // ========================================
  // Configuración general
  // ========================================
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Request ID
  app.use(requestId);

  // Helmet con CSP compatible con Swagger UI (scripts solo propios).
  // upgrade-insecure-requests se omite para poder usar http://localhost.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
          "font-src": ["'self'", "data:"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          "upgrade-insecure-requests": null,
        },
      },
    }),
  );

  // ========================================
  // CORS
  // ========================================
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.allowedOrigins.includes(origin)) {
          return cb(null, true);
        }

        const err = new Error("Origen no permitido por CORS");
        err.status = 403;
        err.code = "CORS_FORBIDDEN";

        return cb(err);
      },

      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Request-Id",
      ],

      exposedHeaders: ["Retry-After", "X-Request-Id"],
    }),
  );

  // ========================================
  // JSON
  // ========================================
  app.use(
    express.json({
      limit: "10kb",
      strict: true,
    }),
  );

  // ========================================
  // Rutas públicas
  // ========================================

  // Información general
  app.get("/", (req, res) => {
    return res.status(200).json({
      nombre: "ParkControl API",
      version: "3.0.0",
      estado: "ok",
    });
  });

  // Health check
  app.get("/health", (req, res) => {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // ========================================
  // Swagger
  // ========================================
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
    }),
  );

  app.get("/openapi.json", (req, res) => {
    return res.json(swaggerSpec);
  });

  // ========================================
  // Rate Limiting para /api
  // ========================================
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      // RATE_LIMIT_MAX permite ajustar el límite (p. ej. durante un escaneo DAST controlado)
      limit: Number(process.env.RATE_LIMIT_MAX) || 300,
      // El login tiene su propio limitador (auth.routes.js)
      skip: (req) => req.path === "/auth/login",
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

  // ========================================
  // Clientes web (JWT) y clientes privados (API Key)
  // ========================================
  // El navegador NUNCA debe contener una API Key privada.
  // - Recursos y cuenta propia: JWT + RBAC en sus routers.
  // - Login y recuperación pública: sin credencial, con rate limit.
  // - /api/seguridad e integraciones privadas: API Key.
  app.use("/api", (req, res, next) => {
    if (esRutaWebJWT(req) || esRutaPublica(req)) {
      return next();
    }

    return validarApiKey(req, res, next);
  });

  // ========================================
  // Rutas ParkControl
  // ========================================
  app.use("/api/conductores", require("./routes/conductores.routes"));

  app.use("/api/vehiculos", require("./routes/vehiculos.routes"));

  app.use("/api/espacios", require("./routes/espacios.routes"));

  app.use("/api/estancias", require("./routes/estancias.routes"));

  app.use("/api/pagos", require("./routes/pagos.routes"));

  app.use("/api/usuarios", require("./routes/usuarios.routes"));

  app.use("/api/estadisticas", require("./routes/estadisticas.routes"));

  app.use("/api/seguridad", require("./routes/seguridad.routes"));

  app.use("/api/auth", require("./routes/auth.routes"));

  // ========================================
  // Manejo de errores
  // ========================================
  app.use(rutaNoEncontrada);
  app.use(manejarError);

  return app;
}

// ========================================
// Iniciar servidor
// ========================================
// No se crean usuarios ni administradores durante el arranque:
// la cuenta inicial se crea con `npm run seed:admin`.
const iniciarServidor = () => {
  try {
    const config = loadConfig();

    const servidor = createApp().listen(config.port, () => {
      console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
      console.log(`Swagger UI: http://localhost:${config.port}/api-docs`);
      console.log(`OpenAPI JSON: http://localhost:${config.port}/openapi.json`);
    });

    servidor.on("error", (error) => {
      console.error("Error al iniciar servidor:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  iniciarServidor();
}


module.exports = {
  createApp,
};
