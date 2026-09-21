const datos = require("../data/espacios");
const estancias = require("../data/estancias");
const todos = () => datos;
const disponibles = () => datos.filter((x) => x.estado === "disponible");
const porId = (id) => datos.find((x) => x.id === Number(id));
const crear = (d) => {
  if (datos.some((x) => x.numero.toLowerCase() === d.numero.toLowerCase()))
    return { error: "El número de espacio ya existe", status: 409 };
  const x = {
    id: datos.length ? Math.max(...datos.map((x) => x.id)) + 1 : 1,
    ...d,
    estado: "disponible",
  };
  datos.push(x);
  return { data: x };
};
const actualizar = (id, d) => {
  const n = Number(id),
    i = datos.findIndex((x) => x.id === n);
  if (i < 0) return { error: "Espacio no encontrado", status: 404 };
  const dup = datos.find(
    (x) => x.numero.toLowerCase() === d.numero.toLowerCase() && x.id !== n,
  );
  if (dup) return { error: "El número de espacio ya existe", status: 409 };
  if (datos[i].estado === "ocupado" && d.tipo !== datos[i].tipo)
    return {
      error: "No se puede cambiar el tipo de un espacio ocupado",
      status: 409,
    };
  datos[i] = { ...datos[i], ...d, id: n, estado: datos[i].estado };
  return { data: datos[i] };
};
const parcial = (id, d) => {
  const actual = porId(id);
  if (!actual) return { error: "Espacio no encontrado", status: 404 };
  return actualizar(id, { ...actual, ...d });
};
const eliminar = (id) => {
  const n = Number(id),
    i = datos.findIndex((x) => x.id === n);
  if (i < 0) return { error: "Espacio no encontrado", status: 404 };
  if (estancias.some((e) => e.espacioId === n))
    return {
      error: "No se puede eliminar el espacio porque tiene estancias asociadas",
      status: 409,
    };
  return { data: datos.splice(i, 1)[0] };
};
module.exports = {
  todos,
  disponibles,
  porId,
  crear,
  actualizar,
  parcial,
  eliminar,
};
