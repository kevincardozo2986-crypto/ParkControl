const swaggerJsdoc = require("swagger-jsdoc");
module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ParkControl API",
      version: "2.0.0",
      description:
        "API REST segura para gestión de parqueadero. Todas las rutas /api requieren X-API-Key.",
    },
    servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key definida en la variable de entorno API_KEY",
        },
      },
      schemas: {
        Error: { type: "object", properties: { mensaje: { type: "string" } } },
        Conductor: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nombre: { type: "string" },
            documento: { type: "string" },
            telefono: { type: "string" },
            correo: { type: "string" },
          },
        },
        Vehiculo: {
          type: "object",
          properties: {
            id: { type: "integer" },
            placa: { type: "string" },
            tipo: { type: "string", enum: ["carro", "moto"] },
            marca: { type: "string" },
            color: { type: "string" },
            conductorId: { type: "integer" },
          },
        },
        Espacio: {
          type: "object",
          properties: {
            id: { type: "integer" },
            numero: { type: "string" },
            tipo: { type: "string", enum: ["carro", "moto"] },
            estado: { type: "string", enum: ["disponible", "ocupado"] },
            ubicacion: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Conductores" },
      { name: "Vehículos" },
      { name: "Espacios" },
      { name: "Estancias" },
      { name: "Pagos" },
    ],
  },
  apis: ["./src/routes/*.js"],
});
