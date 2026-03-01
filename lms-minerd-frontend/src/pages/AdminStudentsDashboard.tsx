import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Search, UserPlus, Edit, Trash2, FileText, CheckCircle, XCircle,
    AlertCircle, RefreshCw, X, Users, GraduationCap, UserX, BookOpen, FileSpreadsheet
} from 'lucide-react';

type EstadoEstudiante = 'ACTIVO' | 'RETIRADO' | 'EGRESADO' | 'SUSPENDIDO';

interface UsuarioERP { nombre_completo: string; email: string; }
interface CarreraERP { id: number; nombre: string; }
interface MatriculaERP { seccion?: { nombre: string } }

export interface EstudianteERP {
    id: number;
    rne: string;
    fecha_ingreso: string;
    estado_academico: EstadoEstudiante;
    usuario?: UsuarioERP;
    carrera_actual?: CarreraERP;
    matriculas?: MatriculaERP[];
}

interface RegistroAnecdoticoERP {
    tipo: string;
    fecha_registro: string;
    incidencia: string;
    docente?: { usuario?: { nombre_completo: string } }
}

interface CalificacionRA_ERP {
    ra_id: number;
    valor_logrado: number;
    resultado_aprendizaje?: {
        numero: string;
        descripcion: string;
        valor_maximo: number;
        modulo?: { nombre: string; codigo: string };
    }
}

export interface ExpedienteERP extends EstudianteERP {
    tutores?: { nombres_apellidos: string }[];
    telefono_contacto?: string;
    anecdotas?: RegistroAnecdoticoERP[];
    calificaciones_ra?: CalificacionRA_ERP[];
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            </div>
        </div>
    );
}

// ── Badge de Estado ───────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: EstadoEstudiante }) {
    const map = {
        ACTIVO: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Activo' },
        RETIRADO: { cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: <XCircle className="w-3 h-3" />, label: 'Retirado' },
        EGRESADO: { cls: 'bg-blue-100 text-blue-800 border-blue-200', icon: <GraduationCap className="w-3 h-3" />, label: 'Egresado' },
        SUSPENDIDO: { cls: 'bg-rose-100 text-rose-800 border-rose-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Suspendido' },
    };
    const { cls, icon, label } = map[estado] ?? map.RETIRADO;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {icon} {label}
        </span>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminStudentsDashboard() {
    const [estudiantes, setEstudiantes] = useState<EstudianteERP[]>([]);
    const [carreras, setCarreras] = useState<CarreraERP[]>([]);
    const [expedienteActivo, setExpedienteActivo] = useState<ExpedienteERP | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

    // Form nuevo estudiante
    const [nuevoEstudiante, setNuevoEstudiante] = useState({
        nombre_completo: '', email: '', password: 'Minerd2025!',
        rne: '', fecha_nacimiento: '', telefono_contacto: '', carrera_id: ''
    });

    const token = localStorage.getItem('lms_minerd_token');
    const headers = { Authorization: `Bearer ${token}` };

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resEst, resCarreras] = await Promise.all([
                axios.get('http://localhost:3000/api/estudiantes', { headers }),
                axios.get('http://localhost:3000/api/curriculum/carreras', { headers })
            ]);
            setEstudiantes(resEst.data);
            setCarreras(resCarreras.data);
        } catch (err) {
            console.error('Error cargando dashboard estudiantes', err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []); // eslint-disable-line

    // ── Filtrado reactivo ──────────────────────────────────────────────────
    const estudiantesFiltrados = useMemo(() => {
        const q = busqueda.toLowerCase().trim();
        return estudiantes.filter(est => {
            const matchBusqueda = !q
                || est.rne.toLowerCase().includes(q)
                || (est.usuario?.nombre_completo ?? '').toLowerCase().includes(q)
                || (est.usuario?.email ?? '').toLowerCase().includes(q);
            const matchEstado = filtroEstado === 'TODOS' || est.estado_academico === filtroEstado;
            return matchBusqueda && matchEstado;
        });
    }, [estudiantes, busqueda, filtroEstado]);

    // ── KPIs ───────────────────────────────────────────────────────────────
    const kpis = useMemo(() => ({
        total: estudiantes.length,
        activos: estudiantes.filter(e => e.estado_academico === 'ACTIVO').length,
        egresados: estudiantes.filter(e => e.estado_academico === 'EGRESADO').length,
        retirados: estudiantes.filter(e => e.estado_academico === 'RETIRADO' || e.estado_academico === 'SUSPENDIDO').length,
    }), [estudiantes]);

    // ── Crear estudiante ───────────────────────────────────────────────────
    const handleCrearEstudiante = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await axios.post('http://localhost:3000/api/estudiantes', nuevoEstudiante, { headers });
            await cargarDatos();
            setIsModalOpen(false);
            setNuevoEstudiante({ nombre_completo: '', email: '', password: 'Minerd2025!', rne: '', fecha_nacimiento: '', telefono_contacto: '', carrera_id: '' });
        } catch {
            alert('No se pudo registrar el estudiante. Verifique que el RNE o Email no estén en uso.');
        } finally {
            setGuardando(false);
        }
    };

    const verExpediente = async (id: number) => {
        try {
            const res = await axios.get(`http://localhost:3000/api/estudiantes/${id}/expediente`, { headers });
            setExpedienteActivo(res.data);
        } catch {
            alert('No se pudo cargar el expediente.');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* ── Cabecera ─────────────────────────────────────────── */}
                <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                ERP · Politécnico Rosario Rojas
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Estudiantes</h1>
                        <p className="text-slate-500 mt-1 text-sm">Expedientes, estados académicos y matrículas centralizadas.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={cargarDatos}
                            className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <UserPlus className="w-4 h-4" /> Nuevo Estudiante
                        </button>
                    </div>
                </header>

                {/* ── KPIs ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard icon={<Users className="w-5 h-5 text-indigo-600" />} label="Total Registro" value={kpis.total} color="bg-indigo-50" />
                    <KpiCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="Activos" value={kpis.activos} color="bg-emerald-50" />
                    <KpiCard icon={<GraduationCap className="w-5 h-5 text-blue-600" />} label="Egresados" value={kpis.egresados} color="bg-blue-50" />
                    <KpiCard icon={<UserX className="w-5 h-5 text-rose-600" />} label="Retirados/Susp." value={kpis.retirados} color="bg-rose-50" />
                </div>

                {/* ── Tabla ────────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Barra de Filtros */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                placeholder="Buscar por RNE, nombre o email..."
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            />
                        </div>
                        <select
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                            className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                        >
                            <option value="TODOS">Todos los Estados</option>
                            <option value="ACTIVO">Solo Activos</option>
                            <option value="EGRESADO">Egresados</option>
                            <option value="RETIRADO">Retirados</option>
                            <option value="SUSPENDIDO">Suspendidos</option>
                        </select>
                        {(busqueda || filtroEstado !== 'TODOS') && (
                            <button
                                onClick={() => { setBusqueda(''); setFiltroEstado('TODOS'); }}
                                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 shrink-0"
                            >
                                <X className="w-3 h-3" /> Limpiar
                            </button>
                        )}
                        <span className="text-xs text-slate-400 shrink-0">
                            {estudiantesFiltrados.length} de {estudiantes.length}
                        </span>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[720px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-6 font-semibold">RNE</th>
                                    <th className="py-3 px-6 font-semibold">Estudiante</th>
                                    <th className="py-3 px-6 font-semibold">Carrera Técnica</th>
                                    <th className="py-3 px-6 font-semibold">Sección</th>
                                    <th className="py-3 px-6 font-semibold">Estado</th>
                                    <th className="py-3 px-6 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cargando ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        Cargando expedientes...
                                    </td></tr>
                                ) : estudiantesFiltrados.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="font-medium">Sin resultados para "{busqueda}"</p>
                                    </td></tr>
                                ) : estudiantesFiltrados.map(est => (
                                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors group">
                                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">{est.rne}</td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-slate-900">{est.usuario?.nombre_completo}</p>
                                            <p className="text-xs text-slate-400">{est.usuario?.email}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-slate-700">{est.carrera_actual?.nombre || <span className="text-amber-500 italic text-xs">Sin carrera</span>}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Ingreso: {new Date(est.fecha_ingreso).toLocaleDateString('es-DO')}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            {est.matriculas && est.matriculas.length > 0
                                                ? <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold border border-slate-200">{est.matriculas[0].seccion?.nombre}</span>
                                                : <span className="text-xs text-amber-500 italic">No matriculado</span>
                                            }
                                        </td>
                                        <td className="py-4 px-6"><EstadoBadge estado={est.estado_academico} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => window.open(`/boletin/${est.id}`, '_blank')}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Ver Boletín de Calificaciones"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => verExpediente(est.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Ver Expediente">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Editar">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Cambiar Estado">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-xs text-slate-400">
                        <p>Mostrando <strong className="text-slate-600">{estudiantesFiltrados.length}</strong> estudiante{estudiantesFiltrados.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* ── Panel Expediente ─────────────────────────────────────────── */}
            {expedienteActivo && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-[560px] max-w-full bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <header className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Expediente Central</h2>
                                <p className="text-slate-500 text-sm font-mono mt-0.5">RNE: {expedienteActivo.rne}</p>
                            </div>
                            <button onClick={() => setExpedienteActivo(null)} className="p-2 hover:bg-slate-200 rounded-lg transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Datos Civiles */}
                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Información Civil y Académica</h3>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
                                    {[
                                        ['Nombres Completos', expedienteActivo.usuario?.nombre_completo],
                                        ['Carrera Estudiada', expedienteActivo.carrera_actual?.nombre],
                                        ['Tutor Legal', expedienteActivo.tutores?.[0]?.nombres_apellidos || 'Sin Tutor'],
                                        ['Teléfono Contacto', expedienteActivo.telefono_contacto || 'No registrado'],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between gap-4">
                                            <span className="text-slate-400 shrink-0">{label}:</span>
                                            <span className="font-semibold text-slate-800 text-right">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Historial de Calificaciones por Módulo */}
                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                    Historial de Calificaciones
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {expedienteActivo.calificaciones_ra?.length ?? 0} notas
                                    </span>
                                </h3>
                                {(expedienteActivo.calificaciones_ra?.length ?? 0) > 0 ? (() => {
                                    // Agrupar por módulo
                                    const porModulo = new Map<string, CalificacionRA_ERP[]>();
                                    (expedienteActivo.calificaciones_ra ?? []).forEach(c => {
                                        const key = c.resultado_aprendizaje?.modulo?.codigo ?? 'SIN_MODULO';
                                        if (!porModulo.has(key)) porModulo.set(key, []);
                                        porModulo.get(key)!.push(c);
                                    });
                                    return (
                                        <div className="space-y-3">
                                            {Array.from(porModulo.entries()).map(([codigo, califs]) => {
                                                const totalModulo = califs.reduce((s, c) => s + c.valor_logrado, 0);
                                                const maxModulo = califs.reduce((s, c) => s + (c.resultado_aprendizaje?.valor_maximo ?? 0), 0);
                                                const aprobado = maxModulo > 0 ? totalModulo >= maxModulo * 0.7 : false;
                                                const moduloNombre = califs[0]?.resultado_aprendizaje?.modulo?.nombre ?? codigo;
                                                return (
                                                    <div key={codigo} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                                        <div className={`px-4 py-2.5 flex justify-between items-center border-b border-slate-100 ${aprobado ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                            <div>
                                                                <span className="text-xs font-bold font-mono text-slate-500">{codigo}</span>
                                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">{moduloNombre}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-slate-800">{totalModulo}<span className="text-xs font-normal text-slate-400">/{maxModulo}</span></p>
                                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                    {aprobado ? 'APROBADO' : 'REPROBADO'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="divide-y divide-slate-50">
                                                            {califs.map((c, i) => (
                                                                <div key={i} className="px-4 py-2 flex justify-between text-xs text-slate-600">
                                                                    <span className="text-slate-400">{c.resultado_aprendizaje?.numero} — {c.resultado_aprendizaje?.descripcion?.slice(0, 40)}…</span>
                                                                    <span className={`font-bold ${c.valor_logrado >= (c.resultado_aprendizaje?.valor_maximo ?? 99) * 0.7 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {c.valor_logrado} pts
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })() : (
                                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
                                        <BookOpen className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">Sin calificaciones registradas aún.</p>
                                    </div>
                                )}
                            </section>

                            {/* Registro Anecdótico */}
                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                                    Registro Anecdótico
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {expedienteActivo.anecdotas?.length || 0} reportes
                                    </span>
                                </h3>
                                {(expedienteActivo.anecdotas?.length ?? 0) > 0 ? (
                                    <div className="space-y-3">
                                        {(expedienteActivo.anecdotas || []).map((a, i) => (
                                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{a.tipo}</span>
                                                    <time className="text-xs text-slate-400">{new Date(a.fecha_registro).toLocaleDateString('es-DO')}</time>
                                                </div>
                                                <p className="text-sm text-slate-700">{a.incidencia}</p>
                                                <p className="text-xs font-semibold text-indigo-500 mt-2">— {a.docente?.usuario?.nombre_completo}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
                                        <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-slate-500">Expediente Disciplinario en Ceros</p>
                                        <p className="text-xs text-slate-400 mt-1">Sin reportes registrados por docentes.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Nuevo Estudiante ───────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Nuevo Estudiante</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Creación de expediente y cuenta de acceso</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCrearEstudiante} className="p-6 flex-1 overflow-y-auto">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                                    <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        value={nuevoEstudiante.nombre_completo}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, nombre_completo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">RNE (Matrícula) *</label>
                                    <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition font-mono"
                                        placeholder="M-XXX-00-00-0000"
                                        value={nuevoEstudiante.rne}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, rne: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de Nacimiento *</label>
                                    <input type="date" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        value={nuevoEstudiante.fecha_nacimiento}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, fecha_nacimiento: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Institucional *</label>
                                    <input type="email" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        value={nuevoEstudiante.email}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña Inicial</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition font-mono"
                                        value={nuevoEstudiante.password}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, password: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono Apoderado</label>
                                    <input type="tel" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                                        value={nuevoEstudiante.telefono_contacto}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, telefono_contacto: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Carrera a Cursar</label>
                                    <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-white"
                                        value={nuevoEstudiante.carrera_id}
                                        onChange={e => setNuevoEstudiante({ ...nuevoEstudiante, carrera_id: e.target.value })}>
                                        <option value="">(Sin carrera por ahora)</option>
                                        {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70">
                                    {guardando
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                                        : 'Completar Registro'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
