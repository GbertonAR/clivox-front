import { Link } from 'react-router-dom';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden particles-bg flex items-center justify-center p-4">
      {/* Fondos y efectos Quantum */}
      <div className="absolute inset-0 bg-mesh-cosmic opacity-40"></div>
      <div className="absolute inset-0 bg-neural-network opacity-10"></div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="slide-up-cosmic mb-12">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute w-40 h-40 hologram-border rounded-full rotate-hologram opacity-60"></div>
            <div className="relative w-32 h-32 gradient-cosmic rounded-3xl p-0.5 pulse-neon">
              <div className="flex items-center justify-center w-full h-full bg-background rounded-3xl">
                <Zap className="w-16 h-16 text-neon-purple drop-shadow-lg" />
              </div>
            </div>
          </div>

          <h1 className="text-7xl font-futuristic gradient-text-cosmic mb-6 text-glow-neon">
            CLIVOX
          </h1>
          <p className="text-2xl font-medium text-foreground/90 mb-8 max-w-lg mx-auto leading-relaxed">
            Comunicaciones inteligentes potenciadas por IA y Azure Communication Services
          </p>
        </div>

        <div className="grid gap-6 slide-up-cosmic stagger-2 place-items-center">
          <Link to="/login" className="w-full max-w-sm">
            <button className="w-full relative group overflow-hidden rounded-2xl p-0.5 gradient-aurora transition-all duration-500 hover:scale-[1.05] shadow-neon-lg">
              <div className="relative bg-background rounded-2xl px-12 py-6 transition-all duration-500 group-hover:bg-transparent flex items-center justify-center gap-4">
                <span className="font-futuristic text-xl tracking-tighter text-foreground group-hover:text-white transition-colors duration-300">
                  INICIAR EXPERIENCIA
                </span>
                <ArrowRight className="w-6 h-6 text-neon-purple group-hover:text-white transition-transform group-hover:translate-x-2" />
              </div>
            </button>
          </Link>

          <div className="flex items-center gap-4 text-muted-foreground/60 font-mono text-sm mt-8">
            <div className="w-12 h-1 bg-gradient-to-r from-transparent to-neon-blue rounded-full"></div>
            <Sparkles className="w-4 h-4 text-neon-purple animate-pulse" />
            <span>PROTOCOLO VISIOMIX ACTIVO</span>
            <Sparkles className="w-4 h-4 text-neon-blue animate-pulse" />
            <div className="w-12 h-1 bg-gradient-to-l from-transparent to-neon-pink rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
