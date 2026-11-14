// Catálogo de módulos del panel por rol.
// La visibilidad en el menú es solo UX: el backend vuelve a validar
// JWT y rol (RBAC) en cada operación.
import {
  ArrowLeftRight, Car, CircleUser, KeyRound, LayoutDashboard, LockKeyhole,
  ShieldCheck, SquareParking, UserRound, Users, Wallet,
} from "lucide-react";

const TODOS = ["administrador", "operador"];

export const GRUPOS = ["General", "Operación", "Administración", "Cuenta"];

export const MODULOS = [
  { ruta: "/dashboard", titulo: "Panel", icono: LayoutDashboard, detalle: "Resumen en tiempo real", roles: TODOS, grupo: "General" },
  { ruta: "/estancias", titulo: "Entradas y salidas", icono: ArrowLeftRight, detalle: "Registrar ingreso y salida de vehículos", roles: ["administrador", "operador"], grupo: "Operación" },
  { ruta: "/pagos", titulo: "Cobros", icono: Wallet, detalle: "Cobrar estancias finalizadas", roles: ["administrador", "operador"], grupo: "Operación" },
  { ruta: "/espacios", titulo: "Espacios", icono: SquareParking, detalle: "Mapa de celdas y disponibilidad", roles: ["administrador", "operador"], grupo: "Operación" },
  { ruta: "/conductores", titulo: "Conductores", icono: UserRound, detalle: "Propietarios de los vehículos", roles: ["administrador", "operador"], grupo: "Administración" },
  { ruta: "/vehiculos", titulo: "Vehículos", icono: Car, detalle: "Placas y propietarios", roles: ["administrador", "operador"], grupo: "Administración" },
  { ruta: "/usuarios", titulo: "Usuarios y roles", icono: Users, detalle: "Cuentas y permisos", roles: ["administrador"], grupo: "Administración" },
  { ruta: "/recuperacion-administrativa", titulo: "Recuperación de acceso", icono: ShieldCheck, detalle: "Token temporal para un titular", roles: ["administrador"], grupo: "Administración" },
  { ruta: "/mi-perfil", titulo: "Mi perfil", icono: CircleUser, detalle: "Datos de tu cuenta", roles: TODOS, grupo: "Cuenta" },
  { ruta: "/codigos-recuperacion", titulo: "Códigos de respaldo", icono: KeyRound, detalle: "Recupera el acceso sin administrador", roles: TODOS, grupo: "Cuenta" },
  { ruta: "/cambiar-password", titulo: "Cambiar contraseña", icono: LockKeyhole, detalle: "Cierra la sesión al terminar", roles: TODOS, grupo: "Cuenta" },
];

export const RUTAS_MODULOS = MODULOS.filter((m) => m.ruta !== "/dashboard").map((m) => m.ruta);

export const VISTAS = {
  administrador: { titulo: "Panel administrativo", descripcion: "Así va el parqueadero en este momento." },
  operador: { titulo: "Panel de portería", descripcion: "Entradas, salidas y cobros del turno." },
};

export const modulosDeRol = (rol) => MODULOS.filter((m) => m.roles.includes(rol));
