import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, ArrowRight, RefreshCcw, CheckCircle2 } from 'lucide-react';

const QRLogin = () => {
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'PENDIENTE' | 'ESCANEADO' | 'AUTORIZADO' | 'EXPIRADO'>('PENDIENTE');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchQR = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/qr/generate`, { method: 'POST' });
            const data = await res.json();
            setToken(data.token);
            setStatus('PENDIENTE');
        } catch (err) {
            console.error("Error generating QR", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQR();
    }, []);

    useEffect(() => {
        if (!token || status === 'AUTORIZADO') return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/qr/status/${token}`);
                const data = await res.json();

                if (data.estado !== status) {
                    setStatus(data.estado);
                    if (data.estado === 'AUTORIZADO') {
                        // Guardar session data y redirigir
                        localStorage.setItem('clivox_user', data.user_id);
                        localStorage.setItem('clivox_org', data.org_id);
                        setTimeout(() => navigate('/dashboard'), 2000);
                    }
                }
            } catch (err) {
                console.error("Error polling status", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [token, status]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-ultra rounded-[2rem] p-8 border border-white/10 shadow-2xl text-center"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg shadow-purple-500/20">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                        Acceso Rápido
                    </h1>
                    <p className="text-slate-400 mb-8">Escanea el código con tu App Clivox para iniciar sesión sin contraseña</p>

                    <div className="bg-white p-6 rounded-3xl inline-block shadow-inner mb-8 relative group">
                        <AnimatePresence mode='wait'>
                            {loading ? (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-64 h-64 flex items-center justify-center"
                                >
                                    <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin" />
                                </motion.div>
                            ) : status === 'AUTORIZADO' ? (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-64 h-64 flex flex-col items-center justify-center text-blue-600"
                                >
                                    <CheckCircle2 className="w-20 h-20 mb-4 animate-bounce" />
                                    <span className="font-bold text-lg">Sincronizado</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="qr"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <QRCodeSVG value={token || ''} size={256} level="H" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-3xl transition-all duration-500 pointer-events-none"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                            <Shield className="w-4 h-4" />
                            <span>Conexión cifrada de punto a punto</span>
                        </div>

                        <button
                            onClick={fetchQR}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors border-b border-transparent hover:border-blue-400/50"
                        >
                            Generar nuevo código
                        </button>
                    </div>
                </motion.div>

                <p className="mt-8 text-slate-500 text-xs text-center uppercase tracking-widest font-mono">
                    Clivox Security Layer v2.0 • Neural Sync Active
                </p>
            </div>
        </div>
    );
};

export default QRLogin;
