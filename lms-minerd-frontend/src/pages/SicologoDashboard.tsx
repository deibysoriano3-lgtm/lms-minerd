import { useState, useEffect, useMemo } from 'react';
import { Brain, Users, FileText, Plus, X, Search, AlertCircle, ChevronDown, ChevronUp, BookOpen, Activity, TrendingUp } from 'lucide-react';
import api from '../api';

type Vista = 'anecdotas' | 'estudiantes';
type FiltroTipo = 'TODOS' | 'CONDUCTUAL' | 'ACADEMICO' | 'POSITIVO' | 'NEGATIVO' | 'NEUTRAL';

const TIPO_ANECDOTA = ['POSITIVO', 'NEGATIVO', 'NEUTRAL', 'CONDUCTUAL', 'ACADEMICO'];

const TIPO_COLOR: Record<string, string> = {
    POSITIVO:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    NEGATIVO:   'bg-rose-100 text-rose-700 border-rose-200',
    NEUTRAL:    'bg-slate-100 text-slate-600 border-slate-200',
    CONDUCTUAL: 'bg-amber-100 text-amber-700 border-amber-200',
    ACADEMICO:  'bg-blue-100 text-blue-700 border-blue-200',
};

const TIPO_ICON: Record<string, string> = {
    POSITIVO: '⭐', NEGATIVO: '⚠️', NEUTRAL: '📝', CONDUCTUAL: '🔔', ACADEMICO: '📚',
};

export default function SicologoDashboard() {
    const [vista, setVista] = useState<Vista>('anecdotas');
    const [anecdotas, setAnecdotas] = useState<any[]>([]);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ estudiante_id: '', incidencia: '', tipo: 'CONDUCTUAL' });
    const [expandedEst, setExpandedEst] = useState<number | null>(null);

    useEffect(() => {
        cargarAnecdotas();
        cargarEstudiantes();
    }, []);

    function cargarAnecdotas() {
        setLoading(true);
        api.get('/api/sicologo/anecdotas')
            .then(r => setAnecdotas(Array.isArray(r.data) ? r.data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }

    function cargarEstudiantes() {
        api.get('/api/sicologo/estudiantes')
            .then(r => setEstudiantes(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
    }

    async function guardarAnecdota() {
        if (!form.estudiante_id || !form.incidencia.trim()) {
            setError('Completa todos los campos requeridos.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await api.post('/api/sicologo/anecdotas', {
                estudiante_id: Number(form.estudiante_id),
                incidencia: form.incidencia,
                tipo: form.tipo,
            });
            setShowModal(false);
            setForm({ estudiante_id: '', incidencia: '', tipo: 'CONDUCTUAL' });
            cargarAnecdotas();
            cargarEstudiantes();
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Error al registrar');
        } finally {
            setSaving(false);
        }
    }

    // ── Estadísticas ──────────────────────────────────────────────
    const stats = useMemo(() => {
        const porTipo: Record<string, number> = {};
        anecdotas.forEach(a => { porTipo[a.tipo] = (porTipo[a.tipo] ?? 0) + 1; });
        const porEstudiante: Record<number, number> = {};
        anecdotas.forEach(a => { porEstudiante[a.estudiante_id] = (porEstudiante[a.estudiante_id] ?? 0) + 1; });
        const masReportados = Object.entries(porEstudiante)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id, count]) => ({
                count,
                nombre: anecdotas.find(a => a.estudiante_id === Number(id))?.estudiante?.usuario?.nombre_completo ?? '—'
            }));
        return { total: anecdotas.length, porTipo, masReportados };
    }, [anecdotas]);

    // ── Filtrado ──────────────────────────────────────────────────
    const anecdotasFiltradas = useMemo(() => {
        return anecdotas.filter(a => {
            const matchTipo = filtroTipo === 'TODOS' || a.tipo === filtroTipo;
            const q = busqueda.toLowerCase();
            const matchBusqueda = !q ||
                a.estudiante?.usuario?.nombre_completo?.toLowerCase().includes(q) ||
                a.incidencia?.toLowerCase().includes(q) ||
                a.docente?.usuario?.nombre_completo?.toLowerCase().includes(q);
            return matchTipo && matchBusqueda;
        });
    }, [anecdotas, filtroTipo, busqueda]);

    const estudiantesFiltrados = useMemo(() => {
        const q = busqueda.toLowerCase();
        return estudiantes.filter(e =>
            e.usuario?.nombre_completo?.toLowerCase().includes(q) ||
            e.rne?.toLowerCase().includes(q)
        );
    }, [estudiantes, busqueda]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* ── Encabezado ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Orientación Escolar</h1>
                        <p className="text-sm text-slate-500">Registros anecdóticos y seguimiento estudiantil</p>
                    </div>
                </div>
                {vista === 'anecdotas' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nueva Anotación
                    </button>
                )}
            </div>

            {/* ── Panel de estadísticas ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-teal-500" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-400 mt-0.5">registros</p>
                </div>
                {(['CONDUCTUAL', 'ACADEMICO', 'NEGATIVO'] as const).map(t => (
                    <div key={t} className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${filtroTipo === t ? 'ring-2 ring-teal-400' : 'bg-white border-slate-200 hover:border-teal-200'}`}
                        onClick={() => setFiltroTipo(f => f === t ? 'TODOS' : t)}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{TIPO_ICON[t]}</span>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{t}</p>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{stats.porTipo[t] ?? 0}</p>
                        <p className="text-xs text-slate-400 mt-0.5">casos</p>
                    </div>
                ))}
            </div>

            {/* Estudiantes más reportados */}
            {stats.masReportados.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Estudiantes con más registros</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.masReportados.map((e, i) => (
                            <span key={i} className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
                                <span className="font-black text-amber-600">{e.count}</span> {e.nombre}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {([
                    { id: 'anecdotas', label: 'Anotaciones', icon: FileText },
                    { id: 'estudiantes', label: 'Estudiantes', icon: Users },
                ] as const).map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setVista(t.id); setBusqueda(''); setFiltroTipo('TODOS'); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === t.id ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        {t.id === 'anecdotas' && anecdotas.length > 0 && (
                            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{anecdotas.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Buscador + filtros tipo ── */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={vista === 'anecdotas' ? 'Buscar por estudiante, docente o descripción...' : 'Buscar por nombre o RNE...'}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                </div>
                {vista === 'anecdotas' && (
                    <div className="flex flex-wrap gap-1.5">
                        {(['TODOS', ...TIPO_ANECDOTA] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFiltroTipo(t as FiltroTipo)}
                                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${filtroTipo === t
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : t === 'TODOS' ? 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                    : `${TIPO_COLOR[t]} hover:opacity-80`
                                }`}
                            >
                                {t === 'TODOS' ? 'Todos' : `${TIPO_ICON[t]} ${t}`}
                                {t !== 'TODOS' && stats.porTipo[t] ? ` (${stats.porTipo[t]})` : ''}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* ── Vista: Anotaciones ── */}
            {vista === 'anecdotas' && !loading && (
                <div className="space-y-3">
                    {anecdotasFiltradas.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                            {filtroTipo !== 'TODOS'
                                ? `No hay anotaciones de tipo ${filtroTipo}.`
                                : 'No hay anotaciones registradas.'}
                        </div>
                    ) : anecdotasFiltradas.map((a: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-bold text-slate-800">{a.estudiante?.usuario?.nombre_completo ?? 'Estudiante desconocido'}</p>
                                        {a.estudiante?.carrera_actual?.nombre && (
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                {a.estudiante.carrera_actual.nombre}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {a.docente?.usuario?.nombre_completo
                                            ? <><BookOpen className="w-3 h-3 inline mr-1" />Docente: <span className="font-semibold text-slate-500">{a.docente.usuario.nombre_completo}</span> · </>
                                            : <><Brain className="w-3 h-3 inline mr-1" /><span className="font-semibold text-slate-500">Orientación</span> · </>
                                        }
                                        {new Date(a.fecha_registro).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${TIPO_COLOR[a.tipo] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {TIPO_ICON[a.tipo]} {a.tipo}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">{a.incidencia}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Vista: Estudiantes ── */}
            {vista === 'estudiantes' && !loading && (
                <div className="space-y-3">
                    {estudiantesFiltrados.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                            No se encontraron estudiantes.
                        </div>
                    ) : estudiantesFiltrados.map((e: any) => {
                        const anecs: any[] = e.anecdotas ?? [];
                        const isExpanded = expandedEst === e.id;
                        return (
                            <div key={e.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                                    onClick={() => setExpandedEst(isExpanded ? null : e.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm
                                            ${anecs.length === 0 ? 'bg-slate-100 text-slate-400'
                                            : anecs.length >= 3 ? 'bg-rose-100 text-rose-600'
                                            : 'bg-amber-100 text-amber-600'}`}>
                                            {anecs.length}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{e.usuario?.nombre_completo ?? 'N/D'}</p>
                                            <p className="text-xs text-slate-400">{e.rne ?? ''} · {e.carrera_actual?.nombre ?? 'Sin carrera'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {anecs.length > 0 && (
                                            <div className="flex gap-1">
                                                {['CONDUCTUAL', 'ACADEMICO', 'NEGATIVO'].map(t => {
                                                    const cnt = anecs.filter(a => a.tipo === t).length;
                                                    if (!cnt) return null;
                                                    return (
                                                        <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TIPO_COLOR[t]}`}>
                                                            {TIPO_ICON[t]}{cnt}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                            : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
                                        {anecs.length === 0 ? (
                                            <p className="text-sm text-slate-400 text-center py-3">Sin registros anecdóticos.</p>
                                        ) : anecs.map((a: any, j: number) => (
                                            <div key={j} className="flex gap-3 text-sm">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${TIPO_COLOR[a.tipo] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                        {TIPO_ICON[a.tipo]} {a.tipo}
                                                    </span>
                                                    {j < anecs.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <p className="text-xs text-slate-400 mb-0.5">
                                                        {a.docente?.usuario?.nombre_completo
                                                            ? `Docente: ${a.docente.usuario.nombre_completo}`
                                                            : 'Orientación'
                                                        } · {new Date(a.fecha_registro).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                    <p className="text-slate-700 leading-snug">{a.incidencia}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => { setForm(f => ({ ...f, estudiante_id: String(e.id) })); setShowModal(true); }}
                                            className="w-full mt-2 py-2 border border-dashed border-teal-300 text-teal-600 text-xs font-semibold rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Agregar anotación
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal Nueva Anotación ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Nueva Anotación Anecdótica</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Departamento de Orientación Escolar</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setError(''); setForm({ estudiante_id: '', incidencia: '', tipo: 'CONDUCTUAL' }); }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Estudiante *</label>
                                <select
                                    value={form.estudiante_id}
                                    onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                                >
                                    <option value="">Selecciona un estudiante...</option>
                                    {estudiantes.map((e: any) => (
                                        <option key={e.id} value={e.id}>{e.usuario?.nombre_completo ?? `ID ${e.id}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tipo de anotación *</label>
                                <div className="flex flex-wrap gap-2">
                                    {TIPO_ANECDOTA.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, tipo: t }))}
                                            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${form.tipo === t ? `${TIPO_COLOR[t]} ring-2 ring-offset-1 ring-teal-400` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                        >
                                            {TIPO_ICON[t]} {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Descripción de la incidencia *</label>
                                <textarea
                                    value={form.incidencia}
                                    onChange={e => setForm(f => ({ ...f, incidencia: e.target.value }))}
                                    rows={4}
                                    placeholder="Describe la situación observada con detalle..."
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{form.incidencia.length} caracteres</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-200">
                            <button
                                onClick={() => { setShowModal(false); setError(''); setForm({ estudiante_id: '', incidencia: '', tipo: 'CONDUCTUAL' }); }}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarAnecdota}
                                disabled={saving || !form.estudiante_id || !form.incidencia.trim()}
                                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Guardando...' : 'Registrar Anotación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
