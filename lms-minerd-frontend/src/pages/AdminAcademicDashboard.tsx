import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, FileText, Briefcase, Trash2, LayoutList, Loader2, X, Save, GraduationCap, Users, BookOpen, CheckCircle2 } from 'lucide-react';

export default function AdminAcademicDashboard() {
    const [vistaActiva, setVistaActiva] = useState<'docentes' | 'carreras'>('carreras');
    const [carreras, setCarreras] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

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

    useEffect(() => {
        const fetchData = async () => {
            setCargando(true);
            try {
                const token = localStorage.getItem('lms_minerd_token');
                const headers = { Authorization: `Bearer ${token}` };

                // Traer Carreras Completas con conteo de Módulos (Backend Prisma)
                const resC = await axios.get('http://localhost:3000/api/curriculum/carreras', { headers });
                setCarreras(resC.data);

                // Traer Staff Docente (Backend Prisma)
                const resD = await axios.get('http://localhost:3000/api/docentes', { headers });
                setDocentes(resD.data);
                // Traer Familias (Backend Prisma)
                const resF = await axios.get('http://localhost:3000/api/curriculum/familias', { headers });
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
            const token = localStorage.getItem('lms_minerd_token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.post('http://localhost:3000/api/curriculum/carreras', nuevaCarrera, { headers });

            // Recargar catálogo
            const resC = await axios.get('http://localhost:3000/api/curriculum/carreras', { headers });
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
            const token = localStorage.getItem('lms_minerd_token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.post('http://localhost:3000/api/curriculum/modulos', {
                ...nuevoModulo,
                carrera_id: carreraSeleccionada.id
            }, { headers });

            // Recargar catálogo para refrescar conteo
            const resC = await axios.get('http://localhost:3000/api/curriculum/carreras', { headers });
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
            const token = localStorage.getItem('lms_minerd_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.patch(`http://localhost:3000/api/docentes/${docenteEditando.id}`, editForm, { headers });
            // Refrescar lista
            const res = await axios.get('http://localhost:3000/api/docentes', { headers });
            setDocentes(res.data);
            setDocenteEditando(null);
        } catch { alert('No se pudo actualizar el docente.'); }
        finally { setGuardando(false); }
    };

    const handleCambiarEstadoDocente = async (id: number, nuevoEstado: string) => {
        const token = localStorage.getItem('lms_minerd_token');
        const headers = { Authorization: `Bearer ${token}` };
        await axios.patch(`http://localhost:3000/api/docentes/${id}/estado`, { estado_laboral: nuevoEstado }, { headers });
        setDocentes(prev => prev.map(d => d.id === id ? { ...d, estado_laboral: nuevoEstado } : d));
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
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shrink-0">
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
                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium border border-slate-200">{doc.cargas_academicas?.length || 0} Secciones</span>
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

    return (
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
                </div>

                {cargando ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Cargando información del directorio...</p>
                    </div>
                ) : (
                    vistaActiva === 'carreras' ? RenderCarreras() : RenderDocentes()
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
    );
}
