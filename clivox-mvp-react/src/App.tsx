import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Instructor from './pages/Instructor'
import Client from './pages/client'
import Dashboard from './pages/Dashboard'
import Home from './pages/home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instructor" element={<Instructor />} />
        <Route path="/cliente" element={<Client />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
