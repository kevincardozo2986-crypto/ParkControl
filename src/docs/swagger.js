
const swaggerJsdoc = require("swagger-jsdoc");

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",

    info: {
      title: "ParkControl API",
      version: "5.0.0",
      description:
        "API REST segura para gestión de parqueadero. Clientes web: JWT (Bearer) + RBAC (administrador, operador). Integraciones privadas: API Key.",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],

    // ========================================
    // Seguridad global: JWT
    // ========================================
    // Cada ruta declara su esquema; las públicas usan security: []
    // y las integraciones privadas ApiKeyAuth.
    security: [
      {
        BearerAuth: [],
      },
    ],

    components: {
      securitySchemes: {
        // ====================================
        // API KEY
        // ====================================
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description:
            "API Key asociada al cliente que consume ParkControl.",
        },

        // ====================================
        // JWT
        // ====================================
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT obtenido mediante POST /api/auth/login. Introducir únicamente el token.",
        },
      },

      schemas: {
        Error: {
          type: "object",
          properties: {
            mensaje: {
              type: "string",
            },
          },
        },

        Conductor: {
          type: "object",
          properties: {
            id: {
              type: "integer",
            },
            nombre: {
              type: "string",
            },
            documento: {
              type: "string",
            },
            telefono: {
              type: "string",
            },
            correo: {
              type: "string",
            },
          },
        },

        Vehiculo: {
          type: "object",
          properties: {
            id: {
              type: "integer",
            },
            placa: {
              type: "string",
            },
            tipo: {
              type: "string",
              enum: ["carro", "moto"],
            },
            marca: {
              type: "string",
            },
            color: {
              type: "string",
            },
            conductorId: {
              type: "integer",
            },
          },
        },

        Espacio: {
          type: "object",
          properties: {
            id: {
              type: "integer",
            },
            numero: {
              type: "string",
            },
            tipo: {
              type: "string",
              enum: ["carro", "moto"],
            },
            estado: {
              type: "string",
              enum: ["disponible", "ocupado"],
            },
            ubicacion: {
              type: "string",
            },
          },
        },
      },
    },

    // ========================================
    // Tags de Swagger
    // ========================================
    tags: [
      {
        name: "Conductores",
      },
      {
        name: "Vehículos",
      },
      {
        name: "Espacios",
      },
      {
        name: "Estancias",
      },
      {
        name: "Pagos",
      },
      {
        name: "Usuarios",
        description: "Gestión administrativa de cuentas y roles",
      },
      {
        name: "Estadísticas",
        description: "Indicadores del dashboard",
      },
      {
        name: "Seguridad",
        description:
          "Endpoints relacionados con autenticación y seguridad de la API",
      },
      {
        name: "Autenticación",
        description:
          "Registro, inicio de sesión y autenticación mediante JWT",
      },
    ],
  },

  apis: ["./src/routes/*.js"],
});
