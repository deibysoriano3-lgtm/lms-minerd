import { useState, useEffect } from 'react';
import { Calendar, Users, Archive, CheckCircle, Search, UserPlus, Database, Download, X, Plus, Loader2 } from 'lucide-react';
import api from '../api';

interface Periodo {
    id: number;
    nombre: string;
    es_activo: boolean;
    fecha_fin: string;
}

interface Seccion {
    id: number;
    nombre: string;
    carrera: string;
    inscritos: number;
}

export default function AdminEnrollmentDashboard() {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vista, setVista] = useState<'periodos' | 'matriculacion'>('periodos');

    // Inscripción
    const [busquedaRNE, setBusquedaRNE] = useState('');
    const [estudianteEncontrado, setEstudianteEncontrado] = useState<any>(null);
    const [buscandoEst, setBuscandoEst] = useState(false);
    const [errorBusqueda, setErrorBusqueda] = useState('');
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | ''>('');
    const [seccionSeleccionada, setSeccionSeleccionada] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mensajeOk, setMensajeOk] = useState('');

    // Modal nuevo período
    const [showModalPeriodo, setShowModalPeriodo] = useState(false);
    const [formPeriodo, setFormPeriodo] = useState({ nombre: '', fecha_inicio: '', fecha_fin: '' });
    const [creandoPeriodo, setCreandoPeriodo] = useState(false);
    const [errorPeriodo, setErrorPeriodo] = useState('');

    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        setIsLoading(true);
        try {
            const [resP, resS] = await Promise.all([
                api.get('/api/matricula/periodos'),
                api.get('/api/matricula/secciones'),
            ]);
            const dataP = resP.data;
            const dataS = resS.data;

            setPeriodos(Array.isArray(dataP) ? dataP.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                es_activo: p.es_activo,
                fecha_fin: new Date(p.fecha_fin).toLocaleDateString('es-DO'),
            })) : []);

            setSecciones(Array.isArray(dataS) ? dataS.map((s: any) => ({
                id: s.id,
                nombre: s.nombre,
                carrera: s.carrera?.nombre ?? '—',
                inscritos: s._count?.matriculas ?? 0,
            })) : []);

            const activo = dataP.find((p: any) => p.es_activo);
            if (activo) setPeriodoSeleccionado(activo.id);
        } catch {
            console.error('Error cargando datos de matrícula');
        } finally {
            setIsLoading(false);
        }
    }

    async function buscarEstudiante() {
        const rne = busquedaRNE.trim();
        if (!rne) return;
        setBuscandoEst(true);
        setErrorBusqueda('');
        setEstudianteEncontrado(null);
        try {
            const res = await api.get('/api/estudiantes');
            const todos = res.data;
            const est = todos.find((e: any) => e.rne?.toLowerCase() === rne.toLowerCase());
            if (!est) { setErrorBusqueda(`No se encontró ningún estudiante con RNE "${rne}".`); return; }
            setEstudianteEncontrado(est);
        } catch {
            setErrorBusqueda('Error al conectar con el servidor.');
        } finally {
            setBuscandoEst(false);
        }
    }

    async function handleInscribir() {
        if (!estudianteEncontrado) { setErrorBusqueda('Busca el estudiante por RNE primero.'); return; }
        if (!periodoSeleccionado) { alert('Selecciona un período académico.'); return; }
        if (!seccionSeleccionada) { alert('Selecciona una sección.'); return; }
        setIsSubmitting(true);
        setMensajeOk('');
        try {
            await api.post('/api/matricula/inscribir', {
                estudiante_id: estudianteEncontrado.id,
                periodo_id: Number(periodoSeleccionado),
                seccion_id: Number(seccionSeleccionada),
            });
            setMensajeOk(`✅ ${estudianteEncontrado.usuario?.nombre_completo ?? 'Estudiante'} matriculado correctamente.`);
            setEstudianteEncontrado(null);
            setBusquedaRNE('');
            setSeccionSeleccionada('');
            cargarDatos();
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCrearPeriodo() {
        if (!formPeriodo.nombre.trim() || !formPeriodo.fecha_inicio || !formPeriodo.fecha_fin) {
            setErrorPeriodo('Completa todos los campos.'); return;
        }
        if (formPeriodo.fecha_fin <= formPeriodo.fecha_inicio) {
            setErrorPeriodo('La fecha de fin debe ser posterior a la de inicio.'); return;
        }
        setCreandoPeriodo(true);
        setErrorPeriodo('');
        try {
            await api.post('/api/matricula/periodos', formPeriodo);
            setShowModalPeriodo(false);
            setFormPeriodo({ nombre: '', fecha_inicio: '', fecha_fin: '' });
            cargarDatos();
        } catch (e: any) {
            setErrorPeriodo(e.message ?? 'Error al crear el período.');
        } finally {
            setCreandoPeriodo(false);
        }
    }

    async function handleDescargarSabana(seccionId: number, nombreSeccion: string) {
        setIsDownloading(true);
        try {
            const res = await api.get(`/api/reportes/sabana-excel/${seccionId}`, { responseType: 'blob' });
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sabana_${nombreSeccion.replace(/\s/g, '_')}.xlsx`;
            document.body.appendChild(a); a.click();
            a.parentNode?.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Encabezado */}
                <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Gestión de Matrícula</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${isLoading ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                                {isLoading ? 'Sincronizando...' : 'Conectado ✅'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Períodos y Matrícula</h1>
                        <p className="text-slate-500 mt-1 text-sm">Administra años lectivos, secciones e inscripción de estudiantes.</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-1 inline-flex gap-1">
                    <button
                        onClick={() => setVista('periodos')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${vista === 'periodos' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calendar className="w-4 h-4" /> Años Escolares
                    </button>
                    <button
                        onClick={() => setVista('matriculacion')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${vista === 'matriculacion' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Users className="w-4 h-4" /> Inscribir Estudiante
                    </button>
                </div>

                {/* ── Vista: Períodos ── */}
                {vista === 'periodos' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Ciclos Académicos</h2>
                            <button
                                onClick={() => setShowModalPeriodo(true)}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Aperturar Nuevo Año Escolar
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>
                        ) : periodos.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
                                No hay períodos registrados. Crea el primero.
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-3 gap-6">
                                {periodos.map(p => (
                                    <div key={p.id} className={`bg-white rounded-xl border-2 p-6 relative overflow-hidden shadow-sm ${p.es_activo ? 'border-emerald-500' : 'border-slate-200'}`}>
                                        {p.es_activo && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                {p.es_activo ? <Database className="w-6 h-6 text-indigo-600" /> : <Archive className="w-6 h-6 text-slate-400" />}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.es_activo ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                                                {p.es_activo ? 'AÑO EN CURSO' : 'HISTÓRICO'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{p.nombre}</h3>
                                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-slate-400" /> Cierre: {p.fecha_fin}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Vista: Inscribir ── */}
                {vista === 'matriculacion' && (
                    <div className="space-y-6">
                        {/* Tarjeta de inscripción */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Inscripción de Estudiante</h3>
                            <p className="text-sm text-slate-500 mb-5">Busca al estudiante por su Número de Registro Nacional (RNE), selecciona el período y la sección.</p>

                            {mensajeOk && (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                                    {mensajeOk}
                                </div>
                            )}

                            {/* Paso 1: Buscar por RNE */}
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-600 block mb-1.5">1. Número RNE del estudiante</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={busquedaRNE}
                                            onChange={e => { setBusquedaRNE(e.target.value); setEstudianteEncontrado(null); setErrorBusqueda(''); }}
                                            onKeyDown={e => e.key === 'Enter' && buscarEstudiante()}
                                            placeholder="Ej: M-LOP-09-02-0001"
                                            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-rose-300"
                                        />
                                    </div>
                                    <button
                                        onClick={buscarEstudiante}
                                        disabled={buscandoEst || !busquedaRNE.trim()}
                                        className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-black transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {buscandoEst ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        Buscar
                                    </button>
                                </div>
                                {errorBusqueda && <p className="mt-2 text-sm text-rose-600">{errorBusqueda}</p>}
                                {estudianteEncontrado && (
                                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-800">{estudianteEncontrado.usuario?.nombre_completo}</p>
                                            <p className="text-xs text-emerald-600">{estudianteEncontrado.rne} · {estudianteEncontrado.carrera_actual?.nombre ?? 'Sin carrera'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Paso 2: Período y sección */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">2. Período académico</label>
                                    <select
                                        value={periodoSeleccionado}
                                        onChange={e => setPeriodoSeleccionado(Number(e.target.value))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                    >
                                        <option value="">Selecciona un período...</option>
                                        {periodos.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}{p.es_activo ? ' (Activo)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">3. Sección</label>
                                    <select
                                        value={seccionSeleccionada}
                                        onChange={e => setSeccionSeleccionada(Number(e.target.value))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                    >
                                        <option value="">Selecciona una sección...</option>
                                        {secciones.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre} — {s.carrera} ({s.inscritos} inscritos)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleInscribir}
                                disabled={isSubmitting || !estudianteEncontrado || !periodoSeleccionado || !seccionSeleccionada}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm disabled:opacity-40"
                            >
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscribiendo...</> : <><UserPlus className="w-4 h-4" /> Confirmar Matrícula</>}
                            </button>
                        </div>

                        {/* Panorama de secciones */}
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Secciones Activas</h2>
                            {isLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {secciones.map(sec => (
                                        <div key={sec.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-2xl font-black text-slate-800">{sec.nombre}</h3>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-4">{sec.carrera}</p>
                                            <p className="text-xs text-slate-500 mb-2 font-medium">{sec.inscritos} inscritos</p>
                                            <button
                                                onClick={() => handleDescargarSabana(sec.id, sec.nombre)}
                                                disabled={isDownloading || sec.inscritos === 0}
                                                className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Download className="w-4 h-4" />
                                                {isDownloading ? 'Generando...' : 'Descargar Sábana (.xlsx)'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Aperturar Nuevo Año Escolar */}
            {showModalPeriodo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Aperturar Nuevo Año Escolar</h2>
                            <button onClick={() => { setShowModalPeriodo(false); setErrorPeriodo(''); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {errorPeriodo && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{errorPeriodo}</p>}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nombre del período *</label>
                                <input
                                    type="text"
                                    value={formPeriodo.nombre}
                                    onChange={e => setFormPeriodo(f => ({ ...f, nombre: e.target.value }))}
                                    placeholder="Ej: Año Escolar 2026-2027"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Fecha de inicio *</label>
                                    <input
                                        type="date"
                                        value={formPeriodo.fecha_inicio}
                                        onChange={e => setFormPeriodo(f => ({ ...f, fecha_inicio: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Fecha de cierre *</label>
                                    <input
                                        type="date"
                                        value={formPeriodo.fecha_fin}
                                        onChange={e => setFormPeriodo(f => ({ ...f, fecha_fin: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Al crear este período se marcará como el activo y el anterior quedará como histórico.</p>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-200">
                            <button
                                onClick={() => { setShowModalPeriodo(false); setErrorPeriodo(''); }}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrearPeriodo}
                                disabled={creandoPeriodo}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                            >
                                {creandoPeriodo ? 'Creando...' : 'Aperturar Período'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
