import { useState } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';

type EstadoEvaluacion = 'Excelente' | 'Bueno' | 'Suficiente' | 'Deficiente';

interface Criterio {
    id: string;
    descripcion: string;
    calificacion: EstadoEvaluacion | '';
}

const COLOR: Record<string, string> = {
    Excelente: 'bg-emerald-600 text-white border-emerald-600',
    Bueno: 'bg-blue-600 text-white border-blue-600',
    Suficiente: 'bg-amber-500 text-white border-amber-500',
    Deficiente: 'bg-rose-600 text-white border-rose-600',
};

const CRITERIOS_INICIALES: Criterio[] = [
    { id: 'c1', descripcion: 'Puntualidad y asistencia al centro de trabajo.', calificacion: '' },
    { id: 'c2', descripcion: 'Capacidad para trabajar en equipo y seguir instrucciones del supervisor.', calificacion: '' },
    { id: 'c3', descripcion: 'Aplicación de conocimientos técnicos en el área de Informática.', calificacion: '' },
    { id: 'c4', descripcion: 'Cumplimiento de normativas de seguridad e higiene de la empresa.', calificacion: '' },
    { id: 'c5', descripcion: 'Iniciativa y actitud proactiva ante los retos laborales.', calificacion: '' },
];

export default function TutorEmpresarialPortal() {
    const [rne, setRne] = useState('M-LOP-09-02-0001');
    const [horasReportadas, setHorasReportadas] = useState(360);
    const [criterios, setCriterios] = useState<Criterio[]>(CRITERIOS_INICIALES);
    const [comentarios, setComentarios] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleCalificacionChange = (id: string, val: EstadoEvaluacion) => {
        setCriterios(prev => prev.map(c => c.id === id ? { ...c, calificacion: val } : c));
    };

    const completados = criterios.filter(c => c.calificacion !== '').length;
    const porcentaje = Math.round((completados / criterios.length) * 100);

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (criterios.some(c => c.calificacion === '')) {
            setErrorMsg('Por favor califique todos los criterios antes de enviar.');
            return;
        }
        if (!rne.trim()) {
            setErrorMsg('Ingrese el RNE del estudiante pasante.');
            return;
        }

        setEnviando(true);
        try {
            const criteriosMap: Record<string, string> = {};
            criterios.forEach(c => { criteriosMap[c.id] = c.calificacion; });

            await axios.post('http://localhost:3000/api/fct/evaluacion', {
                rne: rne.trim(),
                tutor_empresa: 'Ing. Roberto Sánchez',
                empresa: 'Banco BHD — Dpto. de TI',
                horas_reportadas: horasReportadas,
                criterios: criteriosMap,
                comentarios,
            });

            setExito('✅ Evaluación enviada y registrada en el sistema del Politécnico.');
            setCriterios(CRITERIOS_INICIALES);
            setComentarios('');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setErrorMsg(msg || 'Error al enviar. Verifique el RNE o la conexión con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 text-white border-b-4 border-emerald-500 shadow-lg">
                <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase block mb-1">Formación en Centros de Trabajo</span>
                        <h1 className="text-2xl font-bold">Portal del Tutor Empresarial (FCT)</h1>
                        <p className="text-slate-300 text-sm mt-1">Programa MINERD — Modalidad Técnico Profesional</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-emerald-400">Banco BHD — Dpto. de TI</p>
                        <p className="text-xs text-slate-400 mt-0.5">Tutor: Ing. Roberto Sánchez</p>
                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Período activo 2025-2026
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <form onSubmit={handleEnviar} className="space-y-6">

                    {/* Ficha del Pasante */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">1. Identificación del Pasante</h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0">
                                {rne.charAt(2)}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">RNE del Estudiante Pasante</label>
                                    <input
                                        type="text"
                                        value={rne}
                                        onChange={e => setRne(e.target.value)}
                                        placeholder="Ej: M-LOP-09-02-0001"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">El RNE se encuentra en el carnet del estudiante.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Horas completadas</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={horasReportadas}
                                                onChange={e => setHorasReportadas(Number(e.target.value))}
                                                min={0} max={360}
                                                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-center font-bold text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <span className="text-sm text-slate-400">/ 360 requeridas</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 hidden sm:block">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((horasReportadas / 360) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{Math.round((horasReportadas / 360) * 100)}% completado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rúbrica */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">2. Rúbrica de Desempeño</h2>
                            <span className="text-xs text-slate-500">{completados}/{criterios.length} evaluados</span>
                        </div>
                        {/* barra de progreso de criterios */}
                        <div className="h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }} />
                        </div>

                        <div className="space-y-3">
                            {criterios.map((cr, i) => (
                                <div key={cr.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                                    <div className="flex items-start gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${cr.calificacion ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-slate-700">{cr.descripcion}</p>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                                        {(['Excelente', 'Bueno', 'Suficiente', 'Deficiente'] as EstadoEvaluacion[]).map(nota => (
                                            <button
                                                key={nota}
                                                type="button"
                                                onClick={() => handleCalificacionChange(cr.id, nota)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${cr.calificacion === nota
                                                    ? COLOR[nota]
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                                    }`}
                                            >
                                                {nota}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">3. Observaciones Generales</h2>
                        <textarea
                            value={comentarios}
                            onChange={e => setComentarios(e.target.value)}
                            placeholder="Fortalezas del estudiante, áreas de mejora, recomendaciones al Politécnico..."
                            className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 min-h-[110px] resize-none"
                        />
                    </div>

                    {/* Mensajes */}
                    {exito && (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            {exito}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            Los datos se registran en el sistema del Politécnico en tiempo real.
                        </div>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                        >
                            {enviando
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                                : '✓ Enviar Evaluación Definitiva'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
