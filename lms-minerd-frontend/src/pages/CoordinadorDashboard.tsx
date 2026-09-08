import { useState, useEffect } from 'react';
import { Layers, Users, BookOpen, GraduationCap, TrendingUp, Search, Plus, Trash2, Loader2, X, ClipboardList, AlertTriangle, UserCheck, Briefcase, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../api';

type Vista = 'resumen' | 'estudiantes' | 'docentes' | 'riesgo' | 'visitas' | 'fct' | 'disciplina';

const PARENTESCO_OPTS = ['PADRE', 'MADRE', 'TUTOR', 'ABUELO/A', 'TÍO/A', 'HERMANO/A', 'OTRO'];
const ESTADO_FCT = ['ACTIVA', 'COMPLETADA', 'SUSPENDIDA'];

export default function CoordinadorDashboard() {
    const [vista, setVista] = useState<Vista>('resumen');
    const [resumen, setResumen] = useState<any>(null);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);

    const [estudiantesRiesgo, setEstudiantesRiesgo] = useState<any[]>([]);

    // Visitas
    const [visitas, setVisitas] = useState<any[]>([]);
    const [modalVisita, setModalVisita] = useState(false);
    const [formVisita, setFormVisita] = useState({ estudiante_id: '', fecha: new Date().toISOString().slice(0, 10), quien_visita: '', parentesco: 'TUTOR', motivo: '', acuerdos: '', proxima_reunion: '' });
    const [guardandoVisita, setGuardandoVisita] = useState(false);
    const [errorVisita, setErrorVisita] = useState('');
    const [filtroVisitaEstudiante, setFiltroVisitaEstudiante] = useState('');

    // Disciplina
    const [disciplina, setDisciplina] = useState<any[]>([]);
    const [modalDisciplina, setModalDisciplina] = useState(false);
    const [formDisciplina, setFormDisciplina] = useState({ estudiante_id: '', tipo: 'LEVE', descripcion: '', sancion: '', fecha_incidente: new Date().toISOString().slice(0, 10), fecha_notif_padre: '' });
    const [guardandoDisciplina, setGuardandoDisciplina] = useState(false);
    const [errorDisciplina, setErrorDisciplina] = useState('');
    const [filtroDisciplina, setFiltroDisciplina] = useState<'TODOS' | 'ABIERTO' | 'RESUELTO'>('TODOS');
    const [modalResolucion, setModalResolucion] = useState<{ id: number; nombre: string } | null>(null);
    const [textoResolucion, setTextoResolucion] = useState('');

    // FCT
    const [asignacionesFCT, setAsignacionesFCT] = useState<any[]>([]);
    const [modalFCT, setModalFCT] = useState(false);
    const [formFCT, setFormFCT] = useState({ estudiante_id: '', empresa: '', tutor_empresa_nombre: '', tutor_empresa_tel: '', fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin_esperada: '', horas_requeridas: '360', observaciones: '' });
    const [guardandoFCT, setGuardandoFCT] = useState(false);
    const [errorFCT, setErrorFCT] = useState('');

    // Modal cargas docentes
    const [docenteCargas, setDocenteCargas] = useState<any>(null);
    const [periodos, setPeriodos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [modulos, setModulos] = useState<any[]>([]);
    const [asignaturas, setAsignaturas] = useState<any[]>([]);
    const [nuevaCarga, setNuevaCarga] = useState({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
    const [guardandoCarga, setGuardandoCarga] = useState(false);
    const [errorCarga, setErrorCarga] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/api/coordinador/resumen')
            .then(r => setResumen(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (vista === 'estudiantes' && estudiantes.length === 0) {
            setLoading(true);
            api.get('/api/coordinador/estudiantes')
                .then(r => setEstudiantes(Array.isArray(r.data) ? r.data : []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }
        if (vista === 'riesgo' && estudiantesRiesgo.length === 0) {
            setLoading(true);
            api.get('/api/asistencia/riesgo')
                .then(r => setEstudiantesRiesgo(Array.isArray(r.data) ? r.data : []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }
        if (vista === 'docentes' && docentes.length === 0) {
            setLoading(true);
            api.get('/api/coordinador/docentes')
                .then(r => setDocentes(Array.isArray(r.data) ? r.data : []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }
        if (vista === 'visitas') cargarVisitas();
        if (vista === 'fct') cargarFCT();
        if (vista === 'disciplina') cargarDisciplina();
    }, [vista]);

    const cargarVisitas = () => {
        setLoading(true);
        api.get('/api/visitas').then(r => setVisitas(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    };

    const cargarDisciplina = () => {
        setLoading(true);
        api.get('/api/disciplina').then(r => setDisciplina(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    };

    const handleRegistrarDisciplina = async () => {
        if (!formDisciplina.estudiante_id || !formDisciplina.descripcion) {
            setErrorDisciplina('Selecciona un estudiante e ingresa la descripción.'); return;
        }
        setGuardandoDisciplina(true); setErrorDisciplina('');
        try {
            await api.post('/api/disciplina', { ...formDisciplina, estudiante_id: Number(formDisciplina.estudiante_id), fecha_notif_padre: formDisciplina.fecha_notif_padre || undefined });
            setModalDisciplina(false);
            setFormDisciplina({ estudiante_id: '', tipo: 'LEVE', descripcion: '', sancion: '', fecha_incidente: new Date().toISOString().slice(0, 10), fecha_notif_padre: '' });
            cargarDisciplina();
        } catch { setErrorDisciplina('Error al registrar la falta.'); }
        finally { setGuardandoDisciplina(false); }
    };

    const handleResolver = async () => {
        if (!modalResolucion) return;
        try {
            await api.patch(`/api/disciplina/${modalResolucion.id}/estado`, { estado: 'RESUELTO', resolucion: textoResolucion });
            setModalResolucion(null); setTextoResolucion('');
            cargarDisciplina();
        } catch { alert('Error al resolver el expediente.'); }
    };

    const cargarFCT = () => {
        setLoading(true);
        api.get('/api/fct/asignaciones').then(r => setAsignacionesFCT(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    };

    const handleRegistrarVisita = async () => {
        if (!formVisita.estudiante_id || !formVisita.quien_visita || !formVisita.motivo) {
            setErrorVisita('Completa los campos obligatorios.'); return;
        }
        setGuardandoVisita(true); setErrorVisita('');
        try {
            await api.post('/api/visitas', { ...formVisita, estudiante_id: Number(formVisita.estudiante_id), proxima_reunion: formVisita.proxima_reunion || undefined });
            setModalVisita(false);
            setFormVisita({ estudiante_id: '', fecha: new Date().toISOString().slice(0, 10), quien_visita: '', parentesco: 'TUTOR', motivo: '', acuerdos: '', proxima_reunion: '' });
            cargarVisitas();
        } catch { setErrorVisita('Error al registrar la visita.'); }
        finally { setGuardandoVisita(false); }
    };

    const handleCrearAsignacionFCT = async () => {
        if (!formFCT.estudiante_id || !formFCT.empresa || !formFCT.tutor_empresa_nombre || !formFCT.fecha_fin_esperada) {
            setErrorFCT('Completa los campos obligatorios.'); return;
        }
        setGuardandoFCT(true); setErrorFCT('');
        try {
            await api.post('/api/fct/asignacion', { ...formFCT, estudiante_id: Number(formFCT.estudiante_id), horas_requeridas: Number(formFCT.horas_requeridas) });
            setModalFCT(false);
            setFormFCT({ estudiante_id: '', empresa: '', tutor_empresa_nombre: '', tutor_empresa_tel: '', fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin_esperada: '', horas_requeridas: '360', observaciones: '' });
            cargarFCT();
        } catch { setErrorFCT('Error al crear la asignación.'); }
        finally { setGuardandoFCT(false); }
    };

    const handleCambiarEstadoFCT = async (id: number, estado: string) => {
        try { await api.patch(`/api/fct/asignacion/${id}/estado`, { estado }); cargarFCT(); }
        catch { alert('Error al actualizar estado.'); }
    };

    const recargarDocentes = async () => {
        const r = await api.get('/api/docentes');
        const data = r.data;
        setDocentes(Array.isArray(data) ? data : []);
        return data;
    };

    const abrirModalCargas = async (doc: any) => {
        setDocenteCargas(doc); setErrorCarga('');
        setNuevaCarga({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
        if (periodos.length === 0) {
            const [rP, rS, rM, rA] = await Promise.all([
                api.get('/api/matricula/periodos').then(r => r.data).catch(() => []),
                api.get('/api/matricula/secciones').then(r => r.data).catch(() => []),
                api.get('/api/curriculum/modulos').then(r => r.data).catch(() => []),
                api.get('/api/curriculum/asignaturas').then(r => r.data).catch(() => []),
            ]);
            setPeriodos(Array.isArray(rP) ? rP : []);
            setSecciones(Array.isArray(rS) ? rS : []);
            setModulos(Array.isArray(rM) ? rM : []);
            setAsignaturas(Array.isArray(rA) ? rA : []);
        }
    };

    const handleAsignarCarga = async () => {
        if (!nuevaCarga.periodo_id || !nuevaCarga.seccion_id) { setErrorCarga('Selecciona período y sección.'); return; }
        if (!nuevaCarga.modulo_formativo_id && !nuevaCarga.asignatura_academica_id) { setErrorCarga('Selecciona un módulo o una asignatura.'); return; }
        setGuardandoCarga(true); setErrorCarga('');
        try {
            const body: any = { periodo_id: Number(nuevaCarga.periodo_id), seccion_id: Number(nuevaCarga.seccion_id) };
            if (nuevaCarga.modulo_formativo_id) body.modulo_formativo_id = Number(nuevaCarga.modulo_formativo_id);
            if (nuevaCarga.asignatura_academica_id) body.asignatura_academica_id = Number(nuevaCarga.asignatura_academica_id);
            await api.post(`/api/docentes/${docenteCargas.id}/cargas`, body);
            const data = await recargarDocentes();
            const updated = data.find((d: any) => d.id === docenteCargas.id);
            if (updated) setDocenteCargas(updated);
            setNuevaCarga({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
        } catch { setErrorCarga('Error al asignar. Puede que ya exista esa combinación.'); }
        finally { setGuardandoCarga(false); }
    };

    const handleEliminarCarga = async (carga_id: number) => {
        if (!confirm('¿Eliminar esta asignación?')) return;
        try {
            await api.delete(`/api/docentes/cargas/${carga_id}`);
            const data = await recargarDocentes();
            const updated = data.find((d: any) => d.id === docenteCargas.id);
            if (updated) setDocenteCargas(updated);
        } catch { alert('Error al eliminar la asignación.'); }
    };

    const filtrarEstudiantes = estudiantes.filter(e =>
        e.usuario?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.rne?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const filtrarDocentes = docentes.filter(d =>
        d.usuario?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.cedula?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const visitasFiltradas = visitas.filter(v => {
        const nombre = v.estudiante?.usuario?.nombre_completo?.toLowerCase() ?? '';
        return filtroVisitaEstudiante === '' || nombre.includes(filtroVisitaEstudiante.toLowerCase());
    });

    const estadoColor: Record<string, string> = {
        ACTIVO: 'bg-emerald-100 text-emerald-700',
        INACTIVO: 'bg-slate-100 text-slate-600',
        GRADUADO: 'bg-blue-100 text-blue-700',
        SUSPENDIDO: 'bg-rose-100 text-rose-700',
    };

    const estadoFCTColor: Record<string, string> = {
        ACTIVA: 'bg-emerald-100 text-emerald-700',
        COMPLETADA: 'bg-blue-100 text-blue-700',
        SUSPENDIDA: 'bg-rose-100 text-rose-700',
    };

    const tabs: { id: Vista; label: string; icon: any }[] = [
        { id: 'resumen', label: 'Resumen', icon: TrendingUp },
        { id: 'estudiantes', label: 'Estudiantes', icon: Users },
        { id: 'docentes', label: 'Docentes', icon: BookOpen },
        { id: 'riesgo', label: 'En Riesgo', icon: AlertTriangle },
        { id: 'visitas', label: 'Visitas', icon: UserCheck },
        { id: 'fct', label: 'FCT', icon: Briefcase },
        { id: 'disciplina', label: 'Disciplina', icon: ShieldAlert },
    ];

    return (
        <>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Coordinación Académica</h1>
                    <p className="text-sm text-slate-500">Seguimiento institucional</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setVista(t.id); setBusqueda(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === t.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Resumen */}
            {vista === 'resumen' && !loading && resumen && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Estudiantes Activos', value: resumen.estudiantesActivos ?? 0, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                            { label: 'Docentes Activos', value: resumen.docentesActivos ?? 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                            { label: 'Secciones', value: resumen.secciones ?? 0, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
                            { label: 'Carreras', value: resumen.carreras ?? 0, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                        ].map(s => (
                            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    {resumen.porEstado && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wide">Estudiantes por Estado</h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(resumen.porEstado).map(([estado, count]: any) => (
                                    <div key={estado} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${estadoColor[estado] ?? 'bg-slate-100 text-slate-600'}`}>
                                        <span>{estado}</span>
                                        <span className="font-black">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {Array.isArray(resumen.topCarreras) && resumen.topCarreras.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> Carreras con más estudiantes
                            </h3>
                            <div className="space-y-3">
                                {resumen.topCarreras.map((c: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                                        <span className="flex-1 text-sm text-slate-700">{c.nombre}</span>
                                        <span className="text-sm font-bold text-orange-600">{c._count?.estudiantes ?? 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estudiantes */}
            {vista === 'estudiantes' && !loading && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre o RNE..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-slate-600">Nombre</th>
                                    <th className="text-left p-3 font-semibold text-slate-600 hidden sm:table-cell">RNE</th>
                                    <th className="text-left p-3 font-semibold text-slate-600 hidden md:table-cell">Carrera</th>
                                    <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrarEstudiantes.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">No se encontraron estudiantes</td></tr>
                                ) : filtrarEstudiantes.map((e: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">{e.usuario?.nombre_completo ?? 'N/D'}</td>
                                        <td className="p-3 text-slate-500 hidden sm:table-cell">{e.rne ?? '—'}</td>
                                        <td className="p-3 text-slate-500 hidden md:table-cell">{e.carrera_actual?.nombre ?? '—'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoColor[e.estado_academico] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {e.estado_academico}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400 text-right">{filtrarEstudiantes.length} estudiante(s)</p>
                </div>
            )}

            {/* Docentes */}
            {vista === 'docentes' && !loading && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre o cédula..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left p-3 font-semibold text-slate-600">Nombre</th>
                                    <th className="text-left p-3 font-semibold text-slate-600 hidden sm:table-cell">Cédula</th>
                                    <th className="text-left p-3 font-semibold text-slate-600 hidden md:table-cell">Especialidad</th>
                                    <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                                    <th className="text-center p-3 font-semibold text-slate-600">Asignaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrarDocentes.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">No se encontraron docentes</td></tr>
                                ) : filtrarDocentes.map((d: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">{d.usuario?.nombre_completo ?? 'N/D'}</td>
                                        <td className="p-3 text-slate-500 hidden sm:table-cell">{d.cedula ?? '—'}</td>
                                        <td className="p-3 text-slate-500 hidden md:table-cell">{d.especialidad_tecnica ?? '—'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.estado_laboral === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {d.estado_laboral}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => abrirModalCargas(d)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors">
                                                <ClipboardList className="w-3.5 h-3.5" />
                                                {(d.cargas_academicas?.length ?? 0)} asig.
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400 text-right">{filtrarDocentes.length} docente(s)</p>
                </div>
            )}

            {/* Panel de Riesgo */}
            {vista === 'riesgo' && !loading && (
                <div className="space-y-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-rose-700">Estudiantes en situación de riesgo</p>
                            <p className="text-xs text-rose-500 mt-0.5">Criterios: 3 o más ausencias, o asistencia por debajo del 80%.</p>
                        </div>
                    </div>
                    {estudiantesRiesgo.length === 0 ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                            <p className="text-emerald-700 font-semibold">¡Sin alertas!</p>
                            <p className="text-emerald-500 text-sm mt-1">Ningún estudiante supera los umbrales de riesgo actualmente.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left p-3 font-semibold text-slate-600">Estudiante</th>
                                        <th className="text-center p-3 font-semibold text-slate-600">Ausencias</th>
                                        <th className="text-center p-3 font-semibold text-slate-600">Tardanzas</th>
                                        <th className="text-center p-3 font-semibold text-slate-600">% Asistencia</th>
                                        <th className="text-center p-3 font-semibold text-slate-600 hidden md:table-cell">Anotaciones neg.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estudiantesRiesgo.map((e: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-rose-50/40 transition-colors">
                                            <td className="p-3 font-semibold text-slate-800">{e.nombre}</td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-xs ${e.ausencias >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{e.ausencias}</span>
                                            </td>
                                            <td className="p-3 text-center text-slate-500">{e.tardanzas}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${e.pct_asistencia >= 80 ? 'bg-emerald-500' : e.pct_asistencia >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${e.pct_asistencia}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-bold ${e.pct_asistencia < 80 ? 'text-rose-600' : 'text-slate-600'}`}>{e.pct_asistencia}%</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center hidden md:table-cell">
                                                {e.anecdotas_negativas > 0 ? <span className="font-bold text-amber-600">{e.anecdotas_negativas}</span> : <span className="text-slate-300">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="text-xs text-slate-400 text-right">{estudiantesRiesgo.length} estudiante(s) en alerta</p>
                </div>
            )}

            {/* Visitas de Padres */}
            {vista === 'visitas' && !loading && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Visitas de Padres / Tutores</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Registro de encuentros con familiares de estudiantes</p>
                        </div>
                        <button onClick={() => { setModalVisita(true); setErrorVisita(''); }}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors">
                            <Plus className="w-4 h-4" /> Nueva visita
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Filtrar por nombre de estudiante..." value={filtroVisitaEstudiante}
                            onChange={e => setFiltroVisitaEstudiante(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </div>

                    {visitasFiltradas.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-medium">Sin visitas registradas</p>
                            <p className="text-slate-300 text-sm">Registra la primera visita con el botón de arriba.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visitasFiltradas.map((v: any, i: number) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-bold text-slate-800">{v.quien_visita}</span>
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{v.parentesco}</span>
                                                <span className="text-xs text-slate-400">→ {v.estudiante?.usuario?.nombre_completo ?? '—'}</span>
                                            </div>
                                            <p className="text-sm text-slate-600"><span className="font-semibold text-slate-500">Motivo:</span> {v.motivo}</p>
                                            {v.acuerdos && <p className="text-sm text-slate-600 mt-1"><span className="font-semibold text-slate-500">Acuerdos:</span> {v.acuerdos}</p>}
                                            {v.proxima_reunion && (
                                                <p className="text-xs text-indigo-600 mt-1 font-medium">
                                                    Próxima reunión: {new Date(v.proxima_reunion).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-slate-500">{new Date(v.fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-slate-400 text-right">{visitasFiltradas.length} visita(s)</p>
                </div>
            )}

            {/* FCT */}
            {vista === 'fct' && !loading && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Formación en Centros de Trabajo</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Seguimiento de pasantías estudiantiles en empresas</p>
                        </div>
                        <button onClick={() => { setModalFCT(true); setErrorFCT(''); }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                            <Plus className="w-4 h-4" /> Asignar FCT
                        </button>
                    </div>

                    {asignacionesFCT.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-medium">Sin asignaciones FCT</p>
                            <p className="text-slate-300 text-sm">Asigna estudiantes a sus empresas de pasantía.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left p-3 font-semibold text-slate-600">Estudiante</th>
                                            <th className="text-left p-3 font-semibold text-slate-600 hidden sm:table-cell">Empresa</th>
                                            <th className="text-left p-3 font-semibold text-slate-600 hidden md:table-cell">Tutor empresa</th>
                                            <th className="text-center p-3 font-semibold text-slate-600">Horas</th>
                                            <th className="text-center p-3 font-semibold text-slate-600">Inicio</th>
                                            <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asignacionesFCT.map((a: any, i: number) => {
                                            const pct = Math.min(Math.round((a.horas_reportadas / a.horas_requeridas) * 100), 100);
                                            return (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="p-3">
                                                        <p className="font-semibold text-slate-800">{a.estudiante?.usuario?.nombre_completo ?? '—'}</p>
                                                        <p className="text-xs text-slate-400">{a.estudiante?.carrera_actual?.nombre ?? '—'}</p>
                                                    </td>
                                                    <td className="p-3 hidden sm:table-cell text-slate-600">{a.empresa}</td>
                                                    <td className="p-3 hidden md:table-cell text-slate-500 text-xs">{a.tutor_empresa_nombre}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs font-bold text-slate-700">{a.horas_reportadas}/{a.horas_requeridas}h</span>
                                                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center text-xs text-slate-500">
                                                        {new Date(a.fecha_inicio).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <select
                                                            value={a.estado}
                                                            onChange={e => handleCambiarEstadoFCT(a.id, e.target.value)}
                                                            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-300 ${estadoFCTColor[a.estado] ?? 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            {ESTADO_FCT.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-slate-400 text-right">{asignacionesFCT.length} asignación(es) FCT</p>
                </div>
            )}

            {/* Disciplina */}
            {vista === 'disciplina' && !loading && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Registro Disciplinario</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Faltas leves, graves y muy graves con seguimiento formal</p>
                        </div>
                        <button onClick={() => { if (estudiantes.length === 0) { setLoading(true); api.get('/api/coordinador/estudiantes').then(r => setEstudiantes(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false)); } setModalDisciplina(true); setErrorDisciplina(''); }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors">
                            <Plus className="w-4 h-4" /> Registrar falta
                        </button>
                    </div>
                    {disciplina.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {[
                                { label: 'Total', value: disciplina.length, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
                                { label: 'Leves', value: disciplina.filter(d => d.tipo === 'LEVE').length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                                { label: 'Graves', value: disciplina.filter(d => d.tipo === 'GRAVE').length, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
                                { label: 'Muy graves', value: disciplina.filter(d => d.tipo === 'MUY_GRAVE').length, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
                                { label: 'Abiertos', value: disciplina.filter(d => d.estado === 'ABIERTO').length, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                            ].map(s => (
                                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        {(['TODOS', 'ABIERTO', 'RESUELTO'] as const).map(f => (
                            <button key={f} onClick={() => setFiltroDisciplina(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroDisciplina === f ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    {disciplina.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-medium">Sin registros disciplinarios</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {disciplina
                                .filter(d => filtroDisciplina === 'TODOS' || d.estado === filtroDisciplina)
                                .map((d: any, i: number) => {
                                    const tipoColor: Record<string, string> = { LEVE: 'bg-amber-100 text-amber-700', GRAVE: 'bg-orange-100 text-orange-700', MUY_GRAVE: 'bg-rose-100 text-rose-700' };
                                    const estadoColor2: Record<string, string> = { ABIERTO: 'bg-red-100 text-red-700', RESUELTO: 'bg-emerald-100 text-emerald-700', APELADO: 'bg-blue-100 text-blue-700' };
                                    return (
                                        <div key={i} className={`bg-white border rounded-2xl p-4 shadow-sm ${d.estado === 'ABIERTO' ? 'border-rose-200' : 'border-slate-200'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tipoColor[d.tipo] ?? 'bg-slate-100 text-slate-600'}`}>{d.tipo.replace('_', ' ')}</span>
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoColor2[d.estado] ?? 'bg-slate-100'}`}>{d.estado}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{d.estudiante?.usuario?.nombre_completo ?? '—'}</span>
                                                        <span className="text-xs text-slate-300">{d.estudiante?.carrera_actual?.nombre ?? ''}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-700">{d.descripcion}</p>
                                                    {d.sancion && <p className="text-xs text-slate-500 mt-1"><span className="font-semibold">Sanción:</span> {d.sancion}</p>}
                                                    {d.resolucion && <p className="text-xs text-emerald-600 mt-1"><span className="font-semibold">Resolución:</span> {d.resolucion}</p>}
                                                    {d.fecha_notif_padre && <p className="text-xs text-indigo-500 mt-1">Padre notificado: {new Date(d.fecha_notif_padre).toLocaleDateString('es-DO')}</p>}
                                                </div>
                                                <div className="text-right shrink-0 space-y-2">
                                                    <p className="text-xs font-bold text-slate-500">{new Date(d.fecha_incidente).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    {d.estado === 'ABIERTO' && (
                                                        <button onClick={() => { setModalResolucion({ id: d.id, nombre: d.estudiante?.usuario?.nombre_completo ?? '' }); setTextoResolucion(''); }}
                                                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-semibold">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                    <p className="text-xs text-slate-400 text-right">{disciplina.filter(d => filtroDisciplina === 'TODOS' || d.estado === filtroDisciplina).length} registro(s)</p>
                </div>
            )}
        </div>

        {/* Modal: Registrar Visita */}
        {modalVisita && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800">Registrar Visita</h2>
                        <button onClick={() => setModalVisita(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {errorVisita && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{errorVisita}</p>}

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Estudiante *</label>
                            <select value={formVisita.estudiante_id} onChange={e => setFormVisita(f => ({ ...f, estudiante_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                <option value="">Selecciona estudiante...</option>
                                {estudiantes.map((e: any) => <option key={e.id} value={e.id}>{e.usuario?.nombre_completo} ({e.rne})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha *</label>
                                <input type="date" value={formVisita.fecha} onChange={e => setFormVisita(f => ({ ...f, fecha: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Parentesco</label>
                                <select value={formVisita.parentesco} onChange={e => setFormVisita(f => ({ ...f, parentesco: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                    {PARENTESCO_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del visitante *</label>
                            <input type="text" placeholder="Ej: María Pérez de Gómez" value={formVisita.quien_visita}
                                onChange={e => setFormVisita(f => ({ ...f, quien_visita: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Motivo de la visita *</label>
                            <textarea rows={2} placeholder="Motivo o tema tratado..." value={formVisita.motivo}
                                onChange={e => setFormVisita(f => ({ ...f, motivo: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Acuerdos / Compromisos</label>
                            <textarea rows={2} placeholder="Compromisos establecidos..." value={formVisita.acuerdos}
                                onChange={e => setFormVisita(f => ({ ...f, acuerdos: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Próxima reunión</label>
                            <input type="date" value={formVisita.proxima_reunion} onChange={e => setFormVisita(f => ({ ...f, proxima_reunion: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
                        <button onClick={() => setModalVisita(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleRegistrarVisita} disabled={guardandoVisita}
                            className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors">
                            {guardandoVisita ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Registrar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal: Asignar FCT */}
        {modalFCT && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800">Asignar Pasantía FCT</h2>
                        <button onClick={() => setModalFCT(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {errorFCT && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{errorFCT}</p>}

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Estudiante *</label>
                            <select value={formFCT.estudiante_id} onChange={e => setFormFCT(f => ({ ...f, estudiante_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                <option value="">Selecciona estudiante...</option>
                                {estudiantes.map((e: any) => <option key={e.id} value={e.id}>{e.usuario?.nombre_completo} ({e.rne})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Empresa *</label>
                            <input type="text" placeholder="Ej: Banco BHD — Dpto. TI" value={formFCT.empresa}
                                onChange={e => setFormFCT(f => ({ ...f, empresa: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Tutor en empresa *</label>
                                <input type="text" placeholder="Nombre completo" value={formFCT.tutor_empresa_nombre}
                                    onChange={e => setFormFCT(f => ({ ...f, tutor_empresa_nombre: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Teléfono tutor</label>
                                <input type="text" placeholder="809-000-0000" value={formFCT.tutor_empresa_tel}
                                    onChange={e => setFormFCT(f => ({ ...f, tutor_empresa_tel: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha inicio *</label>
                                <input type="date" value={formFCT.fecha_inicio} onChange={e => setFormFCT(f => ({ ...f, fecha_inicio: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha fin *</label>
                                <input type="date" value={formFCT.fecha_fin_esperada} onChange={e => setFormFCT(f => ({ ...f, fecha_fin_esperada: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Horas requeridas</label>
                                <input type="number" value={formFCT.horas_requeridas} min={1}
                                    onChange={e => setFormFCT(f => ({ ...f, horas_requeridas: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Observaciones</label>
                            <textarea rows={2} placeholder="Notas adicionales..." value={formFCT.observaciones}
                                onChange={e => setFormFCT(f => ({ ...f, observaciones: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
                        <button onClick={() => setModalFCT(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleCrearAsignacionFCT} disabled={guardandoFCT}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                            {guardandoFCT ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Asignar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal: Gestionar Asignaciones del Docente */}
        {docenteCargas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Asignaciones de {docenteCargas.usuario?.nombre_completo}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Módulos y asignaturas por sección y período</p>
                        </div>
                        <button onClick={() => setDocenteCargas(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-5 space-y-5">
                        <div>
                            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Asignaciones actuales</h3>
                            {(docenteCargas.cargas_academicas?.length ?? 0) === 0 ? (
                                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">Sin asignaciones. Añade una abajo.</p>
                            ) : (
                                <div className="space-y-2">
                                    {docenteCargas.cargas_academicas.map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{c.modulo_formativo?.nombre ?? c.asignatura_academica?.nombre ?? '—'}</p>
                                                <p className="text-xs text-slate-500">Sección: {c.seccion?.nombre ?? '—'} · Período: {c.periodo?.nombre ?? '—'}</p>
                                            </div>
                                            <button onClick={() => handleEliminarCarga(c.id)}
                                                className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shrink-0" title="Eliminar asignación">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Nueva asignación</h3>
                            {errorCarga && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">{errorCarga}</p>}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Período *</label>
                                    <select value={nuevaCarga.periodo_id} onChange={e => setNuevaCarga(n => ({ ...n, periodo_id: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                        <option value="">Selecciona...</option>
                                        {periodos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Sección *</label>
                                    <select value={nuevaCarga.seccion_id} onChange={e => setNuevaCarga(n => ({ ...n, seccion_id: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                        <option value="">Selecciona...</option>
                                        {secciones.map((s: any) => <option key={s.id} value={s.id}>{s.nombre} — {s.carrera?.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Módulo técnico</label>
                                    <select value={nuevaCarga.modulo_formativo_id} onChange={e => setNuevaCarga(n => ({ ...n, modulo_formativo_id: e.target.value, asignatura_academica_id: '' }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                        <option value="">— Ninguno —</option>
                                        {modulos.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Asignatura académica</label>
                                    <select value={nuevaCarga.asignatura_academica_id} onChange={e => setNuevaCarga(n => ({ ...n, asignatura_academica_id: e.target.value, modulo_formativo_id: '' }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                                        <option value="">— Ninguna —</option>
                                        {asignaturas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Selecciona módulo O asignatura, no ambos.</p>
                            <button onClick={handleAsignarCarga} disabled={guardandoCarga}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors">
                                {guardandoCarga ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Asignar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Modal: Registrar falta disciplinaria */}
        {modalDisciplina && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800">Registrar Falta Disciplinaria</h2>
                        <button onClick={() => setModalDisciplina(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {errorDisciplina && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{errorDisciplina}</p>}

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Estudiante *</label>
                            <select value={formDisciplina.estudiante_id} onChange={e => setFormDisciplina(f => ({ ...f, estudiante_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                                <option value="">Selecciona estudiante...</option>
                                {estudiantes.map((e: any) => <option key={e.id} value={e.id}>{e.usuario?.nombre_completo} ({e.rne})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Tipo de falta *</label>
                                <select value={formDisciplina.tipo} onChange={e => setFormDisciplina(f => ({ ...f, tipo: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                                    <option value="LEVE">LEVE</option>
                                    <option value="GRAVE">GRAVE</option>
                                    <option value="MUY_GRAVE">MUY GRAVE</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha del incidente *</label>
                                <input type="date" value={formDisciplina.fecha_incidente} onChange={e => setFormDisciplina(f => ({ ...f, fecha_incidente: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción del incidente *</label>
                            <textarea rows={3} placeholder="Describe detalladamente lo ocurrido..." value={formDisciplina.descripcion}
                                onChange={e => setFormDisciplina(f => ({ ...f, descripcion: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Sanción aplicada</label>
                            <input type="text" placeholder="Ej: Suspensión 3 días, Citación de padres..." value={formDisciplina.sancion}
                                onChange={e => setFormDisciplina(f => ({ ...f, sancion: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha notificación al padre/tutor</label>
                            <input type="date" value={formDisciplina.fecha_notif_padre} onChange={e => setFormDisciplina(f => ({ ...f, fecha_notif_padre: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
                        <button onClick={() => setModalDisciplina(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleRegistrarDisciplina} disabled={guardandoDisciplina}
                            className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors">
                            {guardandoDisciplina ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                            Registrar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal: Resolución */}
        {modalResolucion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Resolver expediente</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{modalResolucion.nombre}</p>
                        </div>
                        <button onClick={() => setModalResolucion(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="p-5 space-y-3">
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Notas de resolución</label>
                        <textarea rows={3} placeholder="Describe cómo se resolvió el caso, compromisos, etc." value={textoResolucion}
                            onChange={e => setTextoResolucion(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
                        <button onClick={() => setModalResolucion(null)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleResolver}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                            <CheckCircle2 className="w-4 h-4" /> Marcar como resuelto
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
