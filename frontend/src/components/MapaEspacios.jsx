import { Bike, Car, MapPin, Plus } from "lucide-react";
import { useAhora } from "../hooks/useAhora";
import { Placa } from "./ui/elementos";
import { transcurrido } from "./formato";

// Mapa del parqueadero agrupado por ubicación (zona).
// Con onSeleccionar, solo las celdas libres y compatibles se pueden elegir.
export default function MapaEspacios({ espacios, estanciasActivas = [], tipoPermitido, seleccionado, onSeleccionar }) {
  const ahora = useAhora(30000);
  const ocupacion = Object.fromEntries(estanciasActivas.map((e) => [String(e.espacioId), e]));
  const zonas = espacios.reduce((acc, e) => {
    const z = e.ubicacion || "Sin ubicación";
    (acc[z] ||= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <div className="pc-lot" role="list" aria-label="Mapa de espacios">
        {Object.entries(zonas).map(([zona, lista]) => (
          <div className="pc-lot-zona" key={zona}>
            <h4><MapPin />{zona} · {lista.filter((e) => e.estado === "disponible").length}/{lista.length} libres</h4>
            <div className="pc-lot-fila">
              {lista.map((e) => {
                const libre = e.estado === "disponible";
                const estancia = ocupacion[String(e.id)];
                const elegible = Boolean(onSeleccionar) && libre && (!tipoPermitido || e.tipo === tipoPermitido);
                const Icono = e.tipo === "moto" ? Bike : Car;
                const elegido = String(seleccionado) === String(e.id);
                const clase = `pc-slot ${libre ? "pc-slot-libre" : "pc-slot-ocupado"} ${elegido ? "seleccionado" : ""}`;
                const contenido = (
                  <>
                    <span className="pc-slot-num">{e.numero}</span>
                    {libre ? (
                      <>
                        <span className="pc-slot-vacio">{elegido ? <Plus /> : <Icono />}</span>
                        <small>{elegido ? "Seleccionado" : e.tipo === "moto" ? "Moto · libre" : "Carro · libre"}</small>
                      </>
                    ) : (
                      <>
                        <span className="pc-slot-auto"><Icono /></span>
                        {estancia ? <Placa valor={estancia.placa} /> : <small>Ocupado</small>}
                        {estancia && <small>{transcurrido(estancia.fechaHoraEntrada, ahora)}</small>}
                      </>
                    )}
                  </>
                );
                const etiqueta = `Espacio ${e.numero}, ${e.tipo}, ${libre ? "libre" : `ocupado${estancia ? ` por ${estancia.placa}` : ""}`}`;
                return onSeleccionar ? (
                  <button key={e.id} type="button" role="listitem" className={clase} disabled={!elegible} aria-pressed={elegido} aria-label={etiqueta} onClick={() => onSeleccionar(e.id)}>{contenido}</button>
                ) : (
                  <div key={e.id} role="listitem" className={clase} aria-label={etiqueta}>{contenido}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="pc-lot-leyenda" aria-hidden="true">
        <span><i style={{ border: "2px solid #5f5f6b" }} />Libre</span>
        <span><i style={{ background: "#e14545" }} />Ocupado</span>
        {onSeleccionar && <span><i style={{ background: "#a855f7" }} />Seleccionado</span>}
        {tipoPermitido && <span>Solo se habilitan celdas para {tipoPermitido === "moto" ? "motos" : "carros"}</span>}
      </div>
    </>
  );
}
