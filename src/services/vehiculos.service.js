const datos = require("../data/vehiculos");
const conductores = require("./conductores.service");
const estancias = require("../data/estancias");
const todos = () => datos;
const porId = (id) => datos.find((x) => x.id === Number(id));
const porPlaca = (p) => datos.find((x) => x.placa === String(p).toUpperCase());
const crear = (d) => {
  if (!conductores.porId(d.conductorId))
    return { error: "El conductor no existe", status: 400 };
  if (porPlaca(d.placa))
    return { error: "La placa ya está registrada", status: 409 };
  const x = {
    id: datos.length ? Math.max(...datos.map((x) => x.id)) + 1 : 1,
    ...d,
    placa: d.placa.toUpperCase(),
  };
  datos.push(x);
  return { data: x };
};
const actualizar = (id, d) => {
  const i = datos.findIndex((x) => x.id === Number(id));
  if (i < 0) return { error: "Vehículo no encontrado", status: 404 };
  if (!conductores.porId(d.conductorId))
    return { error: "El conductor no existe", status: 400 };
  const dup = porPlaca(d.placa);
  if (dup && dup.id !== Number(id))
    return { error: "La placa ya está registrada", status: 409 };
  datos[i] = { id: datos[i].id, ...d, placa: d.placa.toUpperCase() };
  return { data: datos[i] };
};
const parcial = (id, d) => {
  const actual = porId(id);
  if (!actual) return { error: "Vehículo no encontrado", status: 404 };
  return actualizar(id, { ...actual, ...d });
};
const eliminar = (id) => {
  const n = Number(id),
    i = datos.findIndex((x) => x.id === n);
  if (i < 0) return { error: "Vehículo no encontrado", status: 404 };
  if (estancias.some((e) => e.vehiculoId === n))
    return {
      error:
        "No se puede eliminar el vehículo porque tiene estancias asociadas",
      status: 409,
    };
  return { data: datos.splice(i, 1)[0] };
};
module.exports = {
  todos,
  porId,
  porPlaca,
  crear,
  actualizar,
  parcial,
  eliminar,
};
