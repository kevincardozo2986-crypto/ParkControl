const datos = require("../data/estancias");
const vehiculos = require("./vehiculos.service");
const espacios = require("./espacios.service");
const todos = () => datos;
const activas = () => datos.filter((x) => x.estado === "activa");
const porId = (id) => datos.find((x) => x.id === Number(id));
const entrada = ({ vehiculoId, espacioId }) => {
  const v = vehiculos.porId(vehiculoId),
    e = espacios.porId(espacioId);
  if (!v) return { error: "El vehículo no existe", status: 400 };
  if (!e) return { error: "El espacio no existe", status: 400 };
  if (activas().some((x) => x.vehiculoId === Number(vehiculoId)))
    return { error: "El vehículo ya tiene una estancia activa", status: 409 };
  if (
    e.estado !== "disponible" ||
    activas().some((x) => x.espacioId === Number(espacioId))
  )
    return { error: "El espacio está ocupado", status: 409 };
  if (v.tipo !== e.tipo)
    return {
      error: "El tipo de espacio no es compatible con el vehículo",
      status: 409,
    };
  const x = {
    id: datos.length ? Math.max(...datos.map((x) => x.id)) + 1 : 1,
    vehiculoId: Number(vehiculoId),
    espacioId: Number(espacioId),
    fechaHoraEntrada: new Date().toISOString(),
    fechaHoraSalida: null,
    estado: "activa",
    tiempoPermanencia: null,
  };
  datos.push(x);
  e.estado = "ocupado";
  return { data: x };
};
const salida = (id) => {
  const x = porId(id);
  if (!x) return { error: "Estancia no encontrada", status: 404 };
  if (x.estado !== "activa")
    return { error: "La estancia no está activa", status: 409 };
  const salida = new Date();
  x.fechaHoraSalida = salida.toISOString();
  x.tiempoPermanencia = Math.max(
    1,
    Math.ceil((salida - new Date(x.fechaHoraEntrada)) / 3600000),
  );
  x.estado = "finalizada";
  const e = espacios.porId(x.espacioId);
  if (e) e.estado = "disponible";
  return { data: x };
};
module.exports = { todos, activas, porId, entrada, salida };
