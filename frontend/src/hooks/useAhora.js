import { useEffect, useState } from "react";

// Marca de tiempo que se actualiza periódicamente (reloj, tiempos transcurridos)
export function useAhora(intervalo = 30000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [intervalo]);
  return ahora;
}
