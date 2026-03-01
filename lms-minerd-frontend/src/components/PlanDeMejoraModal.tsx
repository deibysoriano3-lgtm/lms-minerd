import React, { useState } from 'react';

export default function PlanDeMejoraModal({ isOpen, onClose, estudiante, actividadOriginal }: any) {
    const [estrategia, setEstrategia] = useState('');
    const [motivo, setMotivo] = useState('');
    const [enviando, setEnviando] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        // Simular POST /api/plan-mejora
        setTimeout(() => {
            setEnviando(false);
            alert('Plan de Mejora registrado en SIGERD. El estudiante ahora puede re-evaluarse.');
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                {/* Header Oficial Minerd */}
                <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Registro de Plan de Mejora Continua</h2>
                        <p className="text-blue-100 text-sm">Normativa de Evaluación Técnico Profesional MINERD</p>
                    </div>
                    <button onClick={onClose} className="text-blue-200 hover:text-white transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Info del Estudiante Bloqueada */}
                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase">Estudiante</label>
                            <div className="font-medium text-slate-900">{estudiante?.nombre || 'Carlos Manuel Peña'}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase">ID SIGERD</label>
                            <div className="font-mono text-slate-700">{estudiante?.sigerd || 'SIG-104-20H'}</div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase">Debilidad Identificada en:</label>
                            <div className="text-sm text-slate-700">{actividadOriginal?.nombre || 'RA2 - Diagnóstico de Fallas (Calificación: Iniciado)'}</div>
                        </div>
                    </div>

                    {/* Formulario de Acción Pedagógica */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Justificación Pedagógica</label>
                            <textarea
                                required
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Ej. El estudiante no identificó los códigos de error BIOS adecuadamente durante la práctica."
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estrategia de Recuperación (¿Qué hará el estudiante?)</label>
                            <textarea
                                required
                                value={estrategia}
                                onChange={(e) => setEstrategia(e.target.value)}
                                placeholder="Ej. Asignación de investigación sobre códigos Post Beep y simulación asistida de 2 horas en el laboratorio."
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                rows={3}
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-3 items-start">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p>Al guardar este Plan de Mejora, se desbloqueará la capacidad de actualizar la nota del estudiante en el sistema de calificaciones general.</p>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={enviando}
                            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition flex items-center gap-2
                ${enviando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {enviando ? 'Aperturando Plan...' : 'Crear Plan de Mejora Oficial'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
