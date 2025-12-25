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
import { clivoxTheme } from '../clivoxTheme'

import { Edit3, Users, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const ACS_ENDPOINT = import.meta.env.VITE_ACS_ENDPOINT || ''
const GROUP_ID = 'b8b0f4c3-5eaa-4f9b-93a5-000000000000'

const ACSCliente: React.FC = () => {
  const [adapter, setAdapter] = useState<CallAdapter>()
  const [error, setError] = useState<string | null>(null)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [whiteboardImage, setWhiteboardImage] = useState<string | null>(null)
  const isInitializing = useRef(false)

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
          displayName: 'Alumno',
          credential,
          locator: { groupId: GROUP_ID },
          endpointUrl: ACS_ENDPOINT,
          callCompositeOptions: { callControls: { callSurvey: false } }
        });

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

    initAdapter();

    return () => {
      disposed = true;
      if (adapter) {
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

  if (error) return <div className="p-10 text-red-500">{error}</div>
  if (!adapter) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900"><Spinner label="Conectando Secuencia Alumno..." styles={{ label: { color: 'white' } }} /></div>

  return (
    <FluentThemeProvider fluentTheme={clivoxTheme}>
      <div className="h-screen w-screen relative bg-[#1a1a2e] overflow-hidden flex font-sans">

        {/* Global Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#111827]"></div>

        {/* Main Viewport */}
        <div className="flex-1 relative z-10 flex flex-col">
          <div className="flex-1 w-full bg-black/20 backdrop-blur-sm relative rounded-2xl overflow-hidden m-2 border border-white/5 shadow-2xl">
            <CallComposite adapter={adapter} />
          </div>

          <div className="absolute top-6 left-6 z-20 flex items-center gap-4 pointer-events-none">
            <div className="p-3 bg-indigo-950/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
              <img src="/img/logo.png" alt="Logo" className="h-10 text-white" />
            </div>
            <div className="px-3 py-1 bg-indigo-950/60 text-teal-400 text-xs font-bold rounded-full border border-teal-500/30 flex items-center gap-2 backdrop-blur-md">
              <Zap size={12} className="animate-pulse" />
              CLASE EN VIVO
            </div>
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
      </div>
    </FluentThemeProvider>
  )
}

export default ACSCliente
