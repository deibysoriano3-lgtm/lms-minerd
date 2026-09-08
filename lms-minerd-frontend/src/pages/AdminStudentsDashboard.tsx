import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';
import {
    Search, UserPlus, Edit, Trash2, FileText, CheckCircle, XCircle,
    AlertCircle, RefreshCw, X, Users, GraduationCap, UserX, BookOpen,
    FileSpreadsheet, Upload, Download, FileUp, ToggleLeft, TrendingDown, ChevronDown, ChevronUp
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

// ── Modal Importar Excel ──────────────────────────────────────────────────────
function ImportarModal({ headers, onDescargarPlantilla, onClose, onExito }: {
    headers: any;
    onDescargarPlantilla: () => void;
    onClose: () => void;
    onExito: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState<{ exitosos: number; errores: Array<{ fila: number; nombre: string; error: string }> } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f: File | null) => {
        if (!f) return;
        if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
            alert('Solo se aceptan archivos Excel (.xlsx o .xls)');
            return;
        }
        setArchivo(f);
        setResultado(null);
    };

    const handleImportar = async () => {
        if (!archivo) return;
        setSubiendo(true);
        try {
            const form = new FormData();
            form.append('archivo', archivo);
            const res = await api.post('/api/estudiantes/importar', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResultado(res.data);
            if (res.data.exitosos > 0) onExito();
        } catch {
            alert('Error al procesar el archivo.');
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Importar Estudiantes</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Carga masiva desde archivo Excel</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Paso 1: Plantilla */}
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">Paso 1 — Descarga la plantilla</p>
                            <p className="text-xs text-slate-500 mt-0.5">Rellena los datos en el formato correcto</p>
                        </div>
                        <button onClick={onDescargarPlantilla}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition shrink-0">
                            Descargar
                        </button>
                    </div>

                    {/* Paso 2: Subir archivo */}
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Paso 2 — Sube el archivo completado</p>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onClick={() => fileRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50' : archivo ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                        >
                            {archivo ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                                    <p className="text-sm font-semibold text-emerald-700">{archivo.name}</p>
                                    <p className="text-xs text-slate-400">{(archivo.size / 1024).toFixed(1)} KB · Click para cambiar</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <FileUp className="w-8 h-8" />
                                    <p className="text-sm font-medium">Arrastra el archivo aquí o haz click</p>
                                    <p className="text-xs">.xlsx · .xls</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                            onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                    </div>

                    {/* Resultados */}
                    {resultado && (
                        <div className="rounded-xl border overflow-hidden">
                            <div className={`px-4 py-3 flex items-center gap-3 ${resultado.exitosos > 0 ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-rose-50 border-b border-rose-100'}`}>
                                {resultado.exitosos > 0
                                    ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                }
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {resultado.exitosos} estudiante{resultado.exitosos !== 1 ? 's' : ''} importado{resultado.exitosos !== 1 ? 's' : ''}
                                    </p>
                                    {resultado.errores.length > 0 && (
                                        <p className="text-xs text-rose-600">{resultado.errores.length} fila{resultado.errores.length !== 1 ? 's' : ''} con error</p>
                                    )}
                                </div>
                            </div>
                            {resultado.errores.length > 0 && (
                                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                                    {resultado.errores.map((e, i) => (
                                        <div key={i} className="px-4 py-2 flex items-start gap-3 text-xs">
                                            <span className="text-slate-400 shrink-0">Fila {e.fila}</span>
                                            <span className="text-slate-700 font-medium flex-1">{e.nombre}</span>
                                            <span className="text-rose-500 shrink-0">{e.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        {resultado ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!resultado && (
                        <button onClick={handleImportar} disabled={!archivo || subiendo}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50">
                            {subiendo
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                                : <><Upload className="w-4 h-4" /> Importar</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Modal Cambiar Estado ──────────────────────────────────────────────────────
function CambiarEstadoModal({ estudiante, onClose, onExito }: {
    estudiante: EstudianteERP;
    onClose: () => void;
    onExito: () => void;
}) {
    const [estado, setEstado] = useState<EstadoEstudiante>(estudiante.estado_academico);
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        if (estado === estudiante.estado_academico) { onClose(); return; }
        setGuardando(true);
        try {
            await api.patch(`/api/estudiantes/${estudiante.id}/estado`, { estado_academico: estado });
            onExito();
        } catch {
            alert('No se pudo actualizar el estado.');
        } finally {
            setGuardando(false);
        }
    };

    const opciones: { val: EstadoEstudiante; label: string; color: string }[] = [
        { val: 'ACTIVO', label: 'Activo', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
        { val: 'SUSPENDIDO', label: 'Suspendido', color: 'border-rose-400 bg-rose-50 text-rose-700' },
        { val: 'RETIRADO', label: 'Retirado', color: 'border-slate-400 bg-slate-50 text-slate-600' },
        { val: 'EGRESADO', label: 'Egresado', color: 'border-blue-400 bg-blue-50 text-blue-700' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Cambiar Estado</h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{estudiante.usuario?.nombre_completo}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
                <div className="p-5 space-y-2">
                    {opciones.map(o => (
                        <button key={o.val} onClick={() => setEstado(o.val)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition ${estado === o.val ? o.color : 'border-slate-100 hover:border-slate-300'}`}>
                            {o.label}
                            {estado === o.val && <span className="float-right text-xs opacity-60">✓ Seleccionado</span>}
                        </button>
                    ))}
                </div>
                <div className="px-5 pb-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                    <button onClick={handleGuardar} disabled={guardando}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                        {guardando ? 'Guardando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal Editar Estudiante ───────────────────────────────────────────────────
function EditarEstudianteModal({ estudiante, carreras, onClose, onExito }: {
    estudiante: EstudianteERP;
    carreras: CarreraERP[];
    onClose: () => void;
    onExito: () => void;
}) {
    const [form, setForm] = useState({
        nombre_completo: estudiante.usuario?.nombre_completo ?? '',
        email: estudiante.usuario?.email ?? '',
        rne: estudiante.rne,
        carrera_id: estudiante.carrera_actual?.id?.toString() ?? '',
    });
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await api.put(`/api/estudiantes/${estudiante.id}`, form);
            onExito();
        } catch {
            alert('No se pudo actualizar el estudiante. Verifique que el RNE y Email no estén en uso.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Editar Estudiante</h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">RNE: {estudiante.rne}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleGuardar} className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                        <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Institucional *</label>
                        <input type="email" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">RNE (Matrícula) *</label>
                        <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            value={form.rne} onChange={e => setForm({ ...form, rne: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Carrera Técnica</label>
                        <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-white"
                            value={form.carrera_id} onChange={e => setForm({ ...form, carrera_id: e.target.value })}>
                            <option value="">(Sin carrera)</option>
                            {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
                        <button type="submit" disabled={guardando}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70">
                            {guardando ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminStudentsDashboard() {
    const [estudiantes, setEstudiantes] = useState<EstudianteERP[]>([]);
    const [carreras, setCarreras] = useState<CarreraERP[]>([]);
    const [expedienteActivo, setExpedienteActivo] = useState<ExpedienteERP | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [estudianteEditar, setEstudianteEditar] = useState<EstudianteERP | null>(null);
    const [estudianteCambioEstado, setEstudianteCambioEstado] = useState<EstudianteERP | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [estudiantesRiesgo, setEstudiantesRiesgo] = useState<any[]>([]);
    const [riesgoExpandido, setRiesgoExpandido] = useState(true);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

    // Form nuevo estudiante
    const [nuevoEstudiante, setNuevoEstudiante] = useState({
        nombre_completo: '', email: '', password: 'Minerd2025!',
        rne: '', fecha_nacimiento: '', telefono_contacto: '', carrera_id: ''
    });

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resEst, resCarreras, resRiesgo] = await Promise.all([
                api.get('/api/estudiantes'),
                api.get('/api/curriculum/carreras'),
                api.get('/api/asistencia/riesgo'),
            ]);
            setEstudiantes(resEst.data);
            setCarreras(resCarreras.data);
            setEstudiantesRiesgo(resRiesgo.data);
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
            await api.post('/api/estudiantes', nuevoEstudiante);
            await cargarDatos();
            setIsModalOpen(false);
            setNuevoEstudiante({ nombre_completo: '', email: '', password: 'Minerd2025!', rne: '', fecha_nacimiento: '', telefono_contacto: '', carrera_id: '' });
        } catch {
            alert('No se pudo registrar el estudiante. Verifique que el RNE o Email no estén en uso.');
        } finally {
            setGuardando(false);
        }
    };

    const descargarPlantilla = async () => {
        try {
            const res = await api.get('/api/estudiantes/plantilla', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = 'plantilla_estudiantes.xlsx'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('No se pudo descargar la plantilla.'); }
    };

    const verExpediente = async (id: number) => {
        try {
            const res = await api.get(`/api/estudiantes/${id}/expediente`);
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
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition flex items-center gap-2 shadow-sm"
                        >
                            <Upload className="w-4 h-4" /> Importar Excel
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

                {/* ── Panel de Riesgo ───────────────────────────────────── */}
                {estudiantesRiesgo.length > 0 && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setRiesgoExpandido(v => !v)}
                            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-rose-100/60 transition-colors"
                        >
                            <TrendingDown className="w-5 h-5 text-rose-600 shrink-0" />
                            <div className="flex-1">
                                <span className="font-bold text-rose-800 text-sm">
                                    Estudiantes en Riesgo de Asistencia
                                </span>
                                <span className="ml-2 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {estudiantesRiesgo.length}
                                </span>
                                <span className="text-xs text-rose-500 ml-2">— Menos del 80% de asistencia o 3+ ausencias</span>
                            </div>
                            {riesgoExpandido
                                ? <ChevronUp className="w-4 h-4 text-rose-500 shrink-0" />
                                : <ChevronDown className="w-4 h-4 text-rose-500 shrink-0" />}
                        </button>
                        {riesgoExpandido && (
                            <div className="border-t border-rose-200 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-rose-100/70">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-semibold text-rose-700">Estudiante</th>
                                            <th className="text-center px-3 py-2.5 font-semibold text-rose-700">Días</th>
                                            <th className="text-center px-3 py-2.5 font-semibold text-rose-700">Ausencias</th>
                                            <th className="text-center px-3 py-2.5 font-semibold text-rose-700">Tardanzas</th>
                                            <th className="text-center px-3 py-2.5 font-semibold text-rose-700">% Asist.</th>
                                            <th className="text-center px-3 py-2.5 font-semibold text-rose-700">Anot. Neg.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-100">
                                        {estudiantesRiesgo.map((r: any) => (
                                            <tr key={r.estudiante_id} className="hover:bg-rose-50/80 bg-white/70">
                                                <td className="px-4 py-3 font-medium text-slate-800">{r.nombre}</td>
                                                <td className="px-3 py-3 text-center text-slate-600">{r.total_dias}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className="font-bold text-rose-700">{r.ausencias}</span>
                                                </td>
                                                <td className="px-3 py-3 text-center text-amber-700 font-semibold">{r.tardanzas}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                                                        ${r.pct_asistencia >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {r.pct_asistencia}%
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {r.anecdotas_negativas > 0
                                                        ? <span className="font-bold text-orange-600">{r.anecdotas_negativas}</span>
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

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
                                                    title="Ver Boletín"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => verExpediente(est.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Ver Expediente">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEstudianteEditar(est)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Editar Datos">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEstudianteCambioEstado(est)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition" title="Cambiar Estado Académico">
                                                    <ToggleLeft className="w-4 h-4" />
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

            {/* ── Modal Importar Excel ────────────────────────────────────── */}
            {isImportModalOpen && (
                <ImportarModal
                    headers={{}}
                    onDescargarPlantilla={descargarPlantilla}
                    onClose={() => setIsImportModalOpen(false)}
                    onExito={() => { setIsImportModalOpen(false); cargarDatos(); }}
                />
            )}

            {/* ── Modal Editar ─────────────────────────────────────────────── */}
            {estudianteEditar && (
                <EditarEstudianteModal
                    estudiante={estudianteEditar}
                    carreras={carreras}
                    onClose={() => setEstudianteEditar(null)}
                    onExito={() => { setEstudianteEditar(null); cargarDatos(); }}
                />
            )}

            {/* ── Modal Cambiar Estado ──────────────────────────────────────── */}
            {estudianteCambioEstado && (
                <CambiarEstadoModal
                    estudiante={estudianteCambioEstado}
                    onClose={() => setEstudianteCambioEstado(null)}
                    onExito={() => { setEstudianteCambioEstado(null); cargarDatos(); }}
                />
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
