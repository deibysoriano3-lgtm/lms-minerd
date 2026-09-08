import { useState, useEffect, useMemo } from 'react';
import api, { API_BASE_URL } from '../api';
import { Search, Plus, Edit, FileText, Briefcase, Trash2, LayoutList, Loader2, X, GraduationCap, Users, BookOpen, CheckCircle2, ClipboardList, LayoutGrid, CalendarDays, Upload, Clock, Eye } from 'lucide-react';
import CalendarioAcademico from '../components/CalendarioAcademico';

export default function AdminAcademicDashboard() {
    const [vistaActiva, setVistaActiva] = useState<'docentes' | 'carreras' | 'sicologos' | 'horarios' | 'calendario'>('carreras');
    const [carreras, setCarreras] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [sicologos, setSicologos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // Modal sicólogo
    const [modalSicologo, setModalSicologo] = useState(false);
    const [formSico, setFormSico] = useState({ nombre_completo: '', email: '', cedula: '', password: '123456' });
    const [guardandoSico, setGuardandoSico] = useState(false);
    const [errorSico, setErrorSico] = useState('');

    // Modal secciones de sicólogo
    const [modalSecciones, setModalSecciones] = useState<{ id: number; nombre: string; secciones: any[] } | null>(null);
    const [todasSecciones, setTodasSecciones] = useState<any[]>([]);
    const [seccionesAsignadas, setSeccionesAsignadas] = useState<Set<number>>(new Set());
    const [guardandoSecciones, setGuardandoSecciones] = useState(false);

    // Horarios
    const [horarioSubTab, setHorarioSubTab] = useState<'documentos' | 'estructurado'>('documentos');
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [cargasHorario, setCargasHorario] = useState<any[]>([]);
    const [seccionHorario, setSeccionHorario] = useState('');
    const [cargandoHorario, setCargandoHorario] = useState(false);
    const [subiendoDoc, setSubiendoDoc] = useState(false);
    const [formDoc, setFormDoc] = useState({ nombre: '', descripcion: '' });
    const [archivoDoc, setArchivoDoc] = useState<File | null>(null);
    const [modalSlot, setModalSlot] = useState<{ carga_id: number; label: string } | null>(null);
    const [formSlot, setFormSlot] = useState({ dia: 'LUNES', hora_inicio: '07:00', hora_fin: '09:00', aula: '' });

    // Búsqueda/filtros
    const [busquedaCarrera, setBusquedaCarrera] = useState('');
    const [busquedaDocente, setBusquedaDocente] = useState('');

    // Modal de Nueva Carrera
    const [isModalCarreraOpen, setIsModalCarreraOpen] = useState(false);
    const [familias, setFamilias] = useState<any[]>([]);
    const [nuevaCarrera, setNuevaCarrera] = useState({ codigo_minerd: '', nombre: '', familia_profesional_id: 0, duracion_anios: 3 });
    const [guardando, setGuardando] = useState(false);

    // Modal de Nuevo Módulo
    const [isModalModuloOpen, setIsModalModuloOpen] = useState(false);
    const [carreraSeleccionada, setCarreraSeleccionada] = useState<any>(null);
    const [nuevoModulo, setNuevoModulo] = useState({ codigo: '', nombre: '', horas_totales: 0 });

    // Modal de Editar Docente
    const [docenteEditando, setDocenteEditando] = useState<any>(null);
    const [editForm, setEditForm] = useState({ nombre_completo: '', especialidad_tecnica: '', grado_academico: '' });

    // Modal de Cargas Académicas
    const [docenteCargas, setDocenteCargas] = useState<any>(null);
    const [periodos, setPeriodos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [modulos, setModulos] = useState<any[]>([]);
    const [asignaturas, setAsignaturas] = useState<any[]>([]);
    const [nuevaCarga, setNuevaCarga] = useState({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
    const [guardandoCarga, setGuardandoCarga] = useState(false);
    const [errorCarga, setErrorCarga] = useState('');

    const abrirModalCargas = async (doc: any) => {
        setDocenteCargas(doc);
        setErrorCarga('');
        setNuevaCarga({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
        if (periodos.length === 0) {
            const [rP, rS, rM, rA] = await Promise.all([
                api.get(`/api/matricula/periodos`),
                api.get(`/api/matricula/secciones`),
                api.get(`/api/curriculum/modulos`).catch(() => ({ data: [] })),
                api.get(`/api/curriculum/asignaturas`).catch(() => ({ data: [] })),
            ]);
            setPeriodos(rP.data);
            setSecciones(rS.data);
            setModulos(rM.data);
            setAsignaturas(rA.data);
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
            const res = await api.get(`/api/docentes`);
            setDocentes(res.data);
            const updated = res.data.find((d: any) => d.id === docenteCargas.id);
            if (updated) setDocenteCargas(updated);
            setNuevaCarga({ periodo_id: '', seccion_id: '', modulo_formativo_id: '', asignatura_academica_id: '' });
        } catch (e: any) {
            setErrorCarga(e.response?.data?.message ?? 'Error al asignar. Puede que ya exista esa combinación.');
        } finally { setGuardandoCarga(false); }
    };

    const handleEliminarCarga = async (carga_id: number) => {
        if (!confirm('¿Eliminar esta asignación?')) return;
        try {
            await api.delete(`/api/docentes/cargas/${carga_id}`);
            const res = await api.get(`/api/docentes`);
            setDocentes(res.data);
            const updated = res.data.find((d: any) => d.id === docenteCargas.id);
            if (updated) setDocenteCargas(updated);
        } catch { alert('Error al eliminar la asignación.'); }
    };

    // Modal de Registrar Docente
    const [isModalDocenteOpen, setIsModalDocenteOpen] = useState(false);
    const [nuevoDocente, setNuevoDocente] = useState({ nombre_completo: '', email: '', password: 'Minerd2025!', cedula: '', especialidad_tecnica: '', grado_academico: '' });
    const [guardandoDocente, setGuardandoDocente] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setCargando(true);
            try {
                // Traer Carreras Completas con conteo de Módulos (Backend Prisma)
                const resC = await api.get('/api/curriculum/carreras');
                setCarreras(resC.data);

                // Traer Staff Docente (Backend Prisma)
                const resD = await api.get('/api/docentes');
                setDocentes(resD.data);
                // Traer sicólogos
                const resS = await api.get('/api/sicologo/lista');
                setSicologos(Array.isArray(resS.data) ? resS.data : []);
                // Traer Familias (Backend Prisma)
                const resF = await api.get('/api/curriculum/familias');
                setFamilias(resF.data);
                if (resF.data.length > 0) {
                    setNuevaCarrera(prev => ({ ...prev, familia_profesional_id: resF.data[0].id }));
                }

            } catch (error) {
                console.error("Error cargando el Directorio Académico", error);
            } finally {
                setCargando(false);
            }
        };

        fetchData();
    }, []);

    const handleCrearCarrera = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await api.post('/api/curriculum/carreras', nuevaCarrera);

            // Recargar catálogo
            const resC = await api.get('/api/curriculum/carreras');
            setCarreras(resC.data);

            setIsModalCarreraOpen(false);
            setNuevaCarrera({ codigo_minerd: '', nombre: '', familia_profesional_id: familias[0]?.id || 0, duracion_anios: 3 });
        } catch (error) {
            console.error("Error al crear carrera", error);
        } finally {
            setGuardando(false);
        }
    };

    const handleCrearModulo = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await api.post('/api/curriculum/modulos', {
                ...nuevoModulo,
                carrera_id: carreraSeleccionada.id
            });

            // Recargar catálogo para refrescar conteo
            const resC = await api.get('/api/curriculum/carreras');
            setCarreras(resC.data);

            setIsModalModuloOpen(false);
            setNuevoModulo({ codigo: '', nombre: '', horas_totales: 0 });
            setCarreraSeleccionada(null);
        } catch (error) {
            console.error("Error al crear módulo", error);
        } finally {
            setGuardando(false);
        }
    };

    const abrirEditorDocente = (doc: any) => {
        setDocenteEditando(doc);
        setEditForm({
            nombre_completo: doc.usuario?.nombre_completo ?? '',
            especialidad_tecnica: doc.especialidad_tecnica ?? '',
            grado_academico: doc.grado_academico ?? '',
        });
    };

    const handleActualizarDocente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docenteEditando) return;
        setGuardando(true);
        try {
            await api.patch(`/api/docentes/${docenteEditando.id}`, editForm);
            // Refrescar lista
            const res = await api.get('/api/docentes');
            setDocentes(res.data);
            setDocenteEditando(null);
        } catch { alert('No se pudo actualizar el docente.'); }
        finally { setGuardando(false); }
    };

    const handleCrearDocente = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardandoDocente(true);
        try {
            await api.post('/api/docentes', nuevoDocente);
            const res = await api.get('/api/docentes');
            setDocentes(res.data);
            setIsModalDocenteOpen(false);
            setNuevoDocente({ nombre_completo: '', email: '', password: 'Minerd2025!', cedula: '', especialidad_tecnica: '', grado_academico: '' });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al registrar docente. Verifique que la cédula y el email no estén duplicados.');
        } finally {
            setGuardandoDocente(false);
        }
    };

    const handleCambiarEstadoDocente = async (id: number, nuevoEstado: string) => {
        await api.patch(`/api/docentes/${id}/estado`, { estado_laboral: nuevoEstado });
        setDocentes(prev => prev.map(d => d.id === id ? { ...d, estado_laboral: nuevoEstado } : d));
    };

    // ── Handlers de horarios ───────────────────────────────────────────────
    const cargarDocumentos = async () => {
        const res = await api.get('/api/horario/documentos');
        setDocumentos(res.data);
    };

    const cargarCargasHorario = async (seccion_id?: string) => {
        setCargandoHorario(true);
        try {
            const url = seccion_id ? `/api/horario/cargas?seccion_id=${seccion_id}` : '/api/horario/cargas';
            const res = await api.get(url);
            setCargasHorario(res.data);
        } finally { setCargandoHorario(false); }
    };

    const handleSubirDocumento = async () => {
        if (!archivoDoc) { alert('Selecciona un archivo.'); return; }
        setSubiendoDoc(true);
        try {
            const fd = new FormData();
            fd.append('archivo', archivoDoc);
            fd.append('nombre', formDoc.nombre || archivoDoc.name);
            fd.append('descripcion', formDoc.descripcion);
            await api.post('/api/horario/documentos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await cargarDocumentos();
            setFormDoc({ nombre: '', descripcion: '' });
            setArchivoDoc(null);
        } catch { alert('Error al subir el documento.'); }
        finally { setSubiendoDoc(false); }
    };

    const handleEliminarDocumento = async (id: number) => {
        if (!confirm('¿Eliminar este documento?')) return;
        await api.delete(`/api/horario/documentos/${id}`);
        setDocumentos(prev => prev.filter(d => d.id !== id));
    };

    const handleAgregarSlot = async () => {
        if (!modalSlot) return;
        await api.post(`/api/horario/cargas/${modalSlot.carga_id}/slots`, formSlot);
        await cargarCargasHorario(seccionHorario || undefined);
        setModalSlot(null);
        setFormSlot({ dia: 'LUNES', hora_inicio: '07:00', hora_fin: '09:00', aula: '' });
    };

    const handleEliminarSlot = async (slot_id: number) => {
        await api.delete(`/api/horario/slots/${slot_id}`);
        await cargarCargasHorario(seccionHorario || undefined);
    };

    const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const DIAS_LABEL: Record<string, string> = { LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb' };
    const DIA_COLOR: Record<string, string> = {
        LUNES: 'bg-indigo-100 text-indigo-700',
        MARTES: 'bg-violet-100 text-violet-700',
        MIERCOLES: 'bg-cyan-100 text-cyan-700',
        JUEVES: 'bg-amber-100 text-amber-700',
        VIERNES: 'bg-emerald-100 text-emerald-700',
        SABADO: 'bg-rose-100 text-rose-700',
    };

    // ── Filtrados reactivos ────────────────────────────────────────────────
    const carrerasFiltradas = useMemo(() => {
        const q = busquedaCarrera.toLowerCase().trim();
        if (!q) return carreras;
        return carreras.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.codigo_minerd?.toLowerCase().includes(q) ||
            c.familia?.nombre?.toLowerCase().includes(q)
        );
    }, [carreras, busquedaCarrera]);

    const docentesFiltrados = useMemo(() => {
        const q = busquedaDocente.toLowerCase().trim();
        if (!q) return docentes;
        return docentes.filter(d =>
            (d.usuario?.nombre_completo ?? '').toLowerCase().includes(q) ||
            d.cedula?.toLowerCase().includes(q) ||
            (d.especialidad_tecnica ?? '').toLowerCase().includes(q)
        );
    }, [docentes, busquedaDocente]);

    const getEstadoCarrera = (estado: string) => {
        switch (estado) {
            case 'ACTIVA': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">ACTIVA</span>;
            case 'EN_REVISION': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold">REV. DISTRITO</span>;
            default: return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-semibold">INACTIVA</span>;
        }
    };

    const getEstadoDocente = (estado: string) => {
        switch (estado) {
            case 'ACTIVO': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold px-2 py-1 rounded">Activo</span>;
            case 'LICENCIA': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold px-2 py-1 rounded">Licencia Médica</span>;
            default: return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-semibold px-2 py-1 rounded">Inactivo</span>;
        }
    };

    const handleCrearSicologo = async () => {
        if (!formSico.nombre_completo || !formSico.email || !formSico.cedula) { setErrorSico('Completa todos los campos.'); return; }
        setGuardandoSico(true); setErrorSico('');
        try {
            await api.post('/api/sicologo/crear', formSico);
            const res = await api.get('/api/sicologo/lista');
            setSicologos(Array.isArray(res.data) ? res.data : []);
            setModalSicologo(false);
            setFormSico({ nombre_completo: '', email: '', cedula: '', password: '123456' });
        } catch (e: any) { setErrorSico(e.response?.data?.message ?? 'Error al crear'); }
        finally { setGuardandoSico(false); }
    };

    const abrirModalSecciones = async (sico: any) => {
        if (todasSecciones.length === 0) {
            const res = await api.get('/api/matricula/secciones');
            setTodasSecciones(res.data);
        }
        const asignadas = new Set<number>((sico.secciones ?? []).map((ss: any) => ss.seccion.id));
        setSeccionesAsignadas(asignadas);
        setModalSecciones({ id: sico.id, nombre: sico.usuario?.nombre_completo ?? '', secciones: sico.secciones ?? [] });
    };

    const toggleSeccion = (seccion_id: number) => {
        setSeccionesAsignadas(prev => {
            const next = new Set(prev);
            if (next.has(seccion_id)) next.delete(seccion_id); else next.add(seccion_id);
            return next;
        });
    };

    const guardarSecciones = async () => {
        if (!modalSecciones) return;
        setGuardandoSecciones(true);
        try {
            const currentIds = new Set<number>((modalSecciones.secciones ?? []).map((ss: any) => ss.seccion.id));
            const toAdd = [...seccionesAsignadas].filter(id => !currentIds.has(id));
            const toRemove = [...currentIds].filter(id => !seccionesAsignadas.has(id));
            if (toAdd.length > 0) await api.post(`/api/sicologo/${modalSecciones.id}/secciones`, { seccion_ids: toAdd });
            for (const sid of toRemove) await api.delete(`/api/sicologo/${modalSecciones.id}/secciones/${sid}`);
            const res = await api.get('/api/sicologo/lista');
            setSicologos(Array.isArray(res.data) ? res.data : []);
            setModalSecciones(null);
        } catch { alert('Error al guardar secciones.'); }
        finally { setGuardandoSecciones(false); }
    };

    const RenderSicologos = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Personal de Orientación Escolar</h3>
                <button onClick={() => setModalSicologo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                    <Plus className="w-4 h-4" /> Nuevo Sicólogo
                </button>
            </div>
            {sicologos.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    No hay sicólogos registrados. Crea el primero con el botón de arriba.
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left p-3 font-semibold text-slate-600">Nombre</th>
                                <th className="text-left p-3 font-semibold text-slate-600">Email</th>
                                <th className="text-left p-3 font-semibold text-slate-600">Cédula</th>
                                <th className="text-center p-3 font-semibold text-slate-600">Secciones</th>
                                <th className="text-center p-3 font-semibold text-slate-600">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sicologos.map((s: any) => (
                                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-teal-50/30 transition-colors">
                                    <td className="p-3 font-semibold text-slate-800">{s.usuario?.nombre_completo}</td>
                                    <td className="p-3 text-slate-500">{s.usuario?.email}</td>
                                    <td className="p-3 text-slate-500">{s.cedula}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => abrirModalSecciones(s)}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            {(s.secciones ?? []).length} sección(es)
                                        </button>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.estado_laboral === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {s.estado_laboral}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal gestionar secciones */}
            {modalSecciones && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Secciones asignadas</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{modalSecciones.nombre}</p>
                            </div>
                            <button onClick={() => setModalSecciones(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-2">
                            {todasSecciones.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">No hay secciones disponibles.</p>
                            ) : (
                                todasSecciones.map((sec: any) => (
                                    <label key={sec.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                                        <input type="checkbox" checked={seccionesAsignadas.has(sec.id)}
                                            onChange={() => toggleSeccion(sec.id)}
                                            className="w-4 h-4 rounded accent-teal-600" />
                                        <span className="flex-1 text-sm">
                                            <span className="font-semibold text-slate-800">{sec.nombre}</span>
                                            <span className="text-slate-500 ml-2 text-xs">{sec.grado} · {sec.carrera?.nombre}</span>
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-200 shrink-0">
                            <button onClick={() => setModalSecciones(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                            <button onClick={guardarSecciones} disabled={guardandoSecciones} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                                {guardandoSecciones ? 'Guardando...' : 'Guardar secciones'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear sicólogo */}
            {modalSicologo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Nuevo Sicólogo / Orientador</h2>
                            <button onClick={() => { setModalSicologo(false); setErrorSico(''); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            {errorSico && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{errorSico}</p>}
                            {[
                                { label: 'Nombre completo', key: 'nombre_completo', placeholder: 'Ej. Rafael Díaz Ortega' },
                                { label: 'Email institucional', key: 'email', placeholder: 'sicologo2@minerd.gob.do' },
                                { label: 'Cédula', key: 'cedula', placeholder: '001-0000000-0' },
                                { label: 'Contraseña inicial', key: 'password', placeholder: '123456' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">{f.label}</label>
                                    <input value={(formSico as any)[f.key]} onChange={e => setFormSico(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-200">
                            <button onClick={() => { setModalSicologo(false); setErrorSico(''); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                            <button onClick={handleCrearSicologo} disabled={guardandoSico} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                                {guardandoSico ? 'Guardando...' : 'Crear Sicólogo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const RenderCarreras = () => (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        value={busquedaCarrera}
                        onChange={e => setBusquedaCarrera(e.target.value)}
                        placeholder="Buscar título o código..."
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:border-indigo-500 bg-white"
                    />
                </div>
                <span className="text-xs text-slate-400 shrink-0">{carrerasFiltradas.length} resultados</span>
                <button onClick={() => setIsModalCarreraOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Registrar Título
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {carrerasFiltradas.map((carr) => (
                    <div key={carr.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-indigo-50 text-indigo-700 font-mono text-xs px-2 py-1 rounded border border-indigo-100">{carr.codigo_minerd}</span>
                            {getEstadoCarrera(carr.estado)}
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1 leading-tight">{carr.nombre}</h3>
                        <p className="text-xs text-slate-500 mb-4">{carr.familia?.nombre} · {carr.duracion_anios} años</p>

                        <div className="flex gap-4 border-t border-slate-100 pt-3">
                            <button
                                onClick={() => { setCarreraSeleccionada(carr); setIsModalModuloOpen(true); }}
                                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                                <Plus className="w-3.5 h-3.5" /> Añadir Módulo
                            </button>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <LayoutList className="w-3.5 h-3.5" /> {carr._count?.modulos || 0} Módulos
                            </span>
                        </div>
                    </div>
                ))}
                {carrerasFiltradas.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Sin resultados para "{busquedaCarrera}"</p>
                    </div>
                )}
            </div>
        </div>
    );

    const RenderDocentes = () => (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        value={busquedaDocente}
                        onChange={e => setBusquedaDocente(e.target.value)}
                        placeholder="Buscar por nombre o cédula..."
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:border-indigo-500 bg-white"
                    />
                </div>
                <span className="text-xs text-slate-400 shrink-0">{docentesFiltrados.length} resultados</span>
                <button onClick={() => setIsModalDocenteOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Registrar Docente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                            <th className="py-3 px-6 font-semibold">Cédula</th>
                            <th className="py-3 px-6 font-semibold">Nombre Completo</th>
                            <th className="py-3 px-6 font-semibold">Perfil Profesional</th>
                            <th className="py-3 px-6 font-semibold">Carga Asignada</th>
                            <th className="py-3 px-6 font-semibold">Estado</th>
                            <th className="py-3 px-6 font-semibold text-right">Opciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {docentesFiltrados.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin resultados para "{busquedaDocente}"</td></tr>
                        )}
                        {docentesFiltrados.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="py-4 px-6 text-sm text-slate-500 font-mono tracking-tight">{doc.cedula}</td>
                                <td className="py-4 px-6 text-sm font-bold text-slate-900">{doc.usuario?.nombre_completo}</td>
                                <td className="py-4 px-6 text-sm text-slate-600">
                                    <span className="block font-medium">{doc.especialidad_tecnica}</span>
                                    <span className="text-xs text-slate-400">{doc.grado_academico}</span>
                                </td>
                                <td className="py-4 px-6 text-sm">
                                    <button
                                        onClick={() => abrirModalCargas(doc)}
                                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                    >
                                        <ClipboardList className="w-3 h-3" />
                                        {doc.cargas_academicas?.length || 0} asignacion(es)
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    {getEstadoDocente(doc.estado_laboral)}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => abrirEditorDocente(doc)} className="p-1 text-slate-400 hover:text-amber-600 rounded" title="Editar Perfil">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleCambiarEstadoDocente(doc.id, doc.estado_laboral === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                            title={doc.estado_laboral === 'ACTIVO' ? 'Dar de Baja' : 'Reactivar'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const RenderHorarios = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Sub-tabs */}
            <div className="inline-flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
                <button onClick={() => { setHorarioSubTab('documentos'); if (documentos.length === 0) cargarDocumentos(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${horarioSubTab === 'documentos' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Upload className="w-4 h-4" /> Documentos
                </button>
                <button onClick={() => { setHorarioSubTab('estructurado'); if (cargasHorario.length === 0) cargarCargasHorario(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${horarioSubTab === 'estructurado' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <CalendarDays className="w-4 h-4" /> Horario Estructurado
                </button>
            </div>

            {/* ── Panel Documentos ── */}
            {horarioSubTab === 'documentos' && (
                <div className="space-y-5">
                    {/* Upload card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-violet-600" /> Subir documento</h4>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre / título</label>
                                <input value={formDoc.nombre} onChange={e => setFormDoc(p => ({ ...p, nombre: e.target.value }))}
                                    placeholder="Ej. Horario 2do cuatrimestre 2026"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción (opcional)</label>
                                <input value={formDoc.descripcion} onChange={e => setFormDoc(p => ({ ...p, descripcion: e.target.value }))}
                                    placeholder="Ej. Aplica para todas las secciones"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
                                <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => setArchivoDoc(e.target.files?.[0] ?? null)} />
                                {archivoDoc
                                    ? <p className="text-sm font-medium text-violet-700">{archivoDoc.name}</p>
                                    : <p className="text-sm text-slate-400">PDF o imagen — clic para seleccionar</p>
                                }
                            </label>
                            <button onClick={handleSubirDocumento} disabled={subiendoDoc || !archivoDoc}
                                className="px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors shrink-0">
                                {subiendoDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subir'}
                            </button>
                        </div>
                    </div>

                    {/* Lista documentos */}
                    {documentos.length === 0
                        ? <p className="text-sm text-slate-400 text-center py-8">No hay documentos subidos aún.</p>
                        : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {documentos.map((d: any) => (
                                    <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-slate-800 text-sm leading-tight">{d.nombre}</p>
                                            <button onClick={() => handleEliminarDocumento(d.id)} className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {d.descripcion && <p className="text-xs text-slate-500">{d.descripcion}</p>}
                                        <p className="text-xs text-slate-400">{new Date(d.creado_en).toLocaleDateString('es-DO')}</p>
                                        <a href={`${API_BASE_URL}/uploads/horarios/${d.filename}`} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors mt-1">
                                            <Eye className="w-3.5 h-3.5" /> Ver documento
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            )}

            {/* ── Panel Estructurado ── */}
            {horarioSubTab === 'estructurado' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-600 shrink-0">Filtrar por sección:</label>
                        <select value={seccionHorario} onChange={e => { setSeccionHorario(e.target.value); cargarCargasHorario(e.target.value || undefined); }}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                            <option value="">Todas las secciones</option>
                            {secciones.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.nombre} — {s.grado}</option>
                            ))}
                        </select>
                        <button onClick={() => cargarCargasHorario(seccionHorario || undefined)} className="p-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>

                    {cargandoHorario
                        ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                        : cargasHorario.length === 0
                            ? <p className="text-sm text-slate-400 text-center py-8">No hay cargas académicas. Asigna cargas a los docentes primero.</p>
                            : (
                                <div className="space-y-3">
                                    {cargasHorario.map((c: any) => (
                                        <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {c.modulo_formativo?.nombre ?? c.asignatura_academica?.nombre ?? 'Sin módulo'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {c.docente?.usuario?.nombre_completo} · {c.seccion?.nombre} {c.seccion?.grado}
                                                    </p>
                                                </div>
                                                <button onClick={() => setModalSlot({ carga_id: c.id, label: c.modulo_formativo?.nombre ?? c.asignatura_academica?.nombre ?? 'Carga' })}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors shrink-0">
                                                    <Plus className="w-3.5 h-3.5" /> Agregar horario
                                                </button>
                                            </div>
                                            {c.horarios?.length === 0
                                                ? <p className="text-xs text-slate-400 italic">Sin horario asignado</p>
                                                : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {c.horarios.map((h: any) => (
                                                            <span key={h.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${DIA_COLOR[h.dia] ?? 'bg-slate-100 text-slate-600'}`}>
                                                                <Clock className="w-3 h-3" />
                                                                {DIAS_LABEL[h.dia] ?? h.dia} {h.hora_inicio}–{h.hora_fin}
                                                                {h.aula && <span className="opacity-70">· {h.aula}</span>}
                                                                <button onClick={() => handleEliminarSlot(h.id)} className="ml-1 hover:opacity-60"><X className="w-3 h-3" /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    ))}
                                </div>
                            )
                    }
                </div>
            )}

            {/* Modal agregar slot */}
            {modalSlot && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h2 className="font-bold text-slate-800">Agregar horario</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{modalSlot.label}</p>
                            </div>
                            <button onClick={() => setModalSlot(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Día</label>
                                <select value={formSlot.dia} onChange={e => setFormSlot(p => ({ ...p, dia: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Hora inicio</label>
                                    <input type="time" value={formSlot.hora_inicio} onChange={e => setFormSlot(p => ({ ...p, hora_inicio: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Hora fin</label>
                                    <input type="time" value={formSlot.hora_fin} onChange={e => setFormSlot(p => ({ ...p, hora_fin: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Aula (opcional)</label>
                                <input value={formSlot.aula} onChange={e => setFormSlot(p => ({ ...p, aula: e.target.value }))}
                                    placeholder="Ej. Lab. Informática 2"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-200">
                            <button onClick={() => setModalSlot(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleAgregarSlot} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Dirección Académica</span>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">Estructura Institucional</h1>
                        <p className="text-slate-500 mt-1 text-sm">Oferta formativa, títulos técnicos y plantilla docente.</p>
                    </div>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: <GraduationCap className="w-5 h-5 text-indigo-600" />, label: 'Carreras Técnicas', value: carreras.length, bg: 'bg-indigo-50' },
                        { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, label: 'Activas', value: carreras.filter(c => c.estado === 'ACTIVA').length, bg: 'bg-emerald-50' },
                        { icon: <Users className="w-5 h-5 text-violet-600" />, label: 'Docentes', value: docentes.length, bg: 'bg-violet-50' },
                        { icon: <BookOpen className="w-5 h-5 text-amber-600" />, label: 'Total Módulos', value: carreras.reduce((a, c) => a + (c._count?.modulos || 0), 0), bg: 'bg-amber-50' },
                    ].map(k => (
                        <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}>{k.icon}</div>
                            <div>
                                <p className="text-xl font-black text-slate-800 leading-none">{k.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TABS DE NAVEGACIÓN INTERNA */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-1 inline-flex flex-wrap gap-1">
                    <button
                        onClick={() => setVistaActiva('carreras')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vistaActiva === 'carreras' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Briefcase className="w-4 h-4" /> Oferta Curricular (Títulos)
                    </button>
                    <button
                        onClick={() => setVistaActiva('docentes')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vistaActiva === 'docentes' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText className="w-4 h-4" /> Plantilla Docente
                    </button>
                    <button
                        onClick={() => setVistaActiva('sicologos')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vistaActiva === 'sicologos' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Users className="w-4 h-4" /> Orientación Escolar
                    </button>
                    <button
                        onClick={() => { setVistaActiva('horarios'); if (documentos.length === 0) cargarDocumentos(); }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vistaActiva === 'horarios' ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Horarios
                    </button>
                    <button
                        onClick={() => setVistaActiva('calendario')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vistaActiva === 'calendario' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Calendario
                    </button>
                </div>

                {cargando ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Cargando información del directorio...</p>
                    </div>
                ) : (
                    vistaActiva === 'carreras' ? RenderCarreras() :
                    vistaActiva === 'sicologos' ? RenderSicologos() :
                    vistaActiva === 'horarios' ? RenderHorarios() :
                    vistaActiva === 'calendario' ? <CalendarioAcademico puedeEditar={true} /> :
                    RenderDocentes()
                )}


                {/* MODAL NUEVA CARRERA */}
                {isModalCarreraOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Título Técnico</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Expansión de Oferta Curricular</p>
                                </div>
                                <button onClick={() => setIsModalCarreraOpen(false)} className="text-slate-400 hover:text-slate-600 transition bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCrearCarrera} className="p-6 flex-1 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Código Único (MINERD) *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-mono"
                                            placeholder="Ej. INFO-01"
                                            value={nuevaCarrera.codigo_minerd}
                                            onChange={(e) => setNuevaCarrera({ ...nuevaCarrera, codigo_minerd: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nombre Oficial del Título *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                            placeholder="Desarrollo y Administración de Aplicaciones..."
                                            value={nuevaCarrera.nombre}
                                            onChange={(e) => setNuevaCarrera({ ...nuevaCarrera, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Familia Profesional *</label>
                                        <select
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                                            value={nuevaCarrera.familia_profesional_id}
                                            onChange={(e) => setNuevaCarrera({ ...nuevaCarrera, familia_profesional_id: parseInt(e.target.value) })}
                                        >
                                            <option value={0} disabled>Seleccione una Familia</option>
                                            {familias.map(f => (
                                                <option key={f.id} value={f.id}>{f.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Duración (Años Escoláres) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="4"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                            value={nuevaCarrera.duracion_anios}
                                            onChange={(e) => setNuevaCarrera({ ...nuevaCarrera, duracion_anios: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalCarreraOpen(false)}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Título
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL NUEVO MÓDULO FORMATIVO */}
                {isModalModuloOpen && carreraSeleccionada && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Registrar Módulo Formativo</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Para: {carreraSeleccionada.nombre}</p>
                                </div>
                                <button onClick={() => setIsModalModuloOpen(false)} className="text-slate-400 hover:text-slate-600 transition bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCrearModulo} className="p-6 flex-1 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Código del Módulo *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-mono"
                                            placeholder="Ej. MF-001"
                                            value={nuevoModulo.codigo}
                                            onChange={(e) => setNuevoModulo({ ...nuevoModulo, codigo: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nombre Oficial del Módulo *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                            placeholder="Desarrollo de Software Backend..."
                                            value={nuevoModulo.nombre}
                                            onChange={(e) => setNuevoModulo({ ...nuevoModulo, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Horas Totales (Acreditadas) *</label>
                                        <input
                                            type="number"
                                            min="10"
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                            value={nuevoModulo.horas_totales || ''}
                                            onChange={(e) => setNuevoModulo({ ...nuevoModulo, horas_totales: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalModuloOpen(false)}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Módulo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL REGISTRAR DOCENTE */}
                {isModalDocenteOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Docente</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Plantilla Docente — Politécnico</p>
                                </div>
                                <button onClick={() => setIsModalDocenteOpen(false)} className="text-slate-400 hover:text-slate-600 transition bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCrearDocente} className="p-6 flex-1 overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                                    <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Ej. Juan Pérez Rodríguez"
                                        value={nuevoDocente.nombre_completo}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, nombre_completo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Cédula de Identidad *</label>
                                    <input type="text" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-mono"
                                        placeholder="Ej. 001-1234567-8"
                                        value={nuevoDocente.cedula}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, cedula: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Institucional *</label>
                                    <input type="email" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="docente@minerd.gob.do"
                                        value={nuevoDocente.email}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Contraseña Inicial</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        value={nuevoDocente.password}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, password: e.target.value })} />
                                    <p className="text-xs text-slate-400 mt-1">Por defecto: Minerd2025!</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Especialidad Técnica</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Ej. Informática y Comunicaciones"
                                        value={nuevoDocente.especialidad_tecnica}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, especialidad_tecnica: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Grado Académico</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Ej. Licenciatura en Informática"
                                        value={nuevoDocente.grado_academico}
                                        onChange={e => setNuevoDocente({ ...nuevoDocente, grado_academico: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsModalDocenteOpen(false)}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardandoDocente}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70">
                                        {guardandoDocente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Registrar Docente
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDITAR DOCENTE */}
                {docenteEditando && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Editar Perfil Docente</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Ci: {docenteEditando.cedula}</p>
                                </div>
                                <button onClick={() => setDocenteEditando(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleActualizarDocente} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        value={editForm.nombre_completo}
                                        onChange={e => setEditForm({ ...editForm, nombre_completo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Especialidad Técnica</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        value={editForm.especialidad_tecnica}
                                        onChange={e => setEditForm({ ...editForm, especialidad_tecnica: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Grado Académico</label>
                                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Ej: Licenciatura en Informática"
                                        value={editForm.grado_academico}
                                        onChange={e => setEditForm({ ...editForm, grado_academico: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setDocenteEditando(null)}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardando}
                                        className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-70">
                                        {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* ── Modal: Gestionar Asignaciones del Docente ── */}
        {docenteCargas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Asignaciones de {docenteCargas.usuario?.nombre_completo}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Módulos y asignaturas por sección y período</p>
                        </div>
                        <button onClick={() => setDocenteCargas(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-5 space-y-5">
                        {/* Asignaciones actuales */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Asignaciones actuales</h3>
                            {(docenteCargas.cargas_academicas?.length ?? 0) === 0 ? (
                                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">Sin asignaciones. Añade una abajo.</p>
                            ) : (
                                <div className="space-y-2">
                                    {docenteCargas.cargas_academicas.map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {c.modulo_formativo?.nombre ?? c.asignatura_academica?.nombre ?? '—'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Sección: {c.seccion?.nombre ?? '—'} · Período: {c.periodo?.nombre ?? '—'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEliminarCarga(c.id)}
                                                className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                                title="Eliminar asignación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Formulario nueva asignación */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Nueva asignación</h3>

                            {errorCarga && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">{errorCarga}</p>}

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Período *</label>
                                    <select
                                        value={nuevaCarga.periodo_id}
                                        onChange={e => setNuevaCarga(n => ({ ...n, periodo_id: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="">Selecciona...</option>
                                        {periodos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Sección *</label>
                                    <select
                                        value={nuevaCarga.seccion_id}
                                        onChange={e => setNuevaCarga(n => ({ ...n, seccion_id: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="">Selecciona...</option>
                                        {secciones.map((s: any) => <option key={s.id} value={s.id}>{s.nombre} — {s.carrera?.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Módulo técnico</label>
                                    <select
                                        value={nuevaCarga.modulo_formativo_id}
                                        onChange={e => setNuevaCarga(n => ({ ...n, modulo_formativo_id: e.target.value, asignatura_academica_id: '' }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="">— Ninguno —</option>
                                        {modulos.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Asignatura académica</label>
                                    <select
                                        value={nuevaCarga.asignatura_academica_id}
                                        onChange={e => setNuevaCarga(n => ({ ...n, asignatura_academica_id: e.target.value, modulo_formativo_id: '' }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="">— Ninguna —</option>
                                        {asignaturas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Selecciona módulo O asignatura, no ambos.</p>
                            <button
                                onClick={handleAsignarCarga}
                                disabled={guardandoCarga}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {guardandoCarga ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Asignar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
