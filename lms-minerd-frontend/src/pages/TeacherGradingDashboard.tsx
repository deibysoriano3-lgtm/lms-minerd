import { useState, useEffect } from 'react';
import api from '../api';
import {
    BookOpen, AlertTriangle, CheckCircle, Clock,
    FolderOpen, ChevronRight, BarChart2, Layers,
    ClipboardList, Plus, Trash2, X, Save, Loader2, Eye, CalendarDays
} from 'lucide-react';
import PlanDeMejoraModal from '../components/PlanDeMejoraModal';
import CalendarioAcademico from '../components/CalendarioAcademico';

type VistaActiva = 'evaluacion' | 'modulos' | 'observaciones' | 'resumen' | 'tareas' | 'asistencia' | 'horario' | 'calendario';

const ESTADO_ASIST: Record<string, { label: string; color: string }> = {
    PRESENTE:   { label: 'Presente',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    AUSENTE:    { label: 'Ausente',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
    TARDANZA:   { label: 'Tardanza',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
    JUSTIFICADO:{ label: 'Justificado',color: 'bg-blue-100 text-blue-700 border-blue-200' },
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

    // ── Estado de Asistencia ─────────────────────────────────────
    const [asistFecha, setAsistFecha] = useState(() => new Date().toISOString().split('T')[0]);
    const [asistRegistros, setAsistRegistros] = useState<Record<number, string>>({});
    const [asistGuardado, setAsistGuardado] = useState(false);
    const [asistCargando, setAsistCargando] = useState(false);

    // ── Estado de Horario ─────────────────────────────────────────
    const [miHorario, setMiHorario] = useState<any[]>([]);
    const [cargandoHorario, setCargandoHorario] = useState(false);
    const [documentosHorario, setDocumentosHorario] = useState<any[]>([]);

    // ── Estado de Tareas ──────────────────────────────────────────
    const [tareas, setTareas] = useState<any[]>([]);
    const [modalTarea, setModalTarea] = useState(false);
    const [tareaEditando, setTareaEditando] = useState<any>(null);
    const [entregasModal, setEntregasModal] = useState<{ tarea: any; lista: any[] } | null>(null);
    const [formTarea, setFormTarea] = useState({ titulo: '', descripcion: '', instrucciones: '', tipo: 'TAREA', prioridad: 'MEDIA', fecha_entrega: '', seccion_id: '', permite_entrega: true });
    const [guardandoTarea, setGuardandoTarea] = useState(false);
    const [secciones, setSecciones] = useState<any[]>([]);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar cargas académicas del docente
    useEffect(() => {
        const fetchCargas = async () => {
            try {
                const res = await api.get('/api/evaluaciones/mis-cargas');
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
            const clase_id = esAcademica ? carga.asignatura_academica_id : carga.modulo_formativo_id;
            const tipo = esAcademica ? 'ASIGNATURA' : 'MODULO';
            const res = await api.get(
                `/api/evaluaciones/estudiantes/${carga.seccion_id}/${clase_id}/${tipo}`
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

    const COMPS = [
        { key: 'com', label: 'Comunicativa' },
        { key: 'cyt', label: 'Científica y Tec.' },
        { key: 'hys', label: 'Humanística y Social' },
        { key: 'dpe', label: 'Des. Personal' },
    ];
    const EMPTY_ACAD = { com_p1:0,com_p2:0,com_p3:0,com_p4:0, cyt_p1:0,cyt_p2:0,cyt_p3:0,cyt_p4:0, hys_p1:0,hys_p2:0,hys_p3:0,hys_p4:0, dpe_p1:0,dpe_p2:0,dpe_p3:0,dpe_p4:0 };

    const handleGradeChangeAcad = (estudianteId: number, campo: string, valor: string) => {
        let numValor = parseInt(valor) || 0;
        if (numValor > 100) numValor = 100;
        if (numValor < 0) numValor = 0;
        setEstudiantes(estudiantes.map(est => {
            if (est.id !== estudianteId) return est;
            const current = est.calificaciones_acad?.[0] || { ...EMPTY_ACAD };
            return { ...est, calificaciones_acad: [{ ...current, [campo]: numValor }] };
        }));
    };

    const handleSaveGrades = async () => {
        if (!raActivo) return;
        setSaving(true);
        try {
            for (const est of estudiantes) {
                const notaObj = est.calificaciones.find((c: any) => c.ra_id === raActivo.id);
                if (notaObj) {
                    await api.post('/api/evaluaciones/guardar-nota', {
                        estudiante_id: est.id,
                        ra_id: raActivo.id,
                        valor_logrado: notaObj.valor_logrado
                    });
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
            for (const est of estudiantes) {
                const notaObj = est.calificaciones_acad?.[0];
                if (notaObj) {
                    await api.post('/api/evaluaciones/guardar-nota-academica', {
                        estudiante_id: est.id,
                        asignatura_id: cargaActiva.asignatura_academica_id,
                        payload: notaObj
                    });
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
        try {
            const res = await api.get(
                `/api/evaluaciones/resumen/${cargaActiva.modulo_formativo_id}/${cargaActiva.seccion_id}`
            );
            setResumenData(res.data);
            setVistaActiva('resumen');
        } catch {
            showToast('Error cargando resumen de calificaciones.', false);
        }
    };

    const getSumaTotalMF = (est: any) => est.calificaciones.reduce((acc: number, cur: any) => acc + cur.valor_logrado, 0);

    const handleSendObservacion = async (estudiante_id: number) => {
        const form = anecdotarioForm[estudiante_id];
        if (!form?.incidencia?.trim()) {
            showToast('Debe escribir la incidencia antes de enviar.', false);
            return;
        }
        try {
            await api.post('/api/evaluaciones/observaciones', {
                estudiante_id,
                incidencia: form.incidencia,
                tipo: form.tipo || 'Academica'
            });
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
                <table className="text-left border-collapse text-xs" style={{ minWidth: 900 }}>
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="py-2 px-4 font-semibold text-left" rowSpan={2}>Estudiante</th>
                            {COMPS.map(c => (
                                <th key={c.key} colSpan={4} className="py-2 px-2 text-center font-bold border-l border-slate-600 text-[11px] uppercase tracking-wide">
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                            {COMPS.map(c =>
                                ['P1','P2','P3','P4'].map(p => (
                                    <th key={`${c.key}-${p}`} className="py-2 px-2 text-center font-bold border-l border-slate-200 w-12">{p}</th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((est) => {
                            const calif = est.calificaciones_acad?.[0] || { ...EMPTY_ACAD };
                            return (
                                <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2 px-4 min-w-[160px]">
                                        <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{est.nombre}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{est.rne}</p>
                                    </td>
                                    {COMPS.map(c =>
                                        (['p1','p2','p3','p4'] as const).map(p => {
                                            const campo = `${c.key}_${p}`;
                                            const val = Number(calif[campo] || 0);
                                            return (
                                                <td key={campo} className="py-1.5 px-1 text-center border-l border-slate-100">
                                                    <input
                                                        type="number" min="0" max="100"
                                                        value={val === 0 ? '' : val}
                                                        onChange={(e) => handleGradeChangeAcad(est.id, campo, e.target.value)}
                                                        className="w-11 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded py-1 focus:border-indigo-400 focus:bg-white transition-colors outline-none"
                                                        placeholder="—"
                                                    />
                                                </td>
                                            );
                                        })
                                    )}
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
                                            onClick={() => handleSendObservacion(est.id)}
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

    // ── Lógica de Tareas ─────────────────────────────────────────
    const fetchTareas = async () => {
        try {
            const r = await api.get('/api/tareas/mis-tareas');
            setTareas(r.data);
        } catch { /* silencio */ }
    };

    const fetchSecciones = async () => {
        if (secciones.length > 0) return;
        const r = await api.get('/api/matricula/secciones');
        setSecciones(Array.isArray(r.data) ? r.data : []);
    };

    const abrirModalNueva = async () => {
        await fetchSecciones();
        setTareaEditando(null);
        setFormTarea({ titulo: '', descripcion: '', instrucciones: '', tipo: 'TAREA', prioridad: 'MEDIA', fecha_entrega: '', seccion_id: '', permite_entrega: true });
        setModalTarea(true);
    };

    const abrirModalEditar = async (t: any) => {
        await fetchSecciones();
        setTareaEditando(t);
        setFormTarea({
            titulo: t.titulo, descripcion: t.descripcion, instrucciones: t.instrucciones ?? '',
            tipo: t.tipo, prioridad: t.prioridad,
            fecha_entrega: t.fecha_entrega?.slice(0, 10) ?? '',
            seccion_id: String(t.seccion_id), permite_entrega: t.permite_entrega,
        });
        setModalTarea(true);
    };

    const handleGuardarTarea = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardandoTarea(true);
        try {
            const body = { ...formTarea, seccion_id: Number(formTarea.seccion_id) };
            if (tareaEditando) {
                const r = await api.patch(`/api/tareas/${tareaEditando.id}`, body);
                setTareas(prev => prev.map(t => t.id === tareaEditando.id ? r.data : t));
            } else {
                const r = await api.post('/api/tareas', body);
                setTareas(prev => [r.data, ...prev]);
            }
            setModalTarea(false);
            showToast(tareaEditando ? 'Tarea actualizada' : 'Tarea creada', true);
        } catch { showToast('Error al guardar la tarea', false); }
        finally { setGuardandoTarea(false); }
    };

    const handleFechaChange = async (tarea: any, fecha: string) => {
        setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, fecha_entrega: fecha } : t));
        try {
            await api.patch(`/api/tareas/${tarea.id}`, { fecha_entrega: fecha });
        } catch { showToast('Error al actualizar fecha', false); }
    };

    const handleCambiarEstado = async (tarea: any, estado: string) => {
        try {
            await api.patch(`/api/tareas/${tarea.id}/estado`, { estado });
            setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, estado, permite_entrega: estado === 'CERRADA' ? false : t.permite_entrega } : t));
            showToast(`Tarea marcada como ${estado.toLowerCase()}`, true);
        } catch { showToast('Error al cambiar estado', false); }
    };

    const handleEliminarTarea = async (id: number) => {
        if (!confirm('¿Eliminar esta tarea? Se borrarán todas las entregas.')) return;
        try {
            await api.delete(`/api/tareas/${id}`);
            setTareas(prev => prev.filter(t => t.id !== id));
            showToast('Tarea eliminada', true);
        } catch { showToast('Error al eliminar', false); }
    };

    const handleVerEntregas = async (tarea: any) => {
        try {
            const r = await api.get(`/api/tareas/${tarea.id}/entregas`);
            setEntregasModal({ tarea, lista: r.data });
        } catch { showToast('Error al cargar entregas', false); }
    };

    const handleMarcarRevisada = async (tarea_id: number, entrega_id: number) => {
        try {
            await api.patch(`/api/tareas/${tarea_id}/entregas/${entrega_id}`, {});
            setEntregasModal(prev => prev ? {
                ...prev,
                lista: prev.lista.map(e => e.entrega?.id === entrega_id ? { ...e, entrega: { ...e.entrega, estado: 'REVISADA' } } : e)
            } : null);
        } catch { showToast('Error al marcar revisada', false); }
    };

    const TIPO_COLOR: Record<string, string> = {
        TAREA: 'bg-blue-100 text-blue-700', ACTIVIDAD: 'bg-teal-100 text-teal-700',
        EXAMEN: 'bg-rose-100 text-rose-700', PROYECTO: 'bg-violet-100 text-violet-700',
        PRACTICA: 'bg-amber-100 text-amber-700',
    };
    const PRIO_COLOR: Record<string, string> = {
        BAJA: 'bg-slate-100 text-slate-600', MEDIA: 'bg-amber-100 text-amber-700', ALTA: 'bg-rose-100 text-rose-700',
    };
    const ESTADO_COLOR: Record<string, string> = {
        ACTIVA: 'bg-emerald-100 text-emerald-700', CERRADA: 'bg-slate-200 text-slate-600', ARCHIVADA: 'bg-slate-100 text-slate-400',
    };

    const DIAS_LABEL: Record<string, string> = { LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb' };
    const DIA_COLOR: Record<string, string> = {
        LUNES: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        MARTES: 'bg-violet-50 border-violet-200 text-violet-700',
        MIERCOLES: 'bg-cyan-50 border-cyan-200 text-cyan-700',
        JUEVES: 'bg-amber-50 border-amber-200 text-amber-700',
        VIERNES: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        SABADO: 'bg-rose-50 border-rose-200 text-rose-700',
    };
    const DIAS_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

    const cargarMiHorario = async () => {
        setCargandoHorario(true);
        try {
            const [rH, rD] = await Promise.all([
                api.get('/api/horario/mi-horario'),
                api.get('/api/horario/documentos'),
            ]);
            setMiHorario(rH.data);
            setDocumentosHorario(rD.data);
        } finally { setCargandoHorario(false); }
    };

    const RenderHorario = () => {
        const DIAS_LABEL: Record<string, string> = {
            LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb'
        };
        const BLOCK_COLORS = [
            'bg-indigo-100 border-indigo-300 text-indigo-900',
            'bg-violet-100 border-violet-300 text-violet-900',
            'bg-cyan-100 border-cyan-300 text-cyan-900',
            'bg-amber-100 border-amber-300 text-amber-900',
            'bg-emerald-100 border-emerald-300 text-emerald-900',
            'bg-rose-100 border-rose-300 text-rose-900',
            'bg-orange-100 border-orange-300 text-orange-900',
            'bg-teal-100 border-teal-300 text-teal-900',
        ];
        const START_H = 7, END_H = 20;
        const GRID_H = 650;
        const TOTAL_MINS = (END_H - START_H) * 60;

        const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const topPx = (t: string) => ((toMins(t) - START_H * 60) / TOTAL_MINS) * GRID_H;
        const heightPx = (s: string, e: string) => Math.max(((toMins(e) - toMins(s)) / TOTAL_MINS) * GRID_H, 28);

        // Assign color per carga
        const colorMap: Record<number, string> = {};
        let ci = 0;
        miHorario.forEach(h => { if (h.carga_id != null && colorMap[h.carga_id] === undefined) { colorMap[h.carga_id] = BLOCK_COLORS[ci++ % BLOCK_COLORS.length]; } });

        const porDia: Record<string, any[]> = {};
        DIAS_ORDEN.forEach(d => { porDia[d] = []; });
        miHorario.forEach(h => { if (porDia[h.dia]) porDia[h.dia].push(h); });
        const diasActivos = DIAS_ORDEN.filter(d => porDia[d].length > 0);
        const horas = Array.from({ length: END_H - START_H + 1 }, (_, i) => `${(START_H + i).toString().padStart(2, '0')}:00`);

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Mi Horario</h2>
                    <p className="text-sm text-slate-500 mt-1">Cuadro semanal de clases asignadas</p>
                </div>

                {cargandoHorario ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : miHorario.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-slate-400">
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No tienes horario estructurado asignado aún.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="flex" style={{ minWidth: `${diasActivos.length * 150 + 56}px` }}>
                                {/* Hour labels */}
                                <div className="w-14 shrink-0 border-r border-slate-200">
                                    <div className="h-10 bg-slate-50 border-b border-slate-200" />
                                    <div className="relative bg-slate-50" style={{ height: `${GRID_H}px` }}>
                                        {horas.map((h, i) => (
                                            <div key={h} className="absolute left-0 right-0 pr-2 text-right"
                                                style={{ top: `${(i / (END_H - START_H)) * GRID_H - 7}px` }}>
                                                <span className="text-[10px] text-slate-400 font-mono">{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Day columns */}
                                {diasActivos.map(dia => (
                                    <div key={dia} className="flex-1 border-r border-slate-200 last:border-r-0">
                                        <div className="h-10 flex items-center justify-center bg-slate-50 border-b border-slate-200">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{DIAS_LABEL[dia]}</span>
                                        </div>
                                        <div className="relative" style={{ height: `${GRID_H}px` }}>
                                            {/* Hour grid lines */}
                                            {horas.map((_, i) => (
                                                <div key={i} className="absolute left-0 right-0 border-t border-slate-100"
                                                    style={{ top: `${(i / (END_H - START_H)) * GRID_H}px` }} />
                                            ))}
                                            {/* Class blocks */}
                                            {porDia[dia].map((h: any) => {
                                                const color = colorMap[h.carga_id] ?? BLOCK_COLORS[0];
                                                const nombre = h.carga?.modulo_formativo?.nombre ?? h.carga?.asignatura_academica?.nombre ?? 'Clase';
                                                const ht = heightPx(h.hora_inicio, h.hora_fin);
                                                return (
                                                    <div key={h.id}
                                                        className={`absolute left-1 right-1 rounded-lg border p-1.5 overflow-hidden flex flex-col gap-0.5 ${color}`}
                                                        style={{ top: `${topPx(h.hora_inicio)}px`, height: `${ht}px` }}>
                                                        <p className="text-[11px] font-bold leading-tight line-clamp-2">{nombre}</p>
                                                        {ht > 44 && <p className="text-[10px] opacity-70 truncate">{h.carga?.seccion?.nombre} {h.carga?.seccion?.grado}</p>}
                                                        {ht > 60 && h.aula && <p className="text-[10px] opacity-60 truncate">🏫 {h.aula}</p>}
                                                        <p className="text-[10px] font-mono opacity-70 mt-auto">{h.hora_inicio}–{h.hora_fin}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Leyenda */}
                {miHorario.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(colorMap).map(([cargaId, color]) => {
                            const h = miHorario.find((x: any) => x.carga_id === Number(cargaId));
                            const nombre = h?.carga?.modulo_formativo?.nombre ?? h?.carga?.asignatura_academica?.nombre ?? 'Clase';
                            return (
                                <span key={cargaId} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
                                    {nombre}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Documentos de horario */}
                {documentosHorario.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-violet-600" /> Documentos de horario
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {documentosHorario.map((d: any) => (
                                <a key={d.id} href={`http://localhost:3000/uploads/horarios/${d.filename}`} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors">
                                    <CalendarDays className="w-5 h-5 text-violet-600 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 truncate">{d.nombre}</p>
                                        {d.descripcion && <p className="text-xs text-slate-500 truncate">{d.descripcion}</p>}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const RenderTareas = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Mis Tareas</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{tareas.length} tarea(s) registrada(s)</p>
                </div>
                <button onClick={abrirModalNueva} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Nueva Tarea
                </button>
            </div>

            {tareas.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay tareas aún</p>
                    <p className="text-sm mt-1">Crea tu primera tarea con el botón de arriba</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tareas.map(t => (
                        <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR[t.tipo] ?? 'bg-slate-100 text-slate-600'}`}>{t.tipo}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIO_COLOR[t.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>{t.prioridad}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[t.estado] ?? 'bg-slate-100 text-slate-600'}`}>{t.estado}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{t.titulo}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.descripcion}</p>
                                    <p className="text-xs text-slate-400 mt-1">Sección: {t.seccion?.nombre ?? '—'} · {t._count?.entregas ?? 0} entregas</p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => handleVerEntregas(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Ver entregas"><Eye className="w-4 h-4" /></button>
                                    <button onClick={() => abrirModalEditar(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors" title="Editar"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => handleEliminarTarea(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-500">Fecha entrega:</label>
                                    <input type="date" className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        value={t.fecha_entrega?.slice(0, 10) ?? ''}
                                        onChange={e => handleFechaChange(t, e.target.value)} />
                                </div>
                                <select
                                    value={t.estado}
                                    onChange={e => handleCambiarEstado(t, e.target.value)}
                                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                >
                                    <option value="ACTIVA">Activa</option>
                                    <option value="CERRADA">Cerrada</option>
                                    <option value="ARCHIVADA">Archivada</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear/Editar */}
            {modalTarea && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b shrink-0">
                            <h2 className="font-bold text-slate-800">{tareaEditando ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                            <button onClick={() => setModalTarea(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleGuardarTarea} className="p-5 overflow-y-auto space-y-3 flex-1">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Título *</label>
                                <input required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    value={formTarea.titulo} onChange={e => setFormTarea(f => ({ ...f, titulo: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción *</label>
                                <textarea required rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    value={formTarea.descripcion} onChange={e => setFormTarea(f => ({ ...f, descripcion: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Instrucciones</label>
                                <textarea rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    value={formTarea.instrucciones} onChange={e => setFormTarea(f => ({ ...f, instrucciones: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Tipo</label>
                                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                        value={formTarea.tipo} onChange={e => setFormTarea(f => ({ ...f, tipo: e.target.value }))}>
                                        {['TAREA', 'ACTIVIDAD', 'EXAMEN', 'PROYECTO', 'PRACTICA'].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Prioridad</label>
                                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                        value={formTarea.prioridad} onChange={e => setFormTarea(f => ({ ...f, prioridad: e.target.value }))}>
                                        {['BAJA', 'MEDIA', 'ALTA'].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha de entrega *</label>
                                    <input required type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        value={formTarea.fecha_entrega} onChange={e => setFormTarea(f => ({ ...f, fecha_entrega: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Sección *</label>
                                    <select required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                        value={formTarea.seccion_id} onChange={e => setFormTarea(f => ({ ...f, seccion_id: e.target.value }))}>
                                        <option value="">Selecciona...</option>
                                        {secciones.map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="permite_entrega" checked={formTarea.permite_entrega}
                                    onChange={e => setFormTarea(f => ({ ...f, permite_entrega: e.target.checked }))} />
                                <label htmlFor="permite_entrega" className="text-sm text-slate-600">Permitir entregas de estudiantes</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setModalTarea(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={guardandoTarea} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                                    {guardandoTarea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {tareaEditando ? 'Guardar cambios' : 'Crear tarea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Entregas */}
            {entregasModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b shrink-0">
                            <div>
                                <h2 className="font-bold text-slate-800">Entregas — {entregasModal.tarea.titulo}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{entregasModal.lista.filter(e => e.entrega).length} / {entregasModal.lista.length} entregaron</p>
                            </div>
                            <button onClick={() => setEntregasModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {entregasModal.lista.map((e: any) => (
                                <div key={e.estudiante_id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${e.entrega ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{e.nombre}</p>
                                        <p className="text-xs text-slate-400">{e.rne} · {e.entrega ? e.entrega.estado : 'PENDIENTE'}</p>
                                    </div>
                                    {e.entrega && e.entrega.estado !== 'REVISADA' && (
                                        <button onClick={() => handleMarcarRevisada(entregasModal.tarea.id, e.entrega.id)}
                                            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                                            Revisada
                                        </button>
                                    )}
                                    {e.entrega?.estado === 'REVISADA' && (
                                        <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-semibold">✓ Revisada</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ── Asistencia helpers ────────────────────────────────────────
    const [asistResumen, setAsistResumen] = useState<any[]>([]);
    const [asistSubVista, setAsistSubVista] = useState<'lista' | 'resumen'>('lista');

    async function cargarAsistencia(fecha: string) {
        if (!cargaActiva) return;
        setAsistCargando(true);
        try {
            let ests = estudiantes;
            if (ests.length === 0) {
                const esAcad = !!cargaActiva.asignatura_academica;
                const clase_id = esAcad ? cargaActiva.asignatura_academica_id : cargaActiva.modulo_formativo_id;
                const tipo = esAcad ? 'ASIGNATURA' : 'MODULO';
                const r = await api.get(`/api/evaluaciones/estudiantes/${cargaActiva.seccion_id}/${clase_id}/${tipo}`);
                ests = r.data;
                setEstudiantes(ests);
            }
            const res = await api.get(`/api/asistencia/seccion/${cargaActiva.seccion_id}?fecha=${fecha}`);
            const mapa: Record<number, string> = {};
            (res.data as any[]).forEach(r => { mapa[r.estudiante_id] = r.estado; });
            ests.forEach(e => { if (!mapa[e.id]) mapa[e.id] = 'PRESENTE'; });
            setAsistRegistros(mapa);
        } catch { } finally { setAsistCargando(false); }
    }

    async function cargarResumenAsistencia() {
        if (!cargaActiva) return;
        try {
            const res = await api.get(`/api/asistencia/resumen/seccion/${cargaActiva.seccion_id}`);
            setAsistResumen(res.data);
            setAsistSubVista('resumen');
        } catch {
            showToast('Error cargando resumen', false);
        }
    }

    async function guardarAsistencia() {
        if (!cargaActiva) return;
        setSaving(true);
        try {
            await api.post('/api/asistencia', {
                seccion_id: cargaActiva.seccion_id,
                fecha: asistFecha,
                registros: Object.entries(asistRegistros).map(([id, estado]) => ({ estudiante_id: Number(id), estado })),
            });
            setAsistGuardado(true);
            showToast('Asistencia guardada correctamente', true);
            setTimeout(() => setAsistGuardado(false), 3000);
        } catch {
            showToast('Error al guardar asistencia', false);
        } finally { setSaving(false); }
    }

    const RenderAsistencia = () => {
        if (!cargaActiva) return (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                Selecciona una clase desde el menú lateral primero.
            </div>
        );
        const conteo = Object.values(asistRegistros).reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc; }, {} as Record<string, number>);

        return (
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Asistencia</h2>
                        <p className="text-sm text-slate-500">{cargaActiva.seccion?.nombre} · {cargaActiva.modulo_formativo?.nombre ?? cargaActiva.asignatura_academica?.nombre}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setAsistSubVista('lista'); cargarAsistencia(asistFecha); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${asistSubVista === 'lista' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            Pasar Lista
                        </button>
                        <button onClick={cargarResumenAsistencia}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${asistSubVista === 'resumen' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            Ver Resumen
                        </button>
                    </div>
                </div>

                {/* Sub-vista: Pasar Lista */}
                {asistSubVista === 'lista' && (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <input type="date" value={asistFecha}
                                onChange={e => { setAsistFecha(e.target.value); setAsistRegistros({}); cargarAsistencia(e.target.value); }}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            <button onClick={() => cargarAsistencia(asistFecha)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
                                Cargar
                            </button>
                            {Object.keys(asistRegistros).length > 0 && (
                                <>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(ESTADO_ASIST).map(([k, v]) => conteo[k] ? (
                                            <span key={k} className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${v.color}`}>
                                                {v.label}: {conteo[k]}
                                            </span>
                                        ) : null)}
                                    </div>
                                    <button onClick={() => setAsistRegistros(r => Object.fromEntries(Object.keys(r).map(k => [k, 'PRESENTE'])))}
                                        className="ml-auto px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">
                                        Todos presentes
                                    </button>
                                </>
                            )}
                        </div>

                        {asistCargando && <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>}

                        {!asistCargando && Object.keys(asistRegistros).length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {estudiantes.map(est => (
                                        <div key={est.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{est.usuario?.nombre_completo}</p>
                                                <p className="text-xs text-slate-400">{est.rne}</p>
                                            </div>
                                            <div className="flex gap-1.5 flex-wrap justify-end">
                                                {Object.entries(ESTADO_ASIST).map(([k, v]) => (
                                                    <button key={k}
                                                        onClick={() => setAsistRegistros(r => ({ ...r, [est.id]: k }))}
                                                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${asistRegistros[est.id] === k ? `${v.color} ring-2 ring-offset-1 ring-indigo-400` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-slate-100 flex justify-end">
                                    <button onClick={guardarAsistencia} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                        <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Asistencia'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!asistCargando && Object.keys(asistRegistros).length === 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                                Haz clic en <strong>Cargar</strong> para ver los estudiantes de esta fecha.
                            </div>
                        )}
                    </>
                )}

                {/* Sub-vista: Resumen acumulado */}
                {asistSubVista === 'resumen' && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {asistResumen.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No hay registros de asistencia aún para esta sección.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Estudiante</th>
                                        <th className="text-center px-3 py-3 font-semibold text-slate-600">Días</th>
                                        <th className="text-center px-3 py-3 font-semibold text-emerald-600">P</th>
                                        <th className="text-center px-3 py-3 font-semibold text-rose-600">A</th>
                                        <th className="text-center px-3 py-3 font-semibold text-amber-600">T</th>
                                        <th className="text-center px-3 py-3 font-semibold text-slate-600">% Asist.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {asistResumen.sort((a, b) => a.pct_asistencia - b.pct_asistencia).map((r: any) => (
                                        <tr key={r.estudiante_id} className={r.pct_asistencia < 80 ? 'bg-rose-50' : ''}>
                                            <td className="px-4 py-3 font-medium text-slate-800">{r.nombre}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{r.total_dias}</td>
                                            <td className="px-3 py-3 text-center text-emerald-700 font-semibold">{r.total_dias - r.ausencias - r.tardanzas}</td>
                                            <td className="px-3 py-3 text-center text-rose-700 font-semibold">{r.ausencias}</td>
                                            <td className="px-3 py-3 text-center text-amber-700 font-semibold">{r.tardanzas}</td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                                                    ${r.pct_asistencia >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                      r.pct_asistencia >= 80 ? 'bg-amber-100 text-amber-700' :
                                                      'bg-rose-100 text-rose-700'}`}>
                                                    {r.pct_asistencia}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
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

                    <div className="pt-3 mt-2 border-t border-slate-100">
                        <button
                            onClick={() => setVistaActiva('observaciones')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'observaciones' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <FolderOpen className={`w-4 h-4 shrink-0 ${vistaActiva === 'observaciones' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Anotaciones
                        </button>
                        <button
                            onClick={() => { setVistaActiva('asistencia'); setAsistSubVista('lista'); if (cargaActiva) cargarAsistencia(asistFecha); }}
                            disabled={!cargaActiva}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'asistencia' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}
                                ${!cargaActiva ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <Layers className={`w-4 h-4 shrink-0 ${vistaActiva === 'asistencia' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Asistencia
                        </button>
                        <button
                            onClick={() => { setVistaActiva('tareas'); fetchTareas(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'tareas' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <ClipboardList className={`w-4 h-4 shrink-0 ${vistaActiva === 'tareas' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Mis Tareas
                            {tareas.length > 0 && (
                                <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                    {tareas.filter(t => t.estado === 'ACTIVA').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { setVistaActiva('horario'); if (miHorario.length === 0) cargarMiHorario(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'horario' ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <CalendarDays className={`w-4 h-4 shrink-0 ${vistaActiva === 'horario' ? 'text-violet-600' : 'text-slate-400'}`} />
                            Mi Horario
                        </button>
                        <button
                            onClick={() => setVistaActiva('calendario')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                ${vistaActiva === 'calendario' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <CalendarDays className={`w-4 h-4 shrink-0 ${vistaActiva === 'calendario' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            Calendario
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
                    {vistaActiva === 'asistencia' && RenderAsistencia()}
                    {vistaActiva === 'tareas' && RenderTareas()}
                    {vistaActiva === 'horario' && RenderHorario()}
                    {vistaActiva === 'calendario' && <CalendarioAcademico puedeEditar={true} seccionId={cargaActiva?.seccion_id} />}
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
