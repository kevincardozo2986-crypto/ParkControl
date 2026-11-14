const r = require("express").Router();

const c = require("../controllers/usuarios.controller");
const v = require("../middlewares/usuarios.validator");
const validar = require("../middlewares/validar.middleware");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");

// Todas las rutas: JWT + rol administrador
r.use(autenticarJWT, autorizarRoles("administrador"));

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listado paginado de cuentas (solo administrador)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: rol, schema: { type: string, enum: [administrador, operador] } }
 *       - { in: query, name: activo, schema: { type: string, enum: ["true", "false"] } }
 *       - { in: query, name: pagina, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       '200': { description: Página de usuarios }
 *       '400': { description: Filtros inválidos }
 *       '403': { description: Rol no autorizado }
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear cuenta con rol administrador u operador
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password, rol]
 *             properties:
 *               nombre: { type: string, example: Operador Portería }
 *               email: { type: string, format: email, example: operador@parkcontrol.com }
 *               password: { type: string, format: password, example: ClaveSegura2026 }
 *               rol: { type: string, enum: [administrador, operador] }
 *     responses:
 *       '201': { description: Usuario creado }
 *       '400': { description: Datos inválidos }
 *       '409': { description: Correo duplicado }
 *       '401': { description: No autenticado }
 *       '403': { description: Rol no autorizado }
 */
r.get("/", v.listado, validar, c.listar);
r.post("/", v.creacion, validar, c.crear);

/**
 * @openapi
 * /api/usuarios/busqueda-recuperacion:
 *   get:
 *     tags: [Usuarios]
 *     summary: Buscar cuentas activas para recuperación administrativa
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - { in: query, name: q, required: true, schema: { type: string, minLength: 2 } }
 *     responses:
 *       '200': { description: Hasta 20 coincidencias }
 */
r.get("/busqueda-recuperacion", v.busqueda, validar, c.buscarRecuperacion);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Editar nombre y correo (no cambia rol ni contraseña)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email]
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       '200': { description: Usuario actualizado }
 *       '404': { description: No encontrado }
 *       '409': { description: Correo duplicado }
 * /api/usuarios/{id}/estado:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Activar o desactivar una cuenta (revoca sus JWT)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activo]
 *             properties:
 *               activo: { type: boolean }
 *     responses:
 *       '200': { description: Estado actualizado }
 *       '409': { description: Autodesactivación o último administrador }
 */
r.put("/:id", v.edicion, validar, c.actualizar);
r.patch("/:id/estado", v.estado, validar, c.cambiarEstado);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar una cuenta (solo administrador)
 *     description: No permite eliminar la cuenta propia ni al último administrador activo.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       '200': { description: Usuario eliminado }
 *       '403': { description: Rol no autorizado }
 *       '404': { description: No encontrado }
 *       '409': { description: Cuenta propia o último administrador }
 */
r.delete("/:id", v.id, validar, c.eliminar);

module.exports = r;
