import { BrowserRouter, Routes, Route } from "react-router-dom";
import ACSInstructor from './pages/ACSInstructor'
import Instructor from './pages/Instructor'
import ACSCliente from "./pages/ACSCliente";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/home";
import Videollamada from './pages/videollamadas'; // ✅ esta es la página
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
        </Routes>
    </BrowserRouter>
  );
}

export default App;
