import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2, Key, Zap, Lock, Cpu, Wifi } from "lucide-react";

const ValidarCodigo: React.FC = () => {
    const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const email = searchParams.get('email');

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleInputChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const newCodigo = [...codigo];
        newCodigo[index] = alphanumericValue;
        setCodigo(newCodigo);

        if (alphanumericValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !codigo[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
        const newCodigo = [...codigo];
        for (let i = 0; i < 6; i++) {
            newCodigo[i] = pastedData[i] || '';
        }
        setCodigo(newCodigo);
        const nextEmptyIndex = newCodigo.findIndex(char => !char);
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        inputRefs.current[focusIndex]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const codigoCompleto = codigo.join('');

        if (codigoCompleto.length !== 6) {
            setMensaje("Ingresa el código completo de 6 caracteres.");
            setMessageType('error');
            return;
        }

        setMensaje("");
        setLoading(true);
        setMessageType(null);

        try {
            const response = await fetch("http://localhost:8000/auth/validar-codigo_acs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, codigo: codigoCompleto }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setMensaje("✅ Código correcto. Redirigiendo...");
                setMessageType('success');

                // Guardar cookie como en el admin
                if (data.usuario_id) {
                    document.cookie = `usuario_id=${data.usuario_id}; path=/; max-age=86400`;
                }

                // Lógica de redirección basada en ROL solicitado por el usuario
                setTimeout(() => {
                    if (data.id_rol === 5) {
                        navigate('/acs-instructor');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1500);
            } else {
                setMensaje(data.error || "❌ Código incorrecto.");
                setMessageType('error');
            }
        } catch (err) {
            console.error("Error al validar el código:", err);
            setMensaje("❌ Error de red. Inténtalo nuevamente.");
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const reenviarCodigo = async () => {
        setMensaje("");
        setLoading(true);
        setMessageType(null);

        try {
            const response = await fetch("http://localhost:8000/auth/enviar-codigo_acs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setMensaje("Nueva secuencia neural transmitida.");
                setMessageType('success');
                setCodigo(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                setMensaje("Error en la retransmisión.");
                setMessageType('error');
            }
        } catch (error) {
            setMensaje("Interferencia en la red detectada.");
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden particles-bg">
            <div className="absolute inset-0 bg-mesh-cosmic opacity-40"></div>
            <div className="absolute inset-0 bg-neural-network opacity-20"></div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="text-center mb-12 slide-up-cosmic">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <div className="absolute w-32 h-32 hologram-border rounded-full rotate-hologram opacity-60">
                                <div className="w-full h-full bg-transparent rounded-full"></div>
                            </div>
                            <div className="relative w-24 h-24 gradient-cosmic rounded-2xl p-0.5 pulse-neon">
                                <div className="flex items-center justify-center w-full h-full bg-background rounded-2xl">
                                    <Lock className="w-12 h-12 text-neon-purple drop-shadow-lg" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-6xl font-futuristic gradient-text-cosmic mb-4 text-glow-neon">
                            CLIVOX SCAN
                        </h1>
                        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-2xl px-6 py-3">
                            <Wifi className="w-5 h-5 text-neon-blue animate-pulse" />
                            <span className="font-mono text-neon-purple font-bold tracking-wider">
                                {email}
                            </span>
                        </div>
                    </div>

                    <div className="glass-ultra rounded-3xl p-8 shadow-neon-xl scale-in-cosmic stagger-1">
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-6 slide-up-cosmic stagger-2">
                                <label className="text-sm font-bold text-foreground flex items-center justify-center gap-3 font-futuristic tracking-wider">
                                    <div className="p-2 gradient-cosmic rounded-lg shadow-neon-sm">
                                        <Key className="w-4 h-4 text-white" />
                                    </div>
                                    SECUENCIA CLIVOX ALFANUMÉRICA
                                </label>

                                <div className="flex justify-center space-x-4">
                                    {codigo.map((char, index) => (
                                        <div key={index} className="relative group">
                                            <div className="absolute inset-0 hologram-border rounded-2xl opacity-60 group-focus-within:opacity-100 transition-opacity duration-300">
                                                <div className="w-full h-full bg-transparent rounded-2xl"></div>
                                            </div>
                                            <input
                                                ref={(el) => inputRefs.current[index] = el}
                                                type="text"
                                                maxLength={1}
                                                value={char}
                                                onChange={(e) => handleInputChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                onPaste={handlePaste}
                                                className="relative z-10 w-16 h-20 text-center text-2xl font-bold font-mono bg-transparent border-0 rounded-2xl focus:outline-none text-foreground uppercase tracking-widest"
                                                disabled={loading}
                                                placeholder="●"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || codigo.some(char => !char)}
                                className="w-full relative group overflow-hidden rounded-2xl p-0.5 gradient-aurora transition-all duration-500 hover:scale-[1.02] focus:outline-none disabled:opacity-50"
                            >
                                <div className="relative bg-background rounded-2xl px-8 py-6 transition-all duration-500 group-hover:bg-transparent text-center">
                                    <div className="flex items-center justify-center space-x-4 font-futuristic tracking-wider">
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
                                        ) : (
                                            <>
                                                <Cpu className="w-5 h-5 text-neon-purple" />
                                                <span>VALIDAR SECUENCIA</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </form>

                        {mensaje && (
                            <div className={`mt-8 p-6 rounded-2xl text-center font-futuristic ${messageType === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {mensaje}
                            </div>
                        )}

                        <div className="mt-8 flex flex-col space-y-4">
                            <button onClick={reenviarCodigo} className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" /> REENVIAR CÓDIGO
                            </button>
                            <button onClick={() => navigate('/login')} className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> VOLVER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidarCodigo;
