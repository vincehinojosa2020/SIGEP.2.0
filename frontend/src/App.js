import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Painel from "@/pages/Painel";
import Pocos from "@/pages/Pocos";
import Dutos from "@/pages/Dutos";
import Conformidade from "@/pages/Conformidade";
import Telemetria from "@/pages/Telemetria";
import Fauna from "@/pages/Fauna";
import Usuarios from "@/pages/Usuarios";
import PocoDetalhe from "@/pages/PocoDetalhe";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Carregando SIGEP...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Carregando SIGEP...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/painel" replace /> : <Login />} />
      <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
      <Route path="/pocos" element={<ProtectedRoute><Pocos /></ProtectedRoute>} />
      <Route path="/pocos/:id" element={<ProtectedRoute><PocoDetalhe /></ProtectedRoute>} />
      <Route path="/dutos" element={<ProtectedRoute><Dutos /></ProtectedRoute>} />
      <Route path="/conformidade" element={<ProtectedRoute><Conformidade /></ProtectedRoute>} />
      <Route path="/telemetria" element={<ProtectedRoute><Telemetria /></ProtectedRoute>} />
      <Route path="/fauna" element={<ProtectedRoute><Fauna /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? "/painel" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
