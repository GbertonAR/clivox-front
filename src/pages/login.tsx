import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, Loader2, Sparkles, Zap, Eye, Shield } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    setMessageType(null);

    try {
      // Usamos la URL absoluta para asegurar conexión con el backend
      const response = await fetch("http://localhost:8000/auth/enviar-codigo_acs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Código enviado exitosamente. Revisa tu bandeja de entrada.");
        setMessageType('success');
        setTimeout(() => {
          navigate(`/validacodigo?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setMensaje(data.error || "Usuario no registrado o error en el servidor.");
        setMessageType('error');
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensaje("Error de conexión. Verifica tu conexión a internet.");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden particles-bg">
      {/* Fondo ultra-creativo con múltiples capas */}
      <div className="absolute inset-0 bg-mesh-cosmic opacity-40"></div>
      <div className="absolute inset-0 bg-neural-network opacity-20"></div>

      {/* Orbes flotantes ultra-dinámicos y lumínicos */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/40 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/40 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px]"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header ultra-futurista */}
          <div className="text-center mb-12 slide-up-cosmic">
            <div className="relative inline-flex items-center justify-center mb-8">
              {/* Anillo holográfico rotativo */}
              <div className="absolute w-32 h-32 hologram-border rounded-full rotate-hologram opacity-60">
                <div className="w-full h-full bg-transparent rounded-full"></div>
              </div>

              {/* Logo central con efectos neón */}
              <div className="relative w-24 h-24 gradient-cosmic rounded-2xl p-0.5 pulse-neon">
                <div className="flex items-center justify-center w-full h-full bg-background rounded-2xl">
                  <Zap className="w-12 h-12 text-neon-purple drop-shadow-lg" />
                </div>
              </div>
            </div>

            <h1 className="text-7xl font-futuristic gradient-text-cosmic mb-4 drop-shadow-[0_0_30px_rgba(139,92,246,0.8)] tracking-tighter">
              CLIVOX
            </h1>
            <p className="text-xl font-medium text-foreground/80 mb-2">
              Bienvenido a tu viaje de aprendizaje
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Portal de Acceso de Estudiantes
            </p>
          </div>

          {/* Tarjeta de login ultra-futurista con iluminación mejorada */}
          <div className="glass-ultra rounded-3xl p-8 shadow-[0_0_50px_rgba(139,92,246,0.2)] scale-in-cosmic stagger-1 relative overflow-hidden ring-1 ring-white/20">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full"></div>
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-4 slide-up-cosmic stagger-2">
                <label
                  htmlFor="email"
                  className="text-sm font-bold text-foreground flex items-center gap-3 font-futuristic tracking-wider"
                >
                  <div className="p-2 gradient-cosmic rounded-lg shadow-neon-sm">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  IDENTIFICADOR PERSONAL
                </label>

                <div className="hologram-border rounded-2xl">
                  <div className="relative group">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-5 bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all duration-500 placeholder:text-muted-foreground/60 text-foreground font-medium text-lg backdrop-blur-sm"
                      placeholder="alumno@ejemplo.com"
                      disabled={loading}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Eye className="w-5 h-5 text-neon-purple/60 group-focus-within:text-neon-purple transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full relative group overflow-hidden rounded-2xl p-0.5 gradient-aurora transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 slide-up-cosmic stagger-3"
              >
                <div className="relative bg-background rounded-2xl px-8 py-5 transition-all duration-500 group-hover:bg-transparent">
                  <div className="flex items-center justify-center space-x-4">
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
                        <span className="font-futuristic text-lg tracking-wider text-foreground group-hover:text-white transition-colors duration-300">
                          TRANSMITIENDO...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 gradient-neon rounded-lg shadow-neon-sm group-hover:shadow-neon-md transition-all duration-300">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-futuristic text-lg tracking-wider text-foreground group-hover:text-white transition-colors duration-300">
                          INICIAR SECUENCIA
                        </span>
                        <ArrowRight className="w-5 h-5 text-neon-purple group-hover:text-white transition-all duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            </form>

            {mensaje && (
              <div className={`mt-8 p-6 rounded-2xl flex items-start space-x-4 slide-up-cosmic relative overflow-hidden ${messageType === 'success'
                ? 'bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/30'
                : 'bg-gradient-to-r from-red-500/10 via-rose-500/10 to-pink-500/10 border border-red-500/30'
                }`}>
                <div className="relative z-10">
                  <p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-100' : 'text-red-100'}`}>
                    {mensaje}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-12 slide-up-cosmic stagger-4">
            <div className="flex items-center justify-center space-x-3 text-muted-foreground mb-4">
              <div className="w-8 h-0.5 gradient-cosmic rounded-full"></div>
              <Sparkles className="w-5 h-5 text-neon-purple animate-pulse" />
              <p className="text-sm font-futuristic tracking-wider">
                SISTEMA CLIVOX SEGURO
              </p>
              <Sparkles className="w-5 h-5 text-neon-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-8 h-0.5 gradient-neon rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
