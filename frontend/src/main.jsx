import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Tipografía Inter servida localmente (compatible con la CSP: font-src 'self')
import "@fontsource-variable/inter";

// Estilos de Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

// Estilos personalizados
import "./index.css";

// Componente principal
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
