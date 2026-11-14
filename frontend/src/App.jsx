import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FeedbackProvider } from "./components/ui/Feedback";
import RutaProtegida from "./components/RutaProtegida";
import LoginPage from "./pages/LoginPage";
import RecuperarPasswordPage from "./pages/RecuperarPasswordPage";
import RestablecerTokenPage from "./pages/RestablecerTokenPage";
import DashboardPage from "./pages/DashboardPage";
import { RUTAS_MODULOS } from "./pages/modulos";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
            <Route path="/restablecer-token" element={<RestablecerTokenPage />} />
            <Route element={<RutaProtegida />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {RUTAS_MODULOS.map((ruta) => (
                <Route key={ruta} path={ruta} element={<DashboardPage />} />
              ))}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </FeedbackProvider>
    </AuthProvider>
  );
}
