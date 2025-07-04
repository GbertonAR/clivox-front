import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Instructor from './pages/Instructor'
import Client from './pages/Client'
import Home from './pages/home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instructor" element={<Instructor />} />
        <Route path="/cliente" element={<Client />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
