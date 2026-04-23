import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    BookOpen, AlertTriangle, CheckCircle, Clock,
    FolderOpen, ChevronRight, BarChart2, Layers,
    ClipboardList, Plus, Pencil, Trash2, X, Calendar, FileText
} from 'lucide-react';
import PlanDeMejoraModal from '../components/PlanDeMejoraModal';

const API = 'http://localhost:3000';

type VistaActiva = 'evaluacion' | 'modulos' | 'observaciones' | 'resumen' | 'tareas';

interface Tarea {
    id: number;
    titulo: string;
    descripcion: string;
    instrucciones?: string;
    tipo: string;
    fecha_asignacion: string;
    fecha_entrega: string;
    estado: string;
    seccion: { id: number; nombre: string; grado: string };
}

const TIPO_COLORS: Record<string, string> = {
    TAREA: 'bg-indigo-100 text-indigo-700',
    ACTIVIDAD: 'bg-emerald-100 text-emerald-700',
    EXAMEN: 'bg-rose-100 text-rose-700',
    PROYECTO: 'bg-amber-100 text-amber-700',
};

// ── Toast notification ─────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white
            ${ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {ok
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {msg}
        </div>
    );
}

export default function TeacherGradingDashboard() {
    const [vistaActiva, setVistaActiva] = useState<VistaActiva>('modulos');
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const [cargas, setCargas] = useState<any[]>([]);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [cargaActiva, setCargaActiva] = useState<any>(null);
    const [raActivo, setRaActivo] = useState<any>(null);
    const [estudianteActivoModal, setEstudianteActivoModal] = useState<any>(null);
    const [anecdotarioForm, setAnecdotarioForm] = useState<{ [key: number]: { tipo: string; incidencia: string } }>({});
    const [resumenData, setResumenData] = useState<{ ras: any[]; estudiantes: any[] } | null>(null);

    // Tareas state
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [editingDateId, setEditingDateId] = useState<number | null>(null);
    const [editingFullId, setEditingFullId] = useState<number | null>(null);
    const [showCrearTarea, setShowCrearTarea] = useState(false);
    const [nuevaTarea, setNuevaTarea] = useState({
        titulo: '', descripcion: '', instrucciones: '',
        tipo: 'TAREA', fecha_entrega: '', seccion_id: ''
    });
    const [editForm, setEditForm] = useState<Partial<Tarea & { fecha_entrega: string }>>({});
    const dateInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar cargas académicas del docente
    useEffect(() => {
        const fetchCargas = async () => {
            try {
                const token = localStorage.getItem('lms_minerd_token');
                if (!token) throw new Error('Sin sesión activa.');
                const res = await axios.get('http://localhost:3000/api/evaluaciones/mis-cargas', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCargas(res.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    setErrorMsg('Sesión caducada. Inicie sesión nuevamente.');
                } else if (error.response?.status === 404) {
                    setErrorMsg('Su cuenta no tiene perfil Docente o Carga Académica asignada.');
                } else if (error.message === 'Network Error') {
                    setErrorMsg('Error de red. Verifique que el servidor esté activo en localhost:3000.');
                } else {
                    setErrorMsg('Error del servidor: ' + (error.response?.data?.message || error.message));
                }
            }
        };
        fetchCargas();
    }, []);

    const handleSelectCarga = async (carga: any) => {
        setCargaActiva(carga);
        const esAcademica = !!carga.asignatura_academica;
        if (!esAcademica && carga.modulo_formativo?.resultados_aprendizaje?.length > 0) {
            setRaActivo(carga.modulo_formativo.resultados_aprendizaje[0]);
        } else {
            setRaActivo(null);
        }
        setEstudiantes([]);
        setResumenData(null);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            const clase_id = esAcademica ? carga.asignatura_academica_id : carga.modulo_formativo_id;
            const tipo = esAcademica ? 'ASIGNATURA' : 'MODULO';
            const res = await axios.get(
                `http://localhost:3000/api/evaluaciones/estudiantes/${carga.seccion_id}/${clase_id}/${tipo}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEstudiantes(res.data);
            setVistaActiva('evaluacion');
        } catch {
            showToast('Error cargando estudiantes de la sección.', false);
        }
    };

    const handleGradeChange = (estudianteId: number, valor: string) => {
        if (!raActivo) return;
        let numValor = parseInt(valor) || 0;
        if (numValor > raActivo.valor_maximo) numValor = raActivo.valor_maximo;
        if (numValor < 0) numValor = 0;
        setEstudiantes(estudiantes.map(est => {
            if (est.id !== estudianteId) return est;
            const existing = est.calificaciones.find((c: any) => c.ra_id === raActivo.id);
            let nuevasC = [...est.calificaciones];
            if (existing) {
                nuevasC = nuevasC.map((c: any) => c.ra_id === raActivo.id ? { ...c, valor_logrado: numValor } : c);
            } else {
                nuevasC.push({ ra_id: raActivo.id, valor_logrado: numValor });
            }
            return { ...est, calificaciones: nuevasC };
        }));
    };

    const handleGradeChangeAcad = (estudianteId: number, campo: string, valor: string) => {
        let numValor = parseInt(valor) || 0;
        if (numValor > 100) numValor = 100;
        if (numValor < 0) numValor = 0;
        setEstudiantes(estudiantes.map(est => {
            if (est.id !== estudianteId) return est;
            const current = est.calificaciones_acad?.[0] || { p1: 0, p2: 0, p3: 0, p4: 0 };
            return { ...est, calificaciones_acad: [{ ...current, [campo]: numValor }] };
        }));
    };

    const handleSaveGrades = async () => {
        if (!raActivo) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            for (const est of estudiantes) {
                const notaObj = est.calificaciones.find((c: any) => c.ra_id === raActivo.id);
                if (notaObj) {
                    await axios.post('http://localhost:3000/api/evaluaciones/guardar-nota', {
                        estudiante_id: est.id,
                        ra_id: raActivo.id,
                        valor_logrado: notaObj.valor_logrado
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            showToast(`${raActivo.numero} guardado correctamente.`, true);
        } catch {
            showToast('Error al guardar. Verifique la conexión con el servidor.', false);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGradesAcad = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            for (const est of estudiantes) {
                const notaObj = est.calificaciones_acad?.[0];
                if (notaObj) {
                    await axios.post('http://localhost:3000/api/evaluaciones/guardar-nota-academica', {
                        estudiante_id: est.id,
                        asignatura_id: cargaActiva.asignatura_academica_id,
                        payload: notaObj
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            showToast('Calificaciones P1-P4 guardadas correctamente.', true);
        } catch {
            showToast('Error al guardar. Verifique la conexión con el servidor.', false);
        } finally {
            setSaving(false);
        }
    };

    const openMejoraModal = (est: any) => { setEstudianteActivoModal(est); setModalOpen(true); };

    const fetchResumen = async () => {
        if (!cargaActiva?.modulo_formativo_id || !cargaActiva?.seccion_id) return;
        const token = localStorage.getItem('lms_minerd_token');
        try {
            const res = await axios.get(
                `http://localhost:3000/api/evaluaciones/resumen/${cargaActiva.modulo_formativo_id}/${cargaActiva.seccion_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResumenData(res.data);
            setVistaActiva('resumen');
        } catch {
            showToast('Error cargando resumen de calificaciones.', false);
        }
    };

    const getSumaTotalMF = (est: any) => est.calificaciones.reduce((acc: number, cur: any) => acc + cur.valor_logrado, 0);

    const fetchTareas = async () => {
        try {
            const token = localStorage.getItem('lms_minerd_token');
            const res = await axios.get(`${API}/api/tareas/mis-tareas`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTareas(res.data);
        } catch {
            showToast('Error cargando tareas.', false);
        }
    };

    const handleCrearTarea = async () => {
        if (!nuevaTarea.titulo.trim() || !nuevaTarea.fecha_entrega || !nuevaTarea.seccion_id) {
            showToast('Completa título, fecha de entrega y sección.', false);
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.post(`${API}/api/tareas`, {
                ...nuevaTarea,
                seccion_id: Number(nuevaTarea.seccion_id)
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Tarea creada correctamente.', true);
            setShowCrearTarea(false);
            setNuevaTarea({ titulo: '', descripcion: '', instrucciones: '', tipo: 'TAREA', fecha_entrega: '', seccion_id: '' });
            fetchTareas();
        } catch {
            showToast('Error al crear la tarea.', false);
        } finally {
            setSaving(false);
        }
    };

    const handleActualizarFecha = async (tareaId: number, nuevaFecha: string) => {
        if (!nuevaFecha) return;
        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.patch(`${API}/api/tareas/${tareaId}/fecha-entrega`,
                { fecha_entrega: nuevaFecha },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, fecha_entrega: nuevaFecha } : t));
            showToast('Fecha de entrega actualizada.', true);
        } catch {
            showToast('Error al actualizar la fecha.', false);
        }
        setEditingDateId(null);
    };

    const handleActualizarTarea = async (tareaId: number) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.patch(`${API}/api/tareas/${tareaId}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Tarea actualizada.', true);
            setEditingFullId(null);
            fetchTareas();
        } catch {
            showToast('Error al actualizar la tarea.', false);
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarTarea = async (tareaId: number) => {
        if (!window.confirm('¿Eliminar esta tarea?')) return;
        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.delete(`${API}/api/tareas/${tareaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTareas(prev => prev.filter(t => t.id !== tareaId));
            showToast('Tarea eliminada.', true);
        } catch {
            showToast('Error al eliminar la tarea.', false);
        }
    };

    const getDeadlineStatus = (fechaEntrega: string) => {
        const now = new Date();
        const deadline = new Date(fechaEntrega);
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { label: 'Vencida', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
        if (diffDays <= 2) return { label: `Vence en ${diffDays}d`, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { label: `${diffDays} días`, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
    };

    const handdleSendObservacion = async (estudiante_id: number) => {
        const form = anecdotarioForm[estudiante_id];
        if (!form?.incidencia?.trim()) {
            showToast('Debe escribir la incidencia antes de enviar.', false);
            return;
        }
        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.post('http://localhost:3000/api/evaluaciones/observaciones', {
                estudiante_id,
                incidencia: form.incidencia,
                tipo: form.tipo || 'Academica'
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Registro enviado al Departamento de Orientación.', true);
            setAnecdotarioForm(prev => ({ ...prev, [estudiante_id]: { tipo: 'Academica', incidencia: '' } }));
        } catch {
            showToast('Error al enviar la observación.', false);
        }
    };

    // ── Selector rápido de módulo/clase ────────────────────────
    const ModuleSwitcher = () => (
        <div className="flex items-center gap-2 mb-5 p-3 bg-slate-100 rounded-xl flex-wrap">
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-500 shrink-0">Clase activa:</span>
            <select
                value={cargaActiva?.id ?? ''}
                onChange={(e) => {
                    const c = cargas.find(c => c.id === Number(e.target.value));
                    if (c) handleSelectCarga(c);
                }}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 shadow-sm min-w-0"
            >
                {cargas.map(c => {
                    const esAcad = !!c.asignatura_academica;
                    const nombre = esAcad ? c.asignatura_academica?.nombre : c.modulo_formativo?.nombre;
                    return (
                        <option key={c.id} value={c.id}>
                            {esAcad ? '📚' : '⚙️'} {nombre} · {c.seccion.nombre}
                        </option>
                    );
                })}
            </select>
        </div>
    );

    // ── VISTA: Lista de clases ──────────────────────────────────
    const RenderModulos = () => (
        <div className="animate-in fade-in duration-300">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Mis Clases Asignadas</h1>
                <p className="text-slate-500 mt-1 text-sm">Selecciona una clase para iniciar el registro de calificaciones.</p>
            </header>

            {errorMsg ? (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-700 flex gap-3">
                    <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                        <p className="font-bold">{errorMsg}</p>
                        <p className="text-sm mt-1 opacity-80">Cierre sesión y acceda con la cuenta docente correcta.</p>
                    </div>
                </div>
            ) : cargas.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-12 rounded-xl text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Cargando estructura académica...</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cargas.map(carga => {
                        const esAcademica = !!carga.asignatura_academica;
                        const dataClase = esAcademica ? carga.asignatura_academica : carga.modulo_formativo;
                        const activo = cargaActiva?.id === carga.id;
                        return (
                            <div
                                key={carga.id}
                                onClick={() => handleSelectCarga(carga)}
                                className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer group
                                    ${activo ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                        ${esAcademica ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {esAcademica ? '📚 Académica' : '⚙️ Técnica'}
                                    </span>
                                    {activo && (
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                            Activa
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-mono mb-1">{dataClase?.codigo}</p>
                                <h3 className="text-base font-bold text-slate-800 leading-snug mb-1">{dataClase?.nombre}</h3>
                                <p className="text-sm text-slate-500">{carga.seccion.grado} · Sección {carga.seccion.nombre}</p>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-400">
                                        {esAcademica
                                            ? 'Calificaciones P1 – P4'
                                            : `${dataClase?.resultados_aprendizaje?.length || 0} Resultados de Aprendizaje`}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ── VISTA: Calificaciones RA (módulos técnicos) ─────────────
    const RenderEvaluacion = () => (
        <div className="animate-in fade-in duration-300">
            <ModuleSwitcher />
            {cargaActiva && (
                <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-slate-200 pb-5 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{cargaActiva.seccion.nombre}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{cargaActiva.periodo.nombre}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Registro de Calificaciones — RA</h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            <span className="font-bold text-slate-700 font-mono">{cargaActiva.modulo_formativo.codigo}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            {cargaActiva.modulo_formativo.nombre}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveGrades}
                        disabled={saving}
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-sm
                            ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                    </button>
                </header>
            )}

            {cargaActiva?.modulo_formativo?.resultados_aprendizaje && (
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {cargaActiva.modulo_formativo.resultados_aprendizaje.map((ra: any) => (
                        <button
                            key={ra.id}
                            onClick={() => setRaActivo(ra)}
                            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                                ${raActivo?.id === ra.id
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {ra.numero} <span className="opacity-50 text-xs">({ra.valor_maximo} pts)</span>
                        </button>
                    ))}
                    <div className="ml-auto shrink-0 flex items-center bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                        <span className="text-xs text-amber-700 font-bold">Total módulo: 100 pts</span>
                    </div>
                </div>
            )}

            {raActivo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 text-sm text-slate-600">
                        <strong className="text-slate-900">{raActivo.numero}:</strong> {raActivo.descripcion}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-5 font-semibold">RNE</th>
                                    <th className="py-3 px-5 font-semibold">Estudiante</th>
                                    <th className="py-3 px-5 font-semibold text-center w-36">Nota</th>
                                    <th className="py-3 px-5 font-semibold text-center hidden md:table-cell">Total MF</th>
                                    <th className="py-3 px-5 font-semibold text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {estudiantes.map((est) => {
                                    const califActual = est.calificaciones.find((c: any) => c.ra_id === raActivo.id)?.valor_logrado ?? '';
                                    const total = getSumaTotalMF(est);
                                    return (
                                        <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-5 text-xs text-slate-400 font-mono">{est.rne}</td>
                                            <td className="py-3 px-5 text-sm font-semibold text-slate-800">{est.nombre}</td>
                                            <td className="py-3 px-5">
                                                <div className="relative flex items-center max-w-[110px] mx-auto">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={raActivo.valor_maximo}
                                                        value={califActual}
                                                        onChange={(e) => handleGradeChange(est.id, e.target.value)}
                                                        className={`w-full text-center text-sm font-bold rounded-lg border py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-400/30 transition-colors
                                                            ${Number(califActual) === 0 ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-300 text-blue-700'}`}
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">/{raActivo.valor_maximo}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5 hidden md:table-cell text-center">
                                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm border
                                                    ${total >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : total > 0 ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                        : 'bg-slate-50 text-slate-300 border-slate-200'}`}>
                                                    {total}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                {total < 70 && total > 0 ? (
                                                    <button
                                                        onClick={() => openMejoraModal(est)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" /> Plan Recuperación
                                                    </button>
                                                ) : total >= 70 ? (
                                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Aprobado
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // ── VISTA: Calificaciones académicas P1-P4 ──────────────────
    const RenderEvaluacionAcademica = () => (
        <div className="animate-in fade-in duration-300">
            <ModuleSwitcher />
            {cargaActiva && (
                <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-slate-200 pb-5 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{cargaActiva.seccion.nombre}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{cargaActiva.periodo.nombre}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Registro General Permanente</h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            <span className="font-bold text-slate-700 font-mono">{cargaActiva.asignatura_academica?.codigo}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            {cargaActiva.asignatura_academica?.nombre}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveGradesAcad}
                        disabled={saving}
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-sm
                            ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Calificaciones P1-P4'}
                    </button>
                </header>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="py-3 px-5 font-semibold">Estudiante</th>
                            <th className="py-3 px-4 font-semibold text-center">P1</th>
                            <th className="py-3 px-4 font-semibold text-center">P2</th>
                            <th className="py-3 px-4 font-semibold text-center">P3</th>
                            <th className="py-3 px-4 font-semibold text-center">P4</th>
                            <th className="py-3 px-5 font-semibold text-center">CF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((est) => {
                            const calif = est.calificaciones_acad?.[0] || { p1: '', p2: '', p3: '', p4: '' };
                            const p1 = Number(calif.p1 || 0), p2 = Number(calif.p2 || 0);
                            const p3 = Number(calif.p3 || 0), p4 = Number(calif.p4 || 0);
                            const cf = Math.round((p1 + p2 + p3 + p4) / 4);
                            return (
                                <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-5">
                                        <p className="text-sm font-semibold text-slate-800">{est.nombre}</p>
                                        <p className="text-xs text-slate-400 font-mono">{est.rne}</p>
                                    </td>
                                    {['p1', 'p2', 'p3', 'p4'].map((p) => (
                                        <td key={p} className="py-3 px-4 text-center">
                                            <input
                                                type="number" min="0" max="100"
                                                value={calif[p] === 0 ? '' : calif[p]}
                                                onChange={(e) => handleGradeChangeAcad(est.id, p, e.target.value)}
                                                className="w-14 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:border-indigo-400 focus:bg-white transition-colors outline-none"
                                                placeholder="—"
                                            />
                                        </td>
                                    ))}
                                    <td className="py-3 px-5 text-center">
                                        <span className={`inline-flex items-center justify-center w-12 h-9 rounded-lg font-bold text-sm border
                                            ${cf >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : cf > 0 ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                : 'bg-slate-50 text-slate-300 border-slate-200'}`}>
                                            {cf > 0 ? cf : '—'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // ── VISTA: Anotaciones ──────────────────────────────────────
    const RenderObservaciones = () => (
        <div className="animate-in fade-in duration-300">
            {cargaActiva ? (
                <>
                    <header className="mb-6 border-b border-slate-200 pb-5">
                        <h1 className="text-2xl font-bold text-slate-900">Anotaciones y Orientación</h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Reporta incidencias de <span className="font-semibold text-slate-700">{cargaActiva.seccion.nombre}</span> al Departamento de Orientación.
                        </p>
                    </header>
                    <div className="grid grid-cols-1 gap-5">
                        {estudiantes.map((est) => {
                            const form = anecdotarioForm[est.id] || { tipo: 'Academica', incidencia: '' };
                            return (
                                <div key={est.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row gap-5">
                                    <div className="md:w-1/3">
                                        <p className="font-bold text-slate-800">{est.nombre}</p>
                                        <p className="text-xs text-slate-400 font-mono mb-3">RNE: {est.rne}</p>
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Tipo de Anotación</label>
                                        <select
                                            value={form.tipo}
                                            onChange={(e) => setAnecdotarioForm({ ...anecdotarioForm, [est.id]: { ...form, tipo: e.target.value } })}
                                            className="w-full text-sm rounded-lg border border-slate-200 py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-400/20 bg-white"
                                        >
                                            <option value="Academica">Académica (Logros / Dificultades)</option>
                                            <option value="Conductual">Conductual (Disciplina)</option>
                                            <option value="Asistencia">Asistencia (Tardanzas)</option>
                                            <option value="Familiar">Familiar / Personal</option>
                                        </select>
                                    </div>
                                    <div className="md:w-2/3 flex flex-col gap-3">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Detalle de la Incidencia</label>
                                        <textarea
                                            value={form.incidencia}
                                            onChange={(e) => setAnecdotarioForm({ ...anecdotarioForm, [est.id]: { ...form, incidencia: e.target.value } })}
                                            placeholder={`Describa el evento relacionado con ${est.nombre}...`}
                                            className="w-full text-sm rounded-lg border border-slate-200 p-3 h-24 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                                        />
                                        <button
                                            onClick={() => handdleSendObservacion(est.id)}
                                            className="self-end px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition"
                                        >
                                            Enviar a Orientación
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center text-amber-700">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-400" />
                    <p className="font-bold">Selecciona una clase primero</p>
                    <p className="text-sm mt-1 opacity-80">Ve a "Mis Clases" y haz clic en una para continuar.</p>
                </div>
            )}
        </div>
    );

    // ── VISTA: Resumen de calificaciones ────────────────────────
    const RenderResumen = () => (
        <div className="animate-in fade-in duration-300">
            <header className="mb-5 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Resumen de Calificaciones</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    {cargaActiva?.modulo_formativo?.codigo} · {cargaActiva?.modulo_formativo?.nombre} · Sección {cargaActiva?.seccion?.nombre}
                </p>
            </header>
            {!resumenData ? (
                <p className="text-slate-400 text-sm">Cargando resumen...</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-slate-600">RNE</th>
                                <th className="px-5 py-3 font-semibold text-slate-600">Estudiante</th>
                                {resumenData.ras.map(ra => (
                                    <th key={ra.id} className="px-4 py-3 font-semibold text-slate-600 text-center">
                                        {ra.numero}
                                        <span className="block text-[10px] font-normal text-slate-400">/{ra.max} pts</span>
                                    </th>
                                ))}
                                <th className="px-4 py-3 font-semibold text-center text-slate-600">Total</th>
                                <th className="px-4 py-3 font-semibold text-center text-slate-600">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resumenData.estudiantes.map(est => {
                                const total = resumenData.ras.reduce((acc, ra) => {
                                    const nota = est.notas.find((n: any) => n.ra_id === ra.id);
                                    return acc + (nota?.valor ?? 0);
                                }, 0);
                                const aprobado = total >= 70;
                                return (
                                    <tr key={est.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{est.rne}</td>
                                        <td className="px-5 py-3 font-semibold text-slate-800">{est.nombre}</td>
                                        {resumenData.ras.map(ra => {
                                            const nota = est.notas.find((n: any) => n.ra_id === ra.id);
                                            const valor = nota?.valor ?? null;
                                            return (
                                                <td key={ra.id} className="px-4 py-3 text-center">
                                                    {valor !== null
                                                        ? <span className={`font-bold ${valor >= ra.max * 0.7 ? 'text-emerald-600' : 'text-rose-600'}`}>{valor}</span>
                                                        : <span className="text-slate-200 text-xs">—</span>}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center font-black text-slate-800">{total}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                                ${aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {aprobado ? 'APROBADO' : 'EN RIESGO'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {resumenData.estudiantes.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-8">Sin calificaciones guardadas aún.</p>
                    )}
                </div>
            )}
        </div>
    );

    // ── VISTA: Tareas ─────────────────────────────────────────────
    const RenderTareas = () => {
        const seccionesUnicas = Array.from(
            new Map(cargas.map(c => [c.seccion_id, c.seccion])).values()
        );

        return (
            <div className="animate-in fade-in duration-300 space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestión de Tareas</h1>
                        <p className="text-slate-500 mt-1 text-sm">Crea y gestiona tareas para tus secciones. Haz clic en la fecha para editarla.</p>
                    </div>
                    <button
                        onClick={() => { setShowCrearTarea(true); fetchTareas(); }}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                    >
                        <Plus className="w-4 h-4" /> Nueva Tarea
                    </button>
                </header>

                {/* Modal Crear Tarea */}
                {showCrearTarea && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-slate-900">Nueva Tarea</h2>
                                <button onClick={() => setShowCrearTarea(false)} className="text-slate-400 hover:text-slate-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Título *</label>
                                        <input
                                            value={nuevaTarea.titulo}
                                            onChange={e => setNuevaTarea(p => ({ ...p, titulo: e.target.value }))}
                                            placeholder="Ej: Investigación sobre redes LAN"
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Tipo</label>
                                        <select
                                            value={nuevaTarea.tipo}
                                            onChange={e => setNuevaTarea(p => ({ ...p, tipo: e.target.value }))}
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white"
                                        >
                                            <option value="TAREA">Tarea</option>
                                            <option value="ACTIVIDAD">Actividad</option>
                                            <option value="EXAMEN">Examen</option>
                                            <option value="PROYECTO">Proyecto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Fecha de entrega *</label>
                                        <input
                                            type="date"
                                            value={nuevaTarea.fecha_entrega}
                                            onChange={e => setNuevaTarea(p => ({ ...p, fecha_entrega: e.target.value }))}
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Sección *</label>
                                        <select
                                            value={nuevaTarea.seccion_id}
                                            onChange={e => setNuevaTarea(p => ({ ...p, seccion_id: e.target.value }))}
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white"
                                        >
                                            <option value="">— Seleccionar sección —</option>
                                            {seccionesUnicas.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.grado} · {s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Descripción</label>
                                        <textarea
                                            value={nuevaTarea.descripcion}
                                            onChange={e => setNuevaTarea(p => ({ ...p, descripcion: e.target.value }))}
                                            placeholder="Describe brevemente la tarea..."
                                            rows={2}
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Instrucciones (contenido para estudiantes)</label>
                                        <textarea
                                            value={nuevaTarea.instrucciones}
                                            onChange={e => setNuevaTarea(p => ({ ...p, instrucciones: e.target.value }))}
                                            placeholder="Detalla los pasos, materiales o criterios de evaluación..."
                                            rows={4}
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowCrearTarea(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCrearTarea}
                                        disabled={saving}
                                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Guardando...' : 'Crear Tarea'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de tareas */}
                {tareas.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
                        <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">Sin tareas creadas aún</p>
                        <p className="text-xs mt-1">Haz clic en "Nueva Tarea" para comenzar.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tareas.map(tarea => {
                            const deadline = getDeadlineStatus(tarea.fecha_entrega);
                            const isEditingFull = editingFullId === tarea.id;
                            return (
                                <div key={tarea.id} className={`bg-white rounded-xl border shadow-sm transition-all ${isEditingFull ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                    {isEditingFull ? (
                                        // ── Modo edición completa ──
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Editando tarea</p>
                                                <button onClick={() => setEditingFullId(null)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                                            </div>
                                            <input
                                                value={editForm.titulo ?? ''}
                                                onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))}
                                                className="w-full text-sm font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                placeholder="Título"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={editForm.tipo ?? 'TAREA'}
                                                    onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value }))}
                                                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-indigo-400/30"
                                                >
                                                    <option value="TAREA">Tarea</option>
                                                    <option value="ACTIVIDAD">Actividad</option>
                                                    <option value="EXAMEN">Examen</option>
                                                    <option value="PROYECTO">Proyecto</option>
                                                </select>
                                                <input
                                                    type="date"
                                                    value={editForm.fecha_entrega ? editForm.fecha_entrega.slice(0, 10) : ''}
                                                    onChange={e => setEditForm(p => ({ ...p, fecha_entrega: e.target.value }))}
                                                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30"
                                                />
                                            </div>
                                            <textarea
                                                value={editForm.descripcion ?? ''}
                                                onChange={e => setEditForm(p => ({ ...p, descripcion: e.target.value }))}
                                                rows={2}
                                                placeholder="Descripción..."
                                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
                                            />
                                            <textarea
                                                value={editForm.instrucciones ?? ''}
                                                onChange={e => setEditForm(p => ({ ...p, instrucciones: e.target.value }))}
                                                rows={3}
                                                placeholder="Instrucciones para los estudiantes..."
                                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => setEditingFullId(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
                                                    Cancelar
                                                </button>
                                                <button onClick={() => handleActualizarTarea(tarea.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                                                    {saving ? 'Guardando...' : 'Guardar cambios'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // ── Vista normal ──
                                        <div className="p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[tarea.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                                                            {tarea.tipo}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {tarea.seccion.grado} · Sec. {tarea.seccion.nombre}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 leading-snug">{tarea.titulo}</h3>
                                                    {tarea.descripcion && (
                                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{tarea.descripcion}</p>
                                                    )}
                                                    {tarea.instrucciones && (
                                                        <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> Instrucciones para estudiantes
                                                            </p>
                                                            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{tarea.instrucciones}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => { setEditingFullId(tarea.id); setEditForm({ ...tarea, fecha_entrega: tarea.fecha_entrega.slice(0, 10) }); }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarTarea(tarea.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Fecha de entrega — edición inline */}
                                            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="text-xs text-slate-500 font-medium shrink-0">Fecha de entrega:</span>
                                                {editingDateId === tarea.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            ref={dateInputRef}
                                                            type="date"
                                                            defaultValue={tarea.fecha_entrega.slice(0, 10)}
                                                            autoFocus
                                                            onBlur={e => handleActualizarFecha(tarea.id, e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleActualizarFecha(tarea.id, (e.target as HTMLInputElement).value);
                                                                if (e.key === 'Escape') setEditingDateId(null);
                                                            }}
                                                            className="text-sm border-2 border-indigo-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400/30 bg-indigo-50"
                                                        />
                                                        <button onClick={() => setEditingDateId(null)} className="text-slate-400 hover:text-slate-600">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingDateId(tarea.id)}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 hover:scale-[1.02] cursor-pointer ${deadline.cls}`}
                                                        title="Haz clic para cambiar la fecha"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5 opacity-60" />
                                                        {new Date(tarea.fecha_entrega).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        <span className="opacity-60 font-normal">· {deadline.label}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const esAcademica = !!cargaActiva?.asignatura_academica;
    const nombreClaseActiva = cargaActiva
        ? (esAcademica ? cargaActiva.asignatura_academica?.nombre : cargaActiva.modulo_formativo?.nombre)
        : null;

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans">

            {/* ── Sidebar ── */}
            <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="px-4 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-800">Portal Docente</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Gestión de Calificaciones</p>
                </div>

                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    {/* Mis Clases */}
                    <button
                        onClick={() => setVistaActiva('modulos')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                            ${vistaActiva === 'modulos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        <BookOpen className={`w-4 h-4 shrink-0 ${vistaActiva === 'modulos' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        Mis Clases
                        {cargas.length > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                                {cargas.length}
                            </span>
                        )}
                    </button>

                    {/* Calificar — siempre visible, deshabilitado sin clase activa */}
                    <button
                        onClick={() => cargaActiva && setVistaActiva('evaluacion')}
                        disabled={!cargaActiva}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                            ${vistaActiva === 'evaluacion' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}
                            ${!cargaActiva ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        <CheckCircle className={`w-4 h-4 shrink-0 ${vistaActiva === 'evaluacion' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {esAcademica ? 'Calificaciones P1-P4' : 'Puntear R.A.'}
                    </button>

                    {/* Resumen — solo módulos técnicos */}
                    <button
                        onClick={() => cargaActiva && !esAcademica ? fetchResumen() : undefined}
                        disabled={!cargaActiva || esAcademica}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                            ${vistaActiva === 'resumen' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'}
                            ${!cargaActiva || esAcademica ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        <BarChart2 className={`w-4 h-4 shrink-0 ${vistaActiva === 'resumen' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        Ver Resumen
                    </button>

                    <div className="pt-3 mt-2 border-t border-slate-100 space-y-0.5">
                        <button
                            onClick={() => setVistaActiva('observaciones')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'observaciones' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <FolderOpen className={`w-4 h-4 shrink-0 ${vistaActiva === 'observaciones' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Anotaciones
                        </button>
                        <button
                            onClick={() => { setVistaActiva('tareas'); fetchTareas(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'tareas' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <ClipboardList className={`w-4 h-4 shrink-0 ${vistaActiva === 'tareas' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Tareas
                            {tareas.length > 0 && (
                                <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                    {tareas.length}
                                </span>
                            )}
                        </button>
                    </div>
                </nav>

                {/* Panel de clase activa */}
                {cargaActiva && (
                    <div className="px-3 pb-4">
                        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1.5">Clase activa</p>
                            <p className="text-xs font-bold text-indigo-800 leading-snug line-clamp-2">{nombreClaseActiva}</p>
                            <p className="text-[10px] text-indigo-400 mt-0.5">{cargaActiva.seccion.grado} · Sec. {cargaActiva.seccion.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${esAcademica ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <span className="text-[10px] text-indigo-500 font-medium">
                                    {esAcademica ? 'Asignatura Académica' : 'Módulo Técnico'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Contenido Principal ── */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-5xl mx-auto">
                    {vistaActiva === 'modulos' && RenderModulos()}
                    {vistaActiva === 'evaluacion' && (esAcademica ? RenderEvaluacionAcademica() : RenderEvaluacion())}
                    {vistaActiva === 'observaciones' && RenderObservaciones()}
                    {vistaActiva === 'resumen' && RenderResumen()}
                    {vistaActiva === 'tareas' && RenderTareas()}
                </div>
            </main>

            {/* Modal de Plan de Mejora */}
            <PlanDeMejoraModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                estudiante={{ nombre: estudianteActivoModal?.nombre, sigerd: estudianteActivoModal?.rne }}
                actividadOriginal={{
                    nombre: raActivo?.descripcion + ' (' +
                        (estudianteActivoModal?.calificaciones?.find((c: any) => c.ra_id === raActivo?.id)?.valor_logrado || 0) + ' pts)'
                }}
            />

            {/* Toast notification */}
            {toast && <Toast msg={toast.msg} ok={toast.ok} />}
        </div>
    );
}
