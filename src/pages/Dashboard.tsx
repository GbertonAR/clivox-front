import * as React from 'react';
// Clivox Student Hub
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Award,
  Zap,
  ChevronRight,
  User,
  LogOut,
  Download
} from 'lucide-react';
import { useTheme } from '../components/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { config } = useTheme();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 p-6 md:p-12">
      {/* Top Navbar */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
            <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{config.orgName}</h1>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Portal del Alumno</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 glass-ultra px-4 py-2 rounded-2xl border border-white/5">
            <User size={18} className="text-slate-400" />
            <span className="text-sm font-medium">Cadete Pro</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-2xl transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-ultra rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Hola de nuevo.</h2>
              <p className="text-slate-400 max-w-md mb-8">Tienes <span className="text-white font-bold">1 evaluación pendiente</span> para completar tu certificación avanzada.</p>

              <button
                onClick={() => navigate('/examen-ia/1')}
                className="bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
              >
                Comenzar Evaluación IA
                <Zap size={18} fill="currentColor" />
              </button>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          </motion.div>

          {/* Courses List Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <BookOpen size={20} className="text-blue-400" />
                Mis Capacitaciones
              </h3>
              <button className="text-sm text-slate-500 hover:text-slate-300 transition-all font-mono">VER TODAS</button>
            </div>

            <div className="grid gap-4">
              {[
                { title: 'Protocolos ACS v2', dur: '2h 30m', status: 'En progreso', progress: 65, color: '#3b82f6' },
                { title: 'Seguridad en Redes PWA', dur: '4h 15m', status: 'Por empezar', progress: 0, color: '#8b5cf6' }
              ].map((course, i) => (
                <div key={i} className="glass-ultra p-6 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${course.color}10`, color: course.color }}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{course.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                        <span>{course.dur}</span>
                        <span>•</span>
                        <span>{course.status}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-700 group-hover:text-slate-400 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Achievements / Certificates */}
          <div className="glass-ultra rounded-[2.5rem] p-8 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold flex items-center gap-3">
                <Award size={20} className="text-amber-400" />
                Certificados
              </h3>
              <span className="text-xs font-mono text-slate-500">3 TOTAL</span>
            </div>

            <div className="space-y-6">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
                    <Award size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none mb-1">Especialista en IA</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Emitido May 2025</p>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300">
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 p-4 border border-slate-700/50 rounded-2xl text-xs font-mono tracking-widest hover:bg-white/5 transition-all">
              VER REPOSITORIO COMPLETO
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-ultra p-6 rounded-3xl border border-white/5 text-center">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 text-center">Puntaje Promedio</p>
              <p className="text-2xl font-bold text-center">92%</p>
            </div>
            <div className="glass-ultra p-6 rounded-3xl border border-white/5 text-center">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 text-center">Horas de Estudio</p>
              <p className="text-2xl font-bold text-center text-center">45h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
