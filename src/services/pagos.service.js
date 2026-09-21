const datos = require("../data/pagos");
const estancias = require("./estancias.service");
const todos = () => datos;
const porId = (id) => datos.find((x) => x.id === Number(id));
const crear = ({ estanciaId, metodoPago }) => {
  const e = estancias.porId(estanciaId);
  if (!e) return { error: "La estancia no existe", status: 400 };
  if (e.estado !== "finalizada")
    return {
      error: "La estancia debe estar finalizada antes de pagar",
      status: 409,
    };
  if (datos.some((x) => x.estanciaId === Number(estanciaId)))
    return { error: "La estancia ya tiene un pago registrado", status: 409 };
  const tarifa = Number(process.env.TARIFA_POR_HORA || 3000);
  const x = {
    id: datos.length ? Math.max(...datos.map((x) => x.id)) + 1 : 1,
    estanciaId: Number(estanciaId),
    valor: e.tiempoPermanencia * tarifa,
    fechaPago: new Date().toISOString(),
    metodoPago,
    estado: "pagado",
  };
  datos.push(x);
  return { data: x };
};
module.exports = { todos, porId, crear };
