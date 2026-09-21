const datos = require("../data/conductores");
const vehiculos = require("../data/vehiculos");
const todos = () => datos;
const porId = (id) => datos.find((x) => x.id === Number(id));
const porDocumento = (d) => datos.find((x) => x.documento === d);
const crear = (d) => {
  const x = {
    id: datos.length ? Math.max(...datos.map((x) => x.id)) + 1 : 1,
    ...d,
  };
  datos.push(x);
  return x;
};
const actualizar = (id, d) => {
  const i = datos.findIndex((x) => x.id === Number(id));
  if (i < 0) return null;
  datos[i] = { id: datos[i].id, ...d };
  return datos[i];
};
const parcial = (id, d) => {
  const i = datos.findIndex((x) => x.id === Number(id));
  if (i < 0) return null;
  datos[i] = { ...datos[i], ...d, id: datos[i].id };
  return datos[i];
};
const eliminar = (id) => {
  const n = Number(id);
  const i = datos.findIndex((x) => x.id === n);
  if (i < 0) return { error: "Conductor no encontrado", status: 404 };
  if (vehiculos.some((v) => v.conductorId === n))
    return {
      error:
        "No se puede eliminar el conductor porque tiene vehículos asociados",
      status: 409,
    };
  return { data: datos.splice(i, 1)[0] };
};
module.exports = {
  todos,
  porId,
  porDocumento,
  crear,
  actualizar,
  parcial,
  eliminar,
};
