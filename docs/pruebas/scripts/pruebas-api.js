// Pruebas de API ParkControl (autenticación, RBAC, BOLA/IDOR, negocio, validación, sesión, recuperación).
// Uso: node pruebas-api.js <raiz-proyecto> <credenciales.json> <salida.json>
const path = require("node:path");
const fs = require("node:fs");
const [raiz, credPath, salida] = process.argv.slice(2);
require(path.join(raiz, "node_modules/dotenv")).config({ path: path.join(raiz, ".env") });
const jwt = require(path.join(raiz, "node_modules/jsonwebtoken"));
const cred = JSON.parse(fs.readFileSync(credPath, "utf8"));
const BASE = "http://localhost:3000";
const resultados = [];

async function llamar(metodo, ruta, { token, body, headers = {}, raw } = {}) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(body !== undefined || raw ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const texto = await r.text();
  let datos; try { datos = JSON.parse(texto); } catch { datos = texto; }
  return { status: r.status, datos, headers: r.headers };
}

const resumen = (d) => {
  if (typeof d !== "object" || d === null) return String(d).slice(0, 80);
  if (Array.isArray(d)) return `lista (${d.length})`;
  const msg = d.mensaje || d.error?.mensaje;
  const det = d.error?.detalles?.map((x) => x.msg).join("; ");
  return [msg, det].filter(Boolean).join(" — ").slice(0, 110) || Object.keys(d).join(", ").slice(0, 80);
};

async function caso(id, categoria, rol, metodo, ruta, esperado, fn, extra) {
  const r = await fn();
  const ok = Array.isArray(esperado) ? esperado.includes(r.status) : r.status === esperado;
  const extraOk = extra ? extra(r) : true;
  resultados.push({
    id, categoria, rol, peticion: `${metodo} ${ruta}`,
    esperado: Array.isArray(esperado) ? esperado.join("/") : String(esperado),
    obtenido: `${r.status} ${resumen(r.datos)}`,
    ok: ok && extraOk !== false,
    nota: typeof extraOk === "string" ? extraOk : "",
  });
  console.log(`${ok && extraOk !== false ? "OK  " : "FAIL"} ${id} ${metodo} ${ruta} -> ${r.status} ${resumen(r.datos)}`);
  return r;
}

const login = async (c) => (await llamar("POST", "/api/auth/login", { body: c })).datos.token;

(async () => {
  const fecha = new Date().toISOString();

  // ---------- Preparación ----------
  const tAdmin = await login(cred.admin);
  const crear = (c, nombre, rol) => llamar("POST", "/api/usuarios", { token: tAdmin, body: { nombre, email: c.email, password: c.password, rol } });
  const uOp = (await crear(cred.operador, "Operador Pruebas", "operador")).datos.usuario;
  const uC1 = (await crear(cred.conductor, "Conductor Uno Pruebas", "conductor")).datos.usuario;
  const uC2 = (await crear(cred.conductor2, "Conductor Dos Pruebas", "conductor")).datos.usuario;
  const conductores = (await llamar("GET", "/api/conductores", { token: tAdmin })).datos;
  const [c1, c2] = conductores;
  await llamar("PATCH", `/api/conductores/${c1.id}/cuenta`, { token: tAdmin, body: { usuarioId: Number(uC1.id) } });
  await llamar("PATCH", `/api/conductores/${c2.id}/cuenta`, { token: tAdmin, body: { usuarioId: Number(uC2.id) } });
  const vehiculos = (await llamar("GET", "/api/vehiculos", { token: tAdmin })).datos;
  const v1 = vehiculos.find((v) => String(v.conductorId) === String(c1.id)); // carro de conductor 1
  const v2 = vehiculos.find((v) => String(v.conductorId) === String(c2.id)); // moto de conductor 2
  const espacios = (await llamar("GET", "/api/espacios", { token: tAdmin })).datos;
  const eCarro = espacios.find((e) => e.tipo === "carro");
  const eCarro2 = espacios.filter((e) => e.tipo === "carro")[1];
  const eMoto = espacios.find((e) => e.tipo === "moto");
  const tOp = await login(cred.operador);
  let tC1 = await login(cred.conductor);
  const tC2 = await login(cred.conductor2);

  // ---------- 1. Autenticación ----------
  await caso("AUT-01", "Autenticación", "administrador", "POST", "/api/auth/login", 200,
    () => llamar("POST", "/api/auth/login", { body: cred.admin }), (r) => (r.datos.token ? true : "sin token"));
  await caso("AUT-02", "Autenticación", "—", "POST", "/api/auth/login (clave errada)", 401,
    () => llamar("POST", "/api/auth/login", { body: { email: cred.admin.email, password: "ClaveIncorrecta123" } }));
  await caso("AUT-03", "Autenticación", "—", "POST", "/api/auth/login (correo inexistente)", 401,
    () => llamar("POST", "/api/auth/login", { body: { email: "nadie@parkcontrol.test", password: "Cualquiera123" } }));
  await caso("AUT-04", "Autenticación", "—", "GET", "/api/estancias (sin token)", 401, () => llamar("GET", "/api/estancias"));
  const partes = tC1.split(".");
  const payloadFalso = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(partes[1], "base64url")), rol: "administrador" })).toString("base64url");
  await caso("AUT-05", "Autenticación", "conductor", "GET", "/api/usuarios (JWT con rol alterado)", 401,
    () => llamar("GET", "/api/usuarios", { token: `${partes[0]}.${payloadFalso}.${partes[2]}` }));
  const expirado = jwt.sign({ email: cred.admin.email, rol: "administrador", vs: 0 }, process.env.JWT_SECRET, { subject: "1", expiresIn: -10 });
  await caso("AUT-06", "Autenticación", "administrador", "GET", "/api/usuarios (JWT expirado)", 401,
    () => llamar("GET", "/api/usuarios", { token: expirado }));
  const sinFirma = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "1", rol: "administrador", vs: 0 })).toString("base64url")}.`;
  await caso("AUT-07", "Autenticación", "—", "GET", "/api/usuarios (JWT alg=none)", 401,
    () => llamar("GET", "/api/usuarios", { token: sinFirma }));
  await caso("AUT-08", "Autenticación", "—", "GET", "/api/estancias (formato Token xyz)", 401,
    () => llamar("GET", "/api/estancias", { headers: { Authorization: "Token xyz" } }));
  await caso("AUT-09", "Autenticación", "conductor", "GET", "/api/auth/perfil", 200,
    () => llamar("GET", "/api/auth/perfil", { token: tC1 }), (r) => r.datos.usuario?.rol === "conductor" || "rol distinto");

  // ---------- 2. API Key (clientes privados) ----------
  await caso("KEY-01", "API Key", "—", "POST", "/api/auth/registro (sin API Key)", 401,
    () => llamar("POST", "/api/auth/registro", { body: { nombre: "Nuevo", email: "nuevo@parkcontrol.test", password: "ClaveSegura2026" } }));
  await caso("KEY-02", "API Key", "—", "POST", "/api/auth/registro (API Key inválida)", 401,
    () => llamar("POST", "/api/auth/registro", { headers: { "X-API-Key": "clave-falsa" }, body: {} }));
  await caso("KEY-03", "API Key", "cliente Postman", "POST", "/api/auth/registro (envía rol=administrador)", 201,
    () => llamar("POST", "/api/auth/registro", { headers: { "X-API-Key": process.env.API_KEY_POSTMAN }, body: { nombre: "Registro Publico", email: "publico@parkcontrol.test", password: "ClaveSegura2026", rol: "administrador" } }),
    (r) => r.datos.usuario?.rol === "conductor" || `rol asignado: ${r.datos.usuario?.rol}`);
  await caso("KEY-04", "API Key", "cliente Postman", "GET", "/api/seguridad/cliente", 200,
    () => llamar("GET", "/api/seguridad/cliente", { headers: { "X-API-Key": process.env.API_KEY_POSTMAN } }));

  // ---------- 3. RBAC ----------
  await caso("RBAC-01", "RBAC", "conductor", "GET", "/api/vehiculos (listado global)", 403, () => llamar("GET", "/api/vehiculos", { token: tC1 }));
  await caso("RBAC-02", "RBAC", "conductor", "POST", "/api/estancias/entrada", 403,
    () => llamar("POST", "/api/estancias/entrada", { token: tC1, body: { vehiculoId: Number(v1.id), espacioId: Number(eCarro.id) } }));
  await caso("RBAC-03", "RBAC", "conductor", "GET", "/api/estadisticas/resumen", 403, () => llamar("GET", "/api/estadisticas/resumen", { token: tC1 }));
  await caso("RBAC-04", "RBAC", "operador", "POST", "/api/usuarios", 403,
    () => llamar("POST", "/api/usuarios", { token: tOp, body: { nombre: "Intruso", email: "intruso@parkcontrol.test", password: "ClaveSegura2026", rol: "administrador" } }));
  await caso("RBAC-05", "RBAC", "operador", "POST", "/api/conductores", 403,
    () => llamar("POST", "/api/conductores", { token: tOp, body: { nombre: "Nuevo C", documento: "123456789", telefono: "3000000000", correo: "c@x.com" } }));
  await caso("RBAC-06", "RBAC", "operador", "DELETE", `/api/espacios/${eCarro2.id}`, 403, () => llamar("DELETE", `/api/espacios/${eCarro2.id}`, { token: tOp }));
  await caso("RBAC-07", "RBAC", "operador", "GET", "/api/estadisticas/resumen", 200, () => llamar("GET", "/api/estadisticas/resumen", { token: tOp }));
  await caso("RBAC-08", "RBAC", "administrador", "GET", "/api/usuarios", 200, () => llamar("GET", "/api/usuarios", { token: tAdmin }));

  // ---------- 4. BOLA / IDOR ----------
  await caso("BOLA-01", "BOLA/IDOR", "conductor", "GET", "/api/vehiculos/mis-vehiculos", 200,
    () => llamar("GET", "/api/vehiculos/mis-vehiculos", { token: tC1 }),
    (r) => (Array.isArray(r.datos) && r.datos.length > 0 && r.datos.every((v) => String(v.conductorId) === String(c1.id))) || "incluye vehículos ajenos");
  await caso("BOLA-02", "BOLA/IDOR", "conductor", "GET", `/api/vehiculos/${v1.id} (propio)`, 200, () => llamar("GET", `/api/vehiculos/${v1.id}`, { token: tC1 }));
  await caso("BOLA-03", "BOLA/IDOR", "conductor", "GET", `/api/vehiculos/${v2.id} (ajeno)`, 403, () => llamar("GET", `/api/vehiculos/${v2.id}`, { token: tC1 }));
  await caso("BOLA-04", "BOLA/IDOR", "conductor", "GET", `/api/conductores/${c2.id} (ficha ajena)`, 403, () => llamar("GET", `/api/conductores/${c2.id}`, { token: tC1 }));
  await caso("BOLA-05", "BOLA/IDOR", "conductor", "GET", "/api/conductores/mi-ficha", 200,
    () => llamar("GET", "/api/conductores/mi-ficha", { token: tC1 }), (r) => String(r.datos.id) === String(c1.id) || "ficha distinta");
  const tSinFicha = await login({ email: "publico@parkcontrol.test", password: "ClaveSegura2026" });
  await caso("BOLA-06", "BOLA/IDOR", "conductor sin ficha", "GET", "/api/vehiculos/mis-vehiculos", 404, () => llamar("GET", "/api/vehiculos/mis-vehiculos", { token: tSinFicha }));
  await caso("BOLA-07", "BOLA/IDOR", "conductor sin ficha", "GET", `/api/vehiculos/${v1.id}`, 403, () => llamar("GET", `/api/vehiculos/${v1.id}`, { token: tSinFicha }));

  // ---------- 5. Reglas de negocio ----------
  await caso("NEG-01", "Negocio", "conductor", "GET", "/api/espacios (disponibilidad)", 200, () => llamar("GET", "/api/espacios", { token: tC1 }));
  const ent = await caso("NEG-02", "Negocio", "operador", "POST", "/api/estancias/entrada (carro en espacio libre)", 201,
    () => llamar("POST", "/api/estancias/entrada", { token: tOp, body: { vehiculoId: Number(v1.id), espacioId: Number(eCarro.id) } }));
  const estanciaId = ent.datos.estancia?.id;
  await caso("NEG-03", "Negocio", "operador", "POST", "/api/estancias/entrada (mismo vehículo otra vez)", 409,
    () => llamar("POST", "/api/estancias/entrada", { token: tOp, body: { vehiculoId: Number(v1.id), espacioId: Number(eCarro2.id) } }));
  await caso("NEG-04", "Negocio", "operador", "POST", "/api/estancias/entrada (espacio ocupado)", 409,
    () => llamar("POST", "/api/estancias/entrada", { token: tOp, body: { vehiculoId: Number(v2.id), espacioId: Number(eCarro.id) } }));
  await caso("NEG-05", "Negocio", "operador", "POST", "/api/estancias/entrada (moto en celda de carro)", 409,
    () => llamar("POST", "/api/estancias/entrada", { token: tOp, body: { vehiculoId: Number(v2.id), espacioId: Number(eCarro2.id) } }));
  await caso("NEG-06", "Negocio", "operador", "POST", "/api/pagos (estancia aún activa)", 409,
    () => llamar("POST", "/api/pagos", { token: tOp, body: { estanciaId: Number(estanciaId), metodoPago: "efectivo" } }));
  await caso("BOLA-08", "BOLA/IDOR", "conductor", "GET", `/api/estancias/${estanciaId} (propia)`, 200, () => llamar("GET", `/api/estancias/${estanciaId}`, { token: tC1 }));
  await caso("BOLA-09", "BOLA/IDOR", "conductor (otro)", "GET", `/api/estancias/${estanciaId} (ajena)`, 403, () => llamar("GET", `/api/estancias/${estanciaId}`, { token: tC2 }));
  await caso("NEG-07", "Negocio", "operador", "PATCH", `/api/estancias/${estanciaId}/salida`, 200,
    () => llamar("PATCH", `/api/estancias/${estanciaId}/salida`, { token: tOp }), (r) => r.datos.estancia?.tiempoPermanencia >= 1 || "sin tiempo");
  await caso("NEG-08", "Negocio", "operador", "PATCH", `/api/estancias/${estanciaId}/salida (repetida)`, 409, () => llamar("PATCH", `/api/estancias/${estanciaId}/salida`, { token: tOp }));
  const pago = await caso("NEG-09", "Negocio", "operador", "POST", "/api/pagos (estancia finalizada)", 201,
    () => llamar("POST", "/api/pagos", { token: tOp, body: { estanciaId: Number(estanciaId), metodoPago: "efectivo", valor: 1 } }),
    (r) => Number(r.datos.pago?.valor) === Number(process.env.TARIFA_POR_HORA || 3000) || `valor ${r.datos.pago?.valor} (se ignoró el valor enviado por el cliente)`);
  await caso("NEG-10", "Negocio", "operador", "POST", "/api/pagos (misma estancia)", 409,
    () => llamar("POST", "/api/pagos", { token: tOp, body: { estanciaId: Number(estanciaId), metodoPago: "tarjeta" } }));
  await caso("BOLA-10", "BOLA/IDOR", "conductor (otro)", "GET", `/api/pagos/${pago.datos.pago?.id} (ajeno)`, 403, () => llamar("GET", `/api/pagos/${pago.datos.pago?.id}`, { token: tC2 }));
  await caso("BOLA-11", "BOLA/IDOR", "conductor", "GET", "/api/pagos/mis-pagos", 200,
    () => llamar("GET", "/api/pagos/mis-pagos", { token: tC1 }), (r) => (Array.isArray(r.datos) && r.datos.length === 1) || "cantidad inesperada");
  // Concurrencia: 5 entradas simultáneas del mismo vehículo
  const t0 = Date.now();
  const carreras = await Promise.all(Array.from({ length: 5 }, () =>
    llamar("POST", "/api/estancias/entrada", { token: tOp, body: { vehiculoId: Number(v2.id), espacioId: Number(eMoto.id) } })));
  const exitos = carreras.filter((r) => r.status === 201).length;
  resultados.push({ id: "NEG-11", categoria: "Negocio", rol: "operador", peticion: "5 × POST /api/estancias/entrada simultáneos (mismo vehículo)", esperado: "1×201, 4×409", obtenido: carreras.map((r) => r.status).join(", ") + ` (${Date.now() - t0} ms)`, ok: exitos === 1, nota: "" });
  console.log(`${exitos === 1 ? "OK  " : "FAIL"} NEG-11 concurrencia -> ${carreras.map((r) => r.status).join(",")}`);

  // ---------- 6. Validación de entrada ----------
  await caso("VAL-01", "Validación", "administrador", "POST", "/api/vehiculos (placa \"A\")", 400,
    () => llamar("POST", "/api/vehiculos", { token: tAdmin, body: { placa: "A", tipo: "carro", marca: "X", color: "Y", conductorId: Number(c1.id) } }));
  await caso("VAL-02", "Validación", "administrador", "GET", "/api/vehiculos/1 OR 1=1 (inyección SQL en ID)", 400, () => llamar("GET", "/api/vehiculos/1%20OR%201=1", { token: tAdmin }));
  await caso("VAL-03", "Validación", "administrador", "GET", "/api/usuarios?q=' OR '1'='1", 200,
    () => llamar("GET", `/api/usuarios?q=${encodeURIComponent("' OR '1'='1")}`, { token: tAdmin }), (r) => r.datos.total === 0 || `devolvió ${r.datos.total} filas`);
  await caso("VAL-04", "Validación", "administrador", "POST", "/api/espacios (asignación masiva estado=ocupado)", 201,
    () => llamar("POST", "/api/espacios", { token: tAdmin, body: { numero: "T-900", tipo: "carro", ubicacion: "Pruebas", estado: "ocupado", id: 999 } }),
    (r) => (r.datos.espacio?.estado === "disponible" && String(r.datos.espacio?.id) !== "999") || "aceptó campos no permitidos");
  await caso("VAL-05", "Validación", "administrador", "POST", "/api/conductores (cuerpo > 10 KB)", 413,
    () => llamar("POST", "/api/conductores", { token: tAdmin, body: { nombre: "x".repeat(12000) } }));
  await caso("VAL-06", "Validación", "administrador", "POST", "/api/conductores (JSON mal formado)", 400,
    () => llamar("POST", "/api/conductores", { token: tAdmin, raw: "{nombre:" }));
  await caso("VAL-07", "Validación", "—", "POST", "/api/auth/registro (contraseña débil)", 400,
    () => llamar("POST", "/api/auth/registro", { headers: { "X-API-Key": process.env.API_KEY_POSTMAN }, body: { nombre: "Debil", email: "debil@parkcontrol.test", password: "123456" } }));

  // ---------- 7. Gestión de cuentas y sesión ----------
  await caso("CTA-01", "Cuentas", "administrador", "PATCH", "/api/usuarios/{propio}/estado {activo:false}", 409,
    () => llamar("PATCH", "/api/usuarios/1/estado", { token: tAdmin, body: { activo: false } }));
  await caso("CTA-02", "Cuentas", "administrador", "PATCH", `/api/conductores/${c1.id}/cuenta (cuenta de operador)`, 400,
    () => llamar("PATCH", `/api/conductores/${c1.id}/cuenta`, { token: tAdmin, body: { usuarioId: Number(uOp.id) } }));
  await caso("CTA-03", "Cuentas", "administrador", "PATCH", `/api/conductores/${c2.id}/cuenta (cuenta ya vinculada)`, 409,
    () => llamar("PATCH", `/api/conductores/${c2.id}/cuenta`, { token: tAdmin, body: { usuarioId: Number(uC1.id) } }));
  const nueva = cred.conductor.password + "Nx7";
  await caso("SES-01", "Sesión", "conductor", "PATCH", "/api/auth/cambiar-password", 200,
    () => llamar("PATCH", "/api/auth/cambiar-password", { token: tC1, body: { passwordActual: cred.conductor.password, passwordNueva: nueva, confirmarPassword: nueva } }));
  await caso("SES-02", "Sesión", "conductor", "GET", "/api/auth/perfil (token anterior al cambio)", 401, () => llamar("GET", "/api/auth/perfil", { token: tC1 }));
  await caso("SES-03", "Sesión", "conductor", "POST", "/api/auth/login (contraseña anterior)", 401,
    () => llamar("POST", "/api/auth/login", { body: cred.conductor }));
  tC1 = await login({ email: cred.conductor.email, password: nueva });
  await caso("SES-04", "Sesión", "conductor", "POST", "/api/auth/login (contraseña nueva)", 200, () => llamar("POST", "/api/auth/login", { body: { email: cred.conductor.email, password: nueva } }));
  await caso("SES-05", "Sesión", "administrador", "PATCH", `/api/usuarios/${uC2.id}/estado {activo:false}`, 200,
    () => llamar("PATCH", `/api/usuarios/${uC2.id}/estado`, { token: tAdmin, body: { activo: false } }));
  await caso("SES-06", "Sesión", "conductor (desactivado)", "GET", "/api/vehiculos/mis-vehiculos", 403, () => llamar("GET", "/api/vehiculos/mis-vehiculos", { token: tC2 }));

  // ---------- 8. Recuperación ----------
  const cods = await caso("REC-01", "Recuperación", "conductor", "POST", "/api/auth/codigos-recuperacion", 201,
    () => llamar("POST", "/api/auth/codigos-recuperacion", { token: tC1, body: { passwordActual: nueva } }), (r) => r.datos.codigos?.length === 8 || "no son 8");
  await caso("REC-02", "Recuperación", "conductor", "POST", "/api/auth/codigos-recuperacion (contraseña errada)", 401,
    async () => llamar("POST", "/api/auth/codigos-recuperacion", { token: await login({ email: cred.conductor.email, password: nueva }), body: { passwordActual: "Incorrecta123A" } }));
  const codigo = cods.datos.codigos[0];
  const otra = nueva + "Rz2";
  await caso("REC-03", "Recuperación", "—", "POST", "/api/auth/restablecer-con-codigo", 200,
    () => llamar("POST", "/api/auth/restablecer-con-codigo", { body: { email: cred.conductor.email, codigo, passwordNueva: otra, confirmarPassword: otra } }));
  await caso("REC-04", "Recuperación", "—", "POST", "/api/auth/restablecer-con-codigo (código reutilizado)", 400,
    () => llamar("POST", "/api/auth/restablecer-con-codigo", { body: { email: cred.conductor.email, codigo, passwordNueva: otra + "b", confirmarPassword: otra + "b" } }));
  await caso("REC-05", "Recuperación", "operador", "POST", `/api/auth/recuperacion/admin/${uC1.id}`, 403, () => llamar("POST", `/api/auth/recuperacion/admin/${uC1.id}`, { token: tOp }));
  const tok = await caso("REC-06", "Recuperación", "administrador", "POST", `/api/auth/recuperacion/admin/${uOp.id}`, 201,
    () => llamar("POST", `/api/auth/recuperacion/admin/${uOp.id}`, { token: tAdmin }), (r) => /^[a-f0-9]{64}$/.test(r.datos.token || "") || "token con formato inesperado");
  const pOp = cred.operador.password + "Tk5";
  await caso("REC-07", "Recuperación", "—", "POST", "/api/auth/restablecer-password (token admin)", 200,
    () => llamar("POST", "/api/auth/restablecer-password", { body: { token: tok.datos.token, passwordNueva: pOp, confirmarPassword: pOp } }));
  await caso("REC-08", "Recuperación", "—", "POST", "/api/auth/restablecer-password (token reutilizado)", 400,
    () => llamar("POST", "/api/auth/restablecer-password", { body: { token: tok.datos.token, passwordNueva: pOp + "x", confirmarPassword: pOp + "x" } }));
  await caso("REC-09", "Recuperación", "operador", "GET", "/api/estancias (token emitido antes del restablecimiento)", 401, () => llamar("GET", "/api/estancias", { token: tOp }));

  // ---------- 9. Cabeceras y CORS ----------
  await caso("HDR-01", "Cabeceras/CORS", "—", "GET", "/api/estancias (Origin: http://evil.test)", 403, () => llamar("GET", "/api/estancias", { headers: { Origin: "http://evil.test" } }));
  await caso("HDR-02", "Cabeceras/CORS", "—", "GET", "/health (cabeceras de seguridad)", 200, () => llamar("GET", "/health"), (r) => {
    const faltan = ["x-content-type-options", "strict-transport-security", "x-frame-options", "referrer-policy"].filter((h) => !r.headers.get(h));
    if (r.headers.get("x-powered-by")) faltan.push("x-powered-by presente");
    return faltan.length ? `faltan: ${faltan.join(", ")}` : true;
  });
  await caso("HDR-03", "Cabeceras/CORS", "—", "OPTIONS", "/api/estancias (preflight desde localhost:5173)", 204, async () => {
    const r = await fetch(BASE + "/api/estancias", { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
    return { status: r.status, datos: `allow-origin: ${r.headers.get("access-control-allow-origin")}`, headers: r.headers };
  });

  // ---------- 10. Fuerza bruta (al final: bloquea el login desde esta IP 15 min) ----------
  const estados = [];
  for (let i = 0; i < 11; i++) estados.push((await llamar("POST", "/api/auth/login", { body: { email: cred.admin.email, password: `Errada${i}Abc` } })).status);
  resultados.push({ id: "AUT-10", categoria: "Autenticación", rol: "—", peticion: "11 × POST /api/auth/login con clave errada", esperado: "401… luego 429", obtenido: estados.join(", "), ok: estados.includes(429) && estados[0] === 401, nota: "" });
  console.log(`AUT-10 fuerza bruta -> ${estados.join(",")}`);

  fs.writeFileSync(salida, JSON.stringify({ fecha, total: resultados.length, aprobadas: resultados.filter((r) => r.ok).length, resultados }, null, 2));
  console.log(`\n${resultados.filter((r) => r.ok).length}/${resultados.length} aprobadas`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
