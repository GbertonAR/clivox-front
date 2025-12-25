import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BrainCircuit,
    Volume2,
    Video,
    Eye,
    AlertTriangle,
    CheckCircle2,
    Trophy,
    Download,
    ArrowRight,
    ShieldCheck,
    Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Opcion {
    id: number;
    texto: string;
}

interface Pregunta {
    id: number;
    enunciado: string;
    tipo: string;
    opciones: Opcion[];
    audio_url?: string;
    video_hint?: string;
}

const AIExamPlayer: React.FC = () => {
    const { idDefinicion } = useParams<{ idDefinicion: string }>();
    const navigate = useNavigate();
    const userId = localStorage.getItem('clivox_user_id') || 'USER_STUDENT_PRO';

    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [respuestas, setRespuestas] = useState<Record<number, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<{ puntaje: number; aprobado: boolean; intento: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [suspicionCount, setSuspicionCount] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // 1. Cargar examen desde backend IA
    useEffect(() => {
        fetch(`http://localhost:8000/lms/examen/ia/obtener/${userId}/${idDefinicion}`)
            .then(res => res.json())
            .then(data => {
                if (data.preguntas) {
                    setPreguntas(data.preguntas);
                }
                setLoading(false);
            });
    }, [idDefinicion, userId]);

    // 2. Proctoring: Tab Visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setSuspicionCount(prev => prev + 1);
                console.warn("User left the exam tab!");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // 3. Proctoring: Camera Activation
    useEffect(() => {
        if (!loading && !isFinished) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setCameraActive(true);
                    }
                })
                .catch(err => console.warn("Camera access denied", err));
        }
    }, [loading, isFinished]);

    // 4. Bloquear Copia y Context Menu
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleCopy = (e: ClipboardEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
        };
    }, []);

    const handleSelectOption = (preguntaId: number, opcionId: number) => {
        setRespuestas({ ...respuestas, [preguntaId]: opcionId });
    };

    const handleSubmit = async () => {
        const payload = {
            id_usuario: userId,
            id_capacitacion: 1, // Placeholder
            id_definicion: Number(idDefinicion),
            respuestas: Object.entries(respuestas).map(([pId, oId]) => ({
                id_usuario: userId,
                id_pregunta: Number(pId),
                id_opcion_seleccionada: oId
            }))
        };

        const res = await fetch('http://localhost:8000/lms/examen/ia/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            setResult(data);
            setIsFinished(true);
            // Detener cámara
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050914] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-mono text-sm animate-pulse tracking-widest">SINCRO DE RED NEURAL...</p>
        </div>
    );

    if (isFinished && result) {
        return (
            <div className="min-h-screen bg-[#050914] flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-xl w-full glass-ultra rounded-[2.5rem] p-12 border border-blue-500/20 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>

                    <div className="flex justify-center mb-8">
                        {result.aprobado ? (
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                                <Trophy className="text-emerald-400 w-12 h-12" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                                <AlertTriangle className="text-red-400 w-12 h-12" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {result.aprobado ? 'Certificación Obtenida' : 'Resultado Insuficiente'}
                    </h2>
                    <p className="text-slate-400 mb-8">Evaluación IA Finalizada • Intento #{result.intento}</p>

                    <div className="text-6xl font-black mb-12 bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {result.puntaje}%
                    </div>

                    {result.aprobado ? (
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20">
                            <Download size={20} />
                            DESCARGAR CERTIFICADO DIGITAL
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full border border-slate-700 text-slate-300 py-4 rounded-2xl hover:bg-slate-800 transition-all font-medium"
                        >
                            REINTENTAR SESIÓN
                        </button>
                    )}
                </motion.div>
            </div>
        );
    }

    const currentPregunta = preguntas[currentStep];

    return (
        <div className="min-h-screen bg-[#050914] text-slate-100 p-6 md:p-12 relative overflow-hidden">
            {/* Proctoring HUD */}
            <div className="fixed top-6 right-6 z-50 space-y-4">
                <div className="glass-ultra rounded-2xl overflow-hidden border border-white/5 w-48 shadow-2xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full aspect-video object-cover ${!cameraActive && 'hidden'}`}
                    />
                    <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Supervisor On</span>
                        </div>
                        <Eye size={12} className="text-slate-500" />
                    </div>
                </div>

                {suspicionCount > 0 && (
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md"
                    >
                        <AlertTriangle className="text-red-500 shrink-0" size={16} />
                        <span className="text-[10px] font-mono text-red-500">ALERTA FOCO: {suspicionCount}</span>
                    </motion.div>
                )}
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 font-mono text-xs tracking-[0.3em]" style={{ color: 'var(--primary-org, #3b82f6)' }}>
                            <ShieldCheck size={16} />
                            MODO FOCUS ACTIVO
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Evaluación IA</h1>
                    </div>

                    <div className="flex items-center gap-6 glass-ultra p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Timer size={20} style={{ color: 'var(--secondary-org, #a855f7)' }} />
                            <div className="text-sm">
                                <span className="text-slate-400 block text-[10px] uppercase font-mono">Progreso</span>
                                <span className="font-bold">{currentStep + 1} de {preguntas.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-900 rounded-full mb-16 overflow-hidden">
                    <motion.div
                        className="h-full"
                        style={{ background: 'linear-gradient(90deg, var(--primary-org, #3b82f6), var(--secondary-org, #8b5cf6))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / preguntas.length) * 100}%` }}
                    />
                </div>

                <AnimatePresence mode='wait'>
                    {currentPregunta && (
                        <motion.div
                            key={currentPregunta.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="space-y-12"
                        >
                            {/* Multimedia Area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {currentPregunta.audio_url && (
                                    <div className="glass-ultra p-6 rounded-3xl border border-blue-500/10 flex items-center gap-4">
                                        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
                                            <Volume2 size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase font-mono mb-2">Escenario de Audio</p>
                                            <audio controls className="w-full h-8 opacity-60">
                                                <source src={currentPregunta.audio_url} />
                                            </audio>
                                        </div>
                                    </div>
                                )}
                                {currentPregunta.video_hint && (
                                    <div className="glass-ultra p-6 rounded-3xl border border-purple-500/10 flex items-center gap-4">
                                        <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400">
                                            <Video size={24} />
                                        </div>
                                        <div className="flex-1 text-sm text-slate-300">
                                            <p className="text-xs text-slate-500 uppercase font-mono mb-1">Referencia Visual</p>
                                            Analiza la situación proyectada
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-medium leading-relaxed max-w-2xl">
                                {currentPregunta.enunciado}
                            </h2>

                            <div className="grid gap-4 max-w-2xl">
                                {currentPregunta.opciones.map((opc, idx) => (
                                    <button
                                        key={opc.id}
                                        onClick={() => handleSelectOption(currentPregunta.id, opc.id)}
                                        className={`
                                            group flex items-center gap-6 p-6 rounded-[1.5rem] border-2 transition-all duration-300 text-left relative overflow-hidden
                                            ${respuestas[currentPregunta.id] === opc.id
                                                ? 'bg-blue-600/10 border-blue-500 text-blue-50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                                                : 'bg-[#0a0f1d] border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <span className="text-xs font-mono font-bold w-10 h-10 rounded-xl border border-current flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-lg font-medium">{opc.texto}</span>
                                        {respuestas[currentPregunta.id] === opc.id && (
                                            <motion.div layoutId="check" className="ml-auto">
                                                <CheckCircle2 size={24} className="text-blue-400 shrink-0" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                <div className="text-xs text-slate-500 font-mono italic">
                                    Seguridad Clivox: No se permite navegar fuera de esta pestaña.
                                </div>
                                {currentStep < preguntas.length - 1 ? (
                                    <button
                                        disabled={!respuestas[currentPregunta.id]}
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:scale-100 text-white rounded-2xl px-10 py-5 font-bold flex gap-2 transition-all active:scale-95 group"
                                    >
                                        SIGUIENTE
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        disabled={Object.keys(respuestas).length < preguntas.length}
                                        onClick={handleSubmit}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.02] text-white rounded-2xl px-12 py-5 font-black tracking-widest transition-all active:scale-95"
                                    >
                                        FINALIZAR EVALUACIÓN
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Background Aesthetic */}
            <div className="fixed bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none -z-10"></div>
            <div className="fixed -top-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        </div>
    );
};

export default AIExamPlayer;
