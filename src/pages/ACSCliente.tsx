import * as React from 'react'
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

// Initialize icons once
if (!(window as any).__clivox_icons_initialized) {
  initializeIcons(undefined, { disableWarnings: true });
  (window as any).__clivox_icons_initialized = true;
}

import { Edit3, Users, X, Zap, User, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const ACS_ENDPOINT = import.meta.env.VITE_ACS_ENDPOINT || ''
const GROUP_ID = 'b8b0f4c3-5eaa-4f9b-93a5-000000000000'

const ACSCliente: React.FC = () => {
  const [adapter, setAdapter] = useState<CallAdapter>()
  const [error, setError] = useState<string | null>(null)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [whiteboardImage, setWhiteboardImage] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ nombre: string; rol: string } | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [needsBiometrics, setNeedsBiometrics] = useState(false)
  const [biometricCaptured, setBiometricCaptured] = useState(false)
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'fail'>('idle')
  const isInitializing = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let disposed = false;

    // Si ya tenemos adapter, no hacemos nada (evita doble init)
    if (adapter) return;

    const initAdapter = async () => {
      // REMOVED REF LOCK
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/acs/token`, { method: 'POST' });
        const data = await res.json();

        if (disposed) return;

        if (!data.token || !data.user_id) {
          setError('No se pudo obtener token de ACS para Alumno.');
          return;
        }

        const userId: CommunicationUserIdentifier = { communicationUserId: data.user_id };
        const credential = new AzureCommunicationTokenCredential(data.token);

        const newAdapter = await createAzureCommunicationCallAdapter({
          userId,
          displayName: profile?.nombre || 'Alumno',
          credential,
          locator: { groupId: GROUP_ID }
        });

        // NOTA: startVideo() no es un método directo del adapter, se maneja vía Call agent
        // o dejando que el Composite lo maneje con callControls.

        if (!disposed) {
          setAdapter(newAdapter);
          registrarEvento(data.user_id, "call_started");

          const syncParticipant = async () => {
            try {
              const stateRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/videocall/state/${GROUP_ID}`);
              const stateData = await stateRes.json();
              const currentParticipants = stateData.participantes_activos ? JSON.parse(stateData.participantes_activos) : [];

              const alreadyExists = currentParticipants.find((p: any) => p.uid === data.user_id);
              if (!alreadyExists) {
                currentParticipants.push({ uid: data.user_id, name: 'Alumno', status: 'active' });
                await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/videocall/state/sync`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sala_id: GROUP_ID,
                    participantes_activos: JSON.stringify(currentParticipants)
                  })
                });
              }

              if (stateData.whiteboard_data) {
                const wb = JSON.parse(stateData.whiteboard_data);
                setWhiteboardImage(wb.image);
              }
            } catch (e) { /* silent error */ }
          };

          const interval = setInterval(syncParticipant, 3000);
          syncParticipant();

          return () => {
            clearInterval(interval);
          };
        } else {
          newAdapter.dispose();
        }
      } catch (err) {
        if (!disposed) setError('Error inicializando ACS. Ver consola.');
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/mi-perfil_acs`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) { console.error("Error fetching profile:", err); }
    };

    initAdapter();
    fetchProfile();

    return () => {
      disposed = true;
      if (adapter) {
        adapter.dispose();
      }
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (needsBiometrics && !biometricCaptured) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(err => console.error("[Biometria] Error al acceder a cámara:", err));
    }
  }, [needsBiometrics, biometricCaptured]);

  const captureAndVerify = async () => {
    setBiometricStatus('scanning');

    // Capturar frame del video
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/jpeg');

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/lms/biometria/verificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: profile?.nombre || "mock_user",
            curso_id: 1,
            image_data: imageData
          })
        });
        const result = await res.json();

        if (result.status === 'success') {
          setBiometricStatus('success');
          setTimeout(() => {
            setBiometricCaptured(true);
            setNeedsBiometrics(false);
            // El useEffect de initAdapter maneja el reinicio si el adapter es null
            // Pero aquí forzamos o re-disparamos si es necesario
            window.location.reload(); // Forma más simple de re-iniciar el flujo post-biometría por ahora
          }, 1500);
        } else {
          setBiometricStatus('fail');
        }
      } catch (e) {
        setBiometricStatus('fail');
      }
    }
  };

  useEffect(() => {
    if (adapter) {
      const onCallEnded = () => {
        console.log("[ACS] Client: Call ended event received. Redirecting...");
        window.location.href = '/dashboard';
      };
      adapter.on('callEnded', onCallEnded);
      return () => {
        adapter.off('callEnded', onCallEnded);
      };
    }
  }, [adapter]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Solo registrar si NO está compartiendo pantalla
        const isSharing = adapter?.getState()?.call?.isScreenSharingOn;
        if (!isSharing) {
          console.log("[ACS] Alumno cambió de pestaña o minimizó. Registrando evento...");
          const userId = adapter?.getState()?.userId;
          if (userId) {
            registrarEvento((userId as any).communicationUserId, "tab_hidden");
            setShowWarning(true);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [adapter]);

  const registrarEvento = (userId: string, evento: string) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/llamada/evento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, sala_id: GROUP_ID, evento })
    })
  }

  if (error) return <div className="p-10 text-red-500">{error}</div>
  if (!adapter) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900"><Spinner label="Conectando Secuencia Alumno..." /></div>

  return (
    <FluentThemeProvider fluentTheme={clivoxTheme}>
      <div className="h-screen w-screen relative bg-[#1a1a2e] overflow-hidden flex font-sans">

        {/* Global Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#111827]"></div>

        {/* Main Viewport */}
        <div className="flex-1 relative z-10 flex flex-col">
          <div className="flex-1 w-full bg-black/20 backdrop-blur-sm relative rounded-2xl overflow-hidden m-2 border border-white/5 shadow-2xl">
            <CallComposite
              adapter={adapter}
              options={{
                callControls: {
                  videoButton: false // Ocultar para que el alumno no la apague
                }
              }}
            />
          </div>

          <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 pointer-events-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-950/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
                <img src="/img/logo.png" alt="Logo" className="h-10 text-white" />
              </div>
              <div className="px-3 py-1 bg-indigo-950/60 text-teal-400 text-xs font-bold rounded-full border border-teal-500/30 flex items-center gap-2 backdrop-blur-md">
                <Zap size={12} className="animate-pulse" />
                CLASE EN VIVO
              </div>
            </div>

            {/* User Profile Display */}
            {profile && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-indigo-950/60 backdrop-blur-md border border-white/10 rounded-2xl pointer-events-auto"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold text-slate-100 truncate">{profile.nombre}</p>
                  <p className="text-[10px] text-teal-400 uppercase tracking-tighter font-mono">{profile.rol}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-10 left-10 z-30">
            <Button
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center gap-3 transition-all hover:scale-105 border border-white/10"
            >
              <Edit3 size={24} />
              <span className="text-lg font-bold tracking-wide">Pizarra</span>
            </Button>
          </div>
        </div>

        {/* Side Panel (Whiteboard Viewer) */}
        <AnimatePresence>
          {showSidePanel && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-[500px] bg-indigo-950/90 backdrop-blur-3xl border-l border-white/10 flex flex-col z-30 shadow-[-30px_0_60px_rgba(0,0,0,0.6)]"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-3 uppercase tracking-widest">
                  <Edit3 size={18} className="text-teal-400" />
                  Pizarra del Instructor
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSidePanel(false)} className="hover:bg-white/10 rounded-full">
                  <X size={24} className="text-slate-400" />
                </Button>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="relative group w-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-2xl min-h-[500px] flex items-center justify-center relative z-10">
                    {whiteboardImage ? (
                      <img src={whiteboardImage} alt="Whiteboard" className="w-full h-auto object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div className="w-12 h-12 border-4 border-slate-300 border-dashed rounded-full animate-spin" />
                        <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">Recibiendo Datos...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="flex items-center justify-center gap-3 text-[10px] text-teal-200/50 uppercase tracking-[0.2em] font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_5px_#2dd4bf]" />
                  Sincronización Neural
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biometric Proctoring Overlay */}
        <AnimatePresence>
          {needsBiometrics && !biometricCaptured && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a1a] backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full p-10 bg-slate-900/50 border border-indigo-500/30 rounded-[40px] text-center shadow-[0_0_100px_rgba(79,70,229,0.2)]"
              >
                <div className="mb-8">
                  <div className="relative inline-block">
                    <div className="w-64 h-64 bg-black rounded-3xl overflow-hidden border-2 border-indigo-500/50 relative">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Scanning Line */}
                      {biometricStatus === 'scanning' && (
                        <motion.div
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_cyan] z-10"
                        />
                      )}
                    </div>
                    <div className="absolute -inset-4 border-2 border-dashed border-indigo-500/20 rounded-[50px] animate-spin-slow" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold font-futuristic gradient-text-cosmic mb-4 uppercase tracking-tighter">
                  Validación Biométrica AI
                </h2>
                <p className="text-slate-400 mb-8 font-medium">
                  {biometricStatus === 'idle' && "Por favor, mira fijamente a la cámara para iniciar el ciclo de formación."}
                  {biometricStatus === 'scanning' && "Analizando red neuronal... No te muevas."}
                  {biometricStatus === 'success' && "Identidad confirmada. Acceso concedido."}
                  {biometricStatus === 'fail' && "Error de validación. Reintenta con mejor iluminación."}
                </p>

                <Button
                  onClick={captureAndVerify}
                  disabled={biometricStatus === 'scanning' || biometricStatus === 'success'}
                  className={`w-full py-8 rounded-3xl font-bold text-lg uppercase tracking-widest transition-all ${biometricStatus === 'success' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)]'
                    }`}
                >
                  {biometricStatus === 'idle' && "Iniciar Captura"}
                  {biometricStatus === 'scanning' && "Analizando..."}
                  {biometricStatus === 'success' && "Cargando Clase..."}
                  {biometricStatus === 'fail' && "Reintentar Validación"}
                </Button>

                <p className="mt-6 text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Sistema Auditor Clivox v1.0 • Azure AI Vision Enabled
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Premium Warning Modal */}
        <AnimatePresence>
          {showWarning && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-indigo-950/90 border border-red-500/50 p-8 rounded-3xl max-w-md w-full mx-4 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center"
              >
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} className="text-red-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Atención Detective</h3>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  El cambio de ventana o pestaña invalida tu ciclo de enfoque.
                  <span className="block mt-2 text-red-400 font-bold">Mantén el foco en la clase para asegurar tu asistencia.</span>
                </p>
                <Button
                  onClick={() => setShowWarning(false)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-bold text-lg"
                >
                  ENTENDIDO, VOLVER AL FOCO
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </FluentThemeProvider>
  )
}

export default ACSCliente
