import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Trophy, Download, ArrowRight, BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface Opcion {
    id: number;
    texto: string;
}

interface Pregunta {
    id: number;
    enunciado: string;
    tipo: string;
    opciones: Opcion[];
}

const Examen: React.FC = () => {
    const { idCapacitacion } = useParams<{ idCapacitacion: string }>();
    // Para demo, usamos un ID de usuario harcodeado o de localStorage
    const userId = localStorage.getItem('clivox_user_id') || 'USER_DEMO_123';

    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<Record<number, number>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<{ puntaje: number; aprobado: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8000/lms/examen/${idCapacitacion}`)
            .then(res => res.json())
            .then(data => {
                setPreguntas(data);
                setLoading(false);
            });
    }, [idCapacitacion]);

    const handleSelectOption = (preguntaId: number, opcionId: number) => {
        setRespuestas({ ...respuestas, [preguntaId]: opcionId });
    };

    const handleSubmit = async () => {
        const payload = {
            id_usuario: userId,
            id_capacitacion: Number(idCapacitacion),
            respuestas: Object.entries(respuestas).map(([pId, oId]) => ({
                id_usuario: userId,
                id_pregunta: Number(pId),
                id_opcion_seleccionada: oId
            }))
        };

        const res = await fetch('http://localhost:8000/lms/examen/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            setResult(data);
            setIsFinished(true);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-blue-400">Preparando examen...</div>;

    if (isFinished && result) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-center py-10 px-6 backdrop-blur-xl">
                    <div className="flex justify-center mb-6">
                        {result.aprobado ? (
                            <div className="p-4 bg-emerald-500/20 rounded-full">
                                <Trophy className="text-emerald-400" size={60} />
                            </div>
                        ) : (
                            <div className="p-4 bg-red-500/20 rounded-full">
                                <XCircle className="text-red-400" size={60} />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-3xl mb-2 text-white">
                        {result.aprobado ? '¡Felicidades!' : 'Sigue practicando'}
                    </CardTitle>
                    <p className="text-slate-400 mb-6">
                        Tu puntaje final es de <span className="text-blue-400 font-bold text-2xl">{result.puntaje}%</span>
                    </p>

                    {result.aprobado ? (
                        <Button
                            onClick={() => window.open(`http://localhost:8000/lms/certificado/${userId}/${idCapacitacion}`, '_blank')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 flex gap-2 py-6 rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            <Download size={20} />
                            Descargar Certificado
                        </Button>
                    ) : (
                        <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 flex gap-2">
                            Reintentar Examen
                        </Button>
                    )}
                </Card>
            </div>
        );
    }

    const currentPregunta = preguntas[currentStep];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <BrainCircuit size={18} />
                            <span className="text-sm font-mono tracking-widest uppercase">Evaluación de Conocimientos</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-100">Examen Final</h1>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 text-sm">Progreso</span>
                        <div className="text-xl font-bold text-blue-400">{currentStep + 1} / {preguntas.length}</div>
                    </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full mb-12 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]"
                        style={{ width: `${((currentStep + 1) / preguntas.length) * 100}%` }}
                    ></div>
                </div>

                {currentPregunta && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl text-slate-200 leading-relaxed font-medium">
                            {currentPregunta.enunciado}
                        </h2>

                        <div className="grid gap-4">
                            {currentPregunta.opciones.map((opc) => (
                                <button
                                    key={opc.id}
                                    onClick={() => handleSelectOption(currentPregunta.id, opc.id)}
                                    className={`
                    flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 text-left
                    ${respuestas[currentPregunta.id] === opc.id
                                            ? 'bg-blue-600/10 border-blue-500 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
                                        }
                  `}
                                >
                                    <span className="text-lg">{opc.texto}</span>
                                    {respuestas[currentPregunta.id] === opc.id && (
                                        <CheckCircle2 size={24} className="text-blue-400 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end pt-8">
                            {currentStep < preguntas.length - 1 ? (
                                <Button
                                    disabled={!respuestas[currentPregunta.id]}
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 py-6 text-lg flex gap-2 group"
                                >
                                    Siguiente
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    disabled={Object.keys(respuestas).length < preguntas.length}
                                    onClick={handleSubmit}
                                    className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-12 py-6 text-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    Finalizar y Calificar
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Examen;
