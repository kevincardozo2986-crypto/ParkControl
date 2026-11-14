import { createContext } from "react";

export const AuthContext = createContext(null);

// Aviso mostrado en el login cuando la sesión expira o se revoca
export const CLAVE_AVISO = "parkcontrol_aviso_sesion";
