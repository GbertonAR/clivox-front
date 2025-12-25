import { BrowserRouter, Routes, Route } from "react-router-dom";
import ACSInstructor from './pages/ACSInstructor'
import Instructor from './pages/Instructor'
import ACSCliente from "./pages/ACSCliente";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Videollamada from './pages/videollamadas'; // ✅ esta es la página
import AdminDashboard from './pages/AdminDashboard'; // ⬅️ Asegurate que exista
import DashboardConfig from "./components/admin/DashboardConfig";
import Examen from "./pages/Examen";
import QRLogin from "./pages/QRLogin";
import AIExamPlayer from "./pages/AIExamPlayer";
// ⚠️ NO se importa el componente `VideoCall` aquí

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instructor" element={<Instructor />} />
        <Route path="/acs-instructor" element={<ACSInstructor />} />
        <Route path="/acs-cliente" element={<ACSCliente />} />
        <Route path="/cliente" element={<ACSCliente />} />   {/* ✅ esta línea nueva */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/videollamada" element={<Videollamada />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} /> {/* ✅ Agregado */}
        <Route path="/config" element={<DashboardConfig />} /> {/* ✅ Agregado */}
        <Route path="/examen/:idCapacitacion" element={<Examen />} />
        <Route path="/qr-login" element={<QRLogin />} />
        <Route path="/examen-ia/:idDefinicion" element={<AIExamPlayer />} />
        {/* Aquí puedes agregar más rutas según sea necesario */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
