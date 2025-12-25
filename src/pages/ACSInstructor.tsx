import { useEffect, useState, useRef } from 'react'
import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier
} from '@azure/communication-common'
import {
  CallAdapter,
  createAzureCommunicationCallAdapter,
  CallComposite,
  FluentThemeProvider
} from '@azure/communication-react'
import { Spinner } from '@fluentui/react-components'
import { initializeIcons } from '@fluentui/react/lib/Icons'
import { clivoxTheme } from '../clivoxTheme'

// Initialize all Fluent UI icons once to suppress "icon not registered" warnings
// The check prevents re-initialization on hot module reload
initializeIcons(undefined, { disableWarnings: true })
import { Users, Edit3, Monitor, Zap, Layout, X, Palette, Trash2, Video } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const ACS_ENDPOINT = import.meta.env.VITE_ACS_ENDPOINT || ''
const GROUP_ID = 'b8b0f4c3-5eaa-4f9b-93a5-000000000000'

const ACSInstructor: React.FC = () => {
  const [adapter, setAdapter] = useState<CallAdapter>()
  const [error, setError] = useState<string | null>(null)
  const [showSidePanel, setShowSidePanel] = useState(true)
  const [activeTab, setActiveTab] = useState<'participants' | 'whiteboard'>('participants')
  const [participants, setParticipants] = useState<any[]>([])

  // Whiteboard state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#2dd4bf') // Clivox Teal

  useEffect(() => {
    let disposed = false;

    // Si ya tenemos adapter, no hacemos nada (evita doble init)
    if (adapter) return;

    console.log("[ACS] Effect mounted. Starting init sequence.");

    const initAdapter = async () => {
      try {
        console.log("[ACS] Fetching token from backend...");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/acs/token`, { method: 'POST' });
        console.log("[ACS] Token response received. Status:", res.status);
        const data = await res.json();

        if (disposed) {
          console.warn("[ACS] Component disposed after token fetch. Aborting init.");
          return;
        }

        if (!data.token || !data.user_id) {
          console.error("[ACS] Invalid token data:", data);
          setError('No se pudo obtener token de ACS para instructor.');
          return;
        }

        console.log("[ACS] Valid token received. UserID:", data.user_id);
        console.log("[ACS] Creating ACS Adapter with GROUP_ID:", GROUP_ID);

        const userId: CommunicationUserIdentifier = { communicationUserId: data.user_id };
        const credential = new AzureCommunicationTokenCredential(data.token);

        const newAdapter = await createAzureCommunicationCallAdapter({
          userId,
          displayName: 'Instructor Principal',
          credential,
          locator: { groupId: GROUP_ID },
          endpointUrl: ACS_ENDPOINT,
          callCompositeOptions: { callControls: { callSurvey: false } }
        });

        console.log("[ACS] Adapter created successfully!");

        if (!disposed) {
          console.log("[ACS] Updating state with new adapter.");
          setAdapter(newAdapter);
          registrarEvento(data.user_id, "call_started");

          // Poll participants and whiteboard state
          const interval = setInterval(async () => {
            try {
              const stateRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/videocall/state/${GROUP_ID}`);
              const stateData = await stateRes.json();
              if (stateData.participantes_activos) {
                setParticipants(JSON.parse(stateData.participantes_activos));
              }
            } catch (e) { /* silent poll error */ }
          }, 3000);

          return () => clearInterval(interval);
        } else {
          console.warn("[ACS] Disposed after adapter creation. Disposing adapter immediately.");
          // Si se desmontó mientras creábamos el adapter, lo desechamos
          newAdapter.dispose();
        }
      } catch (err) {
        if (!disposed) {
          console.error("[ACS] Critical Error in initAdapter:", err);
          setError('Error inicializando llamada. Ver consola.');
        }
      }
    };

    initAdapter();

    return () => {
      console.log("[ACS] Cleanup function called (unmount).");
      disposed = true;
      if (adapter) {
        console.log("[ACS] Disposing existing adapter.");
        adapter.dispose();
      }
    };
  }, []); // Remove dependencies to run only once on mount

  const registrarEvento = (userId: string, evento: string) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/llamada/evento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, sala_id: GROUP_ID, evento })
    })
  }

  // Whiteboard Logic
  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  }

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  const stopDrawing = () => {
    setIsDrawing(false);
    syncWhiteboard();
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    syncWhiteboard();
  }

  const syncWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/videocall/state/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sala_id: GROUP_ID,
        whiteboard_data: JSON.stringify({ image: dataUrl })
      })
    });
  }

  return (
    <FluentThemeProvider fluentTheme={clivoxTheme}>
      {error ? (
        <div className="p-10 text-red-500 font-mono text-center flex items-center justify-center h-screen bg-slate-950">
          <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30 backdrop-blur-md">
            {error}
          </div>
        </div>
      ) : !adapter ? (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/30 blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-600/20 blur-[120px] animate-pulse delay-1000" />
          </div>
          <div className="z-10 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400 blur-xl opacity-20 animate-pulse"></div>
              <img src="/img/logo.png" alt="Clivox" className="h-16 relative z-10" />
            </div>
            <Spinner size="large" label="Estableciendo Enlace Seguro..." className="text-white" styles={{ label: { color: 'white', fontSize: '1.1em' } }} />
          </div>
        </div>
      ) : (
        <div className="h-screen w-screen relative bg-[#1a1a2e] overflow-hidden flex font-sans">

          {/* Global Background Gradient - Matching Clivox Identity */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#111827]"></div>

          {/* Main Viewport */}
          <div className="flex-1 relative z-10 flex flex-col">
            {/* ACS Composite - Maximized */}
            <div className="flex-1 w-full bg-black/20 backdrop-blur-sm relative rounded-2xl overflow-hidden m-2 border border-white/5 shadow-2xl">
              <CallComposite adapter={adapter} />
            </div>

            {/* Custom Control Bar (Bottom Centered) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-4 p-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg hover:bg-black/50 transition-colors">
              <Button
                onClick={() => { setShowSidePanel(true); setActiveTab('participants'); }}
                variant="ghost"
                className="rounded-full w-14 h-14 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all border border-white/5 p-0 flex items-center justify-center group"
              >
                <Users size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              </Button>
              <Button
                onClick={() => { setShowSidePanel(true); setActiveTab('whiteboard'); }}
                variant="ghost"
                className="rounded-full w-14 h-14 bg-white/5 hover:bg-teal-500/20 hover:text-teal-300 transition-all border border-white/5 p-0 flex items-center justify-center group"
              >
                <Edit3 size={24} className="text-teal-400 group-hover:scale-110 transition-transform" />
              </Button>
            </div>

            {/* Header / Logo Overlay */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
              <div className="p-3 bg-indigo-950/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
                <img src="/img/logo.png" alt="Logo" className="h-10 text-white" />
              </div>
              <div className="px-4 py-2 bg-indigo-950/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_#2dd4bf]" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">En Vivo</span>
              </div>
            </div>
          </div>

          {/* Side Panel (Glassmorphism) */}
          <AnimatePresence>
            {showSidePanel && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-[400px] bg-indigo-950/80 backdrop-blur-3xl border-l border-white/10 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Panel Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setActiveTab('participants')}
                      className={`relative pb-3 text-sm font-bold tracking-wide transition-colors ${activeTab === 'participants' ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ALUMNOS
                      {activeTab === 'participants' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-400 rounded-t-full shadow-[0_-2px_8px_#818cf8]" />}
                    </button>
                    <button
                      onClick={() => setActiveTab('whiteboard')}
                      className={`relative pb-3 text-sm font-bold tracking-wide transition-colors ${activeTab === 'whiteboard' ? 'text-teal-300' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      PIZARRA
                      {activeTab === 'whiteboard' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-400 rounded-t-full shadow-[0_-2px_8px_#2dd4bf]" />}
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowSidePanel(false)} className="hover:bg-white/10 rounded-full">
                    <X size={20} className="text-slate-400" />
                  </Button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-auto p-6 scrollbar-none">
                  {activeTab === 'participants' ? (
                    <div className="space-y-3">
                      {participants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-400 animate-spin-slow" />
                          <p className="text-sm font-mono text-indigo-200">ESPERANDO CONEXIONES...</p>
                        </div>
                      ) : participants.map((p, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          delay={i * 0.05}
                          key={i}
                          className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white shadow-lg text-sm">
                            {p.name?.[0] || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-100 truncate">{p.name || 'Usuario Anónimo'}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{p.uid}</div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' : 'bg-slate-600'}`} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full gap-4">
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="bg-white rounded-xl overflow-hidden shadow-2xl relative z-10">
                          <canvas
                            ref={canvasRef}
                            width={350}
                            height={450}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="cursor-crosshair bg-white w-full h-full"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex gap-2">
                          {['#2dd4bf', '#8b5cf6', '#f43f5e', '#fbbf24', '#000000'].map(c => (
                            <button
                              key={c}
                              onClick={() => setColor(c)}
                              className={`w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <Button
                          onClick={clearCanvas}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Sincronización Activa</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </FluentThemeProvider>
  )
}

export default ACSInstructor
