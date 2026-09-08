import { useState, useEffect } from 'react';
import { Heart, GraduationCap, BookOpen, AlertTriangle, Star, ChevronDown, ChevronUp, User } from 'lucide-react';
import api from '../api';

export default function FamiliaPortal() {
    const [perfil, setPerfil] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedModulo, setExpandedModulo] = useState<number | null>(null);

    useEffect(() => {
        api.get('/api/familia/mi-perfil')
            .then(r => {
                if (r.data.message) setError(r.data.message);
                else setPerfil(r.data);
            })
            .catch(() => setError('No se pudo conectar con el servidor'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-64 text-slate-400">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Cargando información...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="max-w-lg mx-auto mt-16 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-rose-700 font-medium">{error}</p>
        </div>
    );

    const estudiante = perfil?.estudiante;
    const nombreEstudiante = estudiante?.usuario?.nombre_completo ?? 'N/D';
    const carrera = estudiante?.carrera_actual?.nombre ?? 'Sin carrera asignada';
    const estado = estudiante?.estado_academico ?? 'ACTIVO';
    const calificacionesRa: any[] = estudiante?.calificaciones_ra ?? [];
    const anecdotas: any[] = estudiante?.anecdotas ?? [];
    const fct: any[] = estudiante?.evaluaciones_fct ?? [];

    const estadoColor: Record<string, string> = {
        ACTIVO: 'bg-emerald-100 text-emerald-700',
        INACTIVO: 'bg-slate-100 text-slate-600',
        GRADUADO: 'bg-blue-100 text-blue-700',
        SUSPENDIDO: 'bg-rose-100 text-rose-700',
    };

    const modulosMap = new Map<number, { nombre: string; evaluaciones: any[] }>();
    calificacionesRa.forEach(ev => {
        const id = ev.resultado_aprendizaje?.modulo?.id;
        const nombre = ev.resultado_aprendizaje?.modulo?.nombre ?? 'Módulo desconocido';
        if (id && !modulosMap.has(id)) modulosMap.set(id, { nombre, evaluaciones: [] });
        if (id) modulosMap.get(id)!.evaluaciones.push(ev);
    });
    const modulos = Array.from(modulosMap.entries());

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white">
                    <Heart className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Portal Familiar</h1>
                    <p className="text-sm text-slate-500">Parentesco: <span className="font-medium capitalize">{perfil?.parentesco?.toLowerCase() ?? 'Tutor'}</span></p>
                </div>
            </div>

            {/* Tarjeta del estudiante */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                        <User className="w-7 h-7 text-slate-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-slate-800">{nombreEstudiante}</h2>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${estadoColor[estado] ?? 'bg-slate-100 text-slate-600'}`}>
                                {estado}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" /> {carrera}
                        </p>
                        {estudiante?.rne && (
                            <p className="text-xs text-slate-400 mt-0.5">RNE: {estudiante.rne}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Calificaciones por módulo */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-rose-500" /> Calificaciones por Módulo
                </h3>
                {modulos.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
                        No hay calificaciones registradas aún.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {modulos.map(([id, modulo]) => {
                            const notas = modulo.evaluaciones.map((e: any) => e.calificacion_final ?? 0);
                            const promedio = notas.length ? (notas.reduce((a: number, b: number) => a + b, 0) / notas.length).toFixed(1) : '—';
                            const open = expandedModulo === id;
                            return (
                                <div key={id} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedModulo(open ? null : id)}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <span className="font-semibold text-slate-700 text-sm">{modulo.nombre}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${Number(promedio) >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Prom. {promedio}
                                            </span>
                                            {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </button>
                                    {open && (
                                        <div className="border-t border-slate-100 bg-slate-50 p-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                                                        <th className="text-left pb-2">Resultado de Aprendizaje</th>
                                                        <th className="text-center pb-2">Nota</th>
                                                        <th className="text-center pb-2">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {modulo.evaluaciones.map((ev: any, i: number) => (
                                                        <tr key={i} className="border-b border-slate-100 last:border-0">
                                                            <td className="py-2 text-slate-600">{ev.resultado_aprendizaje?.descripcion ?? `RA ${i + 1}`}</td>
                                                            <td className="py-2 text-center font-bold text-slate-800">{ev.calificacion_final ?? '—'}</td>
                                                            <td className="py-2 text-center">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(ev.calificacion_final ?? 0) >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                    {(ev.calificacion_final ?? 0) >= 70 ? 'Aprobado' : 'No aprobado'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Anotaciones */}
            {anecdotas.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Registro Anecdótico
                    </h3>
                    <div className="space-y-3">
                        {anecdotas.map((a: any, i: number) => (
                            <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{a.tipo}</span>
                                    <span className="text-xs text-slate-400">{new Date(a.fecha_registro).toLocaleDateString('es-DO')}</span>
                                </div>
                                <p className="text-sm text-slate-700">{a.incidencia}</p>
                                {a.docente?.usuario?.nombre_completo && (
                                    <p className="text-xs text-slate-400 mt-1">Registrado por: {a.docente.usuario.nombre_completo}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FCT */}
            {fct.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-500" /> Formación en Centros de Trabajo (FCT)
                    </h3>
                    <div className="space-y-3">
                        {fct.map((f: any, i: number) => (
                            <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="font-semibold text-slate-700">{f.empresa?.nombre ?? 'Empresa'}</p>
                                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                    <span>Horas: <b>{f.horas_completadas ?? 0}</b></span>
                                    <span>Nota: <b>{f.calificacion_final ?? '—'}</b></span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{f.estado}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
