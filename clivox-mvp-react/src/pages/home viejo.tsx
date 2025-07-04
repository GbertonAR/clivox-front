// src/pages/Home.tsx
import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Bienvenido a <span className="logo-text">Clivox</span></h1>
        <p className="subtitle">Comunicaciones en tiempo real con calidad profesional</p>
        <div className="role-buttons">
          <Link to="/instructor">
            <button className="role-btn instructor">Ingresar como Instructor</button>
          </Link>
          <Link to="/cliente">
            <button className="role-btn cliente">Ingresar como Cliente</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
