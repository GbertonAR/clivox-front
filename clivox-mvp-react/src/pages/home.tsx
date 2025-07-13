import { Link } from 'react-router-dom'
import './home.css'

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-card">
        {/* <h1 className="home-title">
          Bienvenido a <span className="logo-text">Clivox</span> <span className="wave-hand" role="img" aria-label="wave">👋</span>
        </h1> */}
            <div style={{
                backgroundColor: '#7b55c9',
                color: 'white',
                fontWeight: '550',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '2.5rem',
                padding: '1.5rem',
                borderRadius: '8px',
                display: 'inline-block',
                userSelect: 'none'
              }}>
                👋 Bienvenido a Clivox
            </div>
        <p className="subtitle">Comunicaciones en tiempo real con calidad profesional</p>
        <div className="role-buttons">
          <Link to="/instructor">
            <button className="role-btn instructor">Ingresar como Instructor</button>
          </Link>
          <Link to="/cliente">
            <button className="role-btn cliente">Ingresar como Cliente</button>
          </Link>
          <Link to="/videollamada">
            <button className="role-btn videollamada">Videollamada</button> {/* ✅ agregado */}
          </Link>
          <Link to="/acs-instructor">
            <button className="role-btn acs-instructor">ACSInstructor</button> {/* ✅ agregado */}
          </Link>
          <Link to="/acs-cliente">
            <button className="role-btn acs-cliente">Videollamada</button> {/* ✅ agregado */}
          </Link>                    
        </div>
      </div>
    </div>
  )
}

export default Home
