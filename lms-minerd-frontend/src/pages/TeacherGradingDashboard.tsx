import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, AlertTriangle, CheckCircle, Clock, FolderOpen, ChevronRight, BarChart2 } from 'lucide-react';
import PlanDeMejoraModal from '../components/PlanDeMejoraModal';

type VistaActiva = 'evaluacion' | 'modulos' | 'estudiantes' | 'reportes' | 'observaciones' | 'resumen';

export default function TeacherGradingDashboard() {
    const [vistaActiva, setVistaActiva] = useState<VistaActiva>('modulos');
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estados de Conexión Real
    const [cargas, setCargas] = useState<any[]>([]);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [cargaActiva, setCargaActiva] = useState<any>(null);
    const [raActivo, setRaActivo] = useState<any>(null);
    const [estudianteActivoModal, setEstudianteActivoModal] = useState<any>(null);
    const [anecdotarioForm, setAnecdotarioForm] = useState<{ [key: number]: { tipo: string, incidencia: string } }>({});
    const [resumenData, setResumenData] = useState<{ ras: any[], estudiantes: any[] } | null>(null);

    // 1. Cargar Módulos Formativos y Secciones del Docente al Iniciar
    useEffect(() => {
        const fetchCargas = async () => {
            try {
                const token = localStorage.getItem('lms_minerd_token');
                if (!token) throw new Error("No hay sesión iniciada (Token no encontrado).");
                const res = await axios.get('http://localhost:3000/api/evaluaciones/mis-cargas', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCargas(res.data);
            } catch (error: any) {
                console.error("Error al cargar la asignación docente", error);
                if (error.response?.status === 401) {
                    setErrorMsg("Su sesión ha caducado o es inválida. Deberá iniciar sesión nuevamente.");
                } else if (error.response?.status === 404) {
                    setErrorMsg("Acceso Denegado: Su cuenta no tiene un perfil Docente asignado o no posee Carga Académica.");
                } else if (error.message === "Network Error") {
                    setErrorMsg("Error de Red CORS o Servidor Apagado. Verifique que el Backend en localhost:3000 esté vivo.");
                } else {
                    setErrorMsg("Error conectando con el servidor: " + (error.response?.data?.message || error.message));
                }
            }
        };
        fetchCargas();
    }, []);

    // 2. Seleccionar Carga y Buscar Estudiantes
    const handleSelectCarga = async (carga: any) => {
        setCargaActiva(carga);

        const esAcademica = !!carga.asignatura_academica;

        // Autoseleccionar el primer RA del módulo (Solo si es Módulo Técnico)
        if (!esAcademica && carga.modulo_formativo?.resultados_aprendizaje && carga.modulo_formativo.resultados_aprendizaje.length > 0) {
            setRaActivo(carga.modulo_formativo.resultados_aprendizaje[0]);
        } else {
            setRaActivo(null); // Limpiar si es académica
        }

        setEstudiantes([]);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            const clase_id = esAcademica ? carga.asignatura_academica_id : carga.modulo_formativo_id;
            const tipo = esAcademica ? 'ASIGNATURA' : 'MODULO';

            const res = await axios.get(`http://localhost:3000/api/evaluaciones/estudiantes/${carga.seccion_id}/${clase_id}/${tipo}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEstudiantes(res.data);
            setVistaActiva('evaluacion');
        } catch (error) {
            console.error("Error buscando estudiantes", error);
        }
    };

    // 3. Cambiar Puntuación en RAM
    const handleGradeChange = (estudianteId: number, valor: string) => {
        if (!raActivo) return;
        let numValor = parseInt(valor) || 0;

        // Bloquear si excede el valor máximo estipulado por MINERD para ese RA
        if (numValor > raActivo.valor_maximo) numValor = raActivo.valor_maximo;
        if (numValor < 0) numValor = 0;

        setEstudiantes(estudiantes.map(est => {
            if (est.id === estudianteId) {
                const existing = est.calificaciones.find((c: any) => c.ra_id === raActivo.id);
                let nuevasC = [...est.calificaciones];
                if (existing) {
                    nuevasC = nuevasC.map((c: any) => c.ra_id === raActivo.id ? { ...c, valor_logrado: numValor } : c);
                } else {
                    nuevasC.push({ ra_id: raActivo.id, valor_logrado: numValor });
                }
                return { ...est, calificaciones: nuevasC };
            }
            return est;
        }));
    };

    const handleGradeChangeAcad = (estudianteId: number, campo: string, valor: string) => {
        let numValor = parseInt(valor) || 0;
        if (numValor > 100) numValor = 100;
        if (numValor < 0) numValor = 0;

        setEstudiantes(estudiantes.map(est => {
            if (est.id === estudianteId) {
                let current = est.calificaciones_acad?.[0] || { p1: 0, p2: 0, p3: 0, p4: 0 };
                return {
                    ...est,
                    calificaciones_acad: [{ ...current, [campo]: numValor }]
                };
            }
            return est;
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
            alert(`✅ Calificaciones del ${raActivo.numero} guardadas en el Sistema.`);
        } catch (error) {
            alert('❌ Error al comunicarse con el Servidor NestJS');
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
            alert(`✅ Calificaciones de Asignatura guardadas en el Sistema.`);
        } catch (error) {
            alert('❌ Error al comunicarse con el Servidor NestJS');
        } finally {
            setSaving(false);
        }
    };

    const openMejoraModal = (est: any) => {
        setEstudianteActivoModal(est);
        setModalOpen(true);
    };

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
        } catch { /* ignore */ }
    };

    // Calcular Sumatoria Total de RAs para saber si aprobó (>70pts)
    const getSumaTotalMF = (est: any) => {
        return est.calificaciones.reduce((acc: number, cur: any) => acc + cur.valor_logrado, 0);
    };

    // Enviar Registro Anecdótico
    const handdleSendObservacion = async (estudiante_id: number) => {
        const form = anecdotarioForm[estudiante_id];
        if (!form || !form.incidencia.trim()) {
            alert('Debe escribir la incidencia antes de enviar.');
            return;
        }

        try {
            const token = localStorage.getItem('lms_minerd_token');
            await axios.post('http://localhost:3000/api/evaluaciones/observaciones', {
                estudiante_id,
                incidencia: form.incidencia,
                tipo: form.tipo || 'Academica'
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('✅ Registro disciplinario/académico enviado a Orientación.');
            // Limpiar form
            setAnecdotarioForm(prev => ({ ...prev, [estudiante_id]: { tipo: 'Academica', incidencia: '' } }));
        } catch (error) {
            alert('❌ Error al enviar la observación.');
            console.error(error);
        }
    };

    // --- Componentes Render ---
    const RenderModulos = () => (
        <div className="animate-in fade-in duration-300">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Módulos Asignados</h1>
                <p className="text-slate-500 mt-2 text-sm">Selecciona una clase para inicializar el Registro de Grado (Sábana).</p>
            </header>

            {errorMsg ? (
                <div className="bg-rose-50 border border-rose-200 p-8 rounded-xl text-center text-rose-700">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-rose-500" />
                    <strong>{errorMsg}</strong>
                    <p className="text-sm mt-2 opacity-80">Por favor, cierre la sesión actual ubicada en la esquina superior e inicie como <b>docente@minerd.gob.do</b>.</p>
                </div>
            ) : cargas.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    Cargando estructura académica desde el Servidor MINERD...
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cargas.map(carga => {
                        const esAcademica = !!carga.asignatura_academica;
                        const dataClase = esAcademica ? carga.asignatura_academica : carga.modulo_formativo;

                        return (
                            <div key={carga.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleSelectCarga(carga)}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${esAcademica ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'}`}>
                                        {dataClase?.codigo}
                                    </span>
                                    <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                                        {esAcademica ? 'Asignatura General' : `${dataClase?.horas_totales || 0} hrs`}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{dataClase?.nombre}</h3>
                                <p className="text-sm text-slate-500 mb-4">{carga.seccion.grado} Secc: {carga.seccion.nombre}</p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-xs text-slate-400 font-medium">
                                        {esAcademica ? '4 Periodos (P1-P4)' : `${dataClase?.resultados_aprendizaje?.length || 0} RAs detectados`}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );

    const RenderEvaluacion = () => (
        <div className="animate-in fade-in duration-300">
            {cargaActiva && (
                <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{cargaActiva.seccion.nombre}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{cargaActiva.periodo.nombre}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registro de Calificaciones (RA)</h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700">{cargaActiva.modulo_formativo.codigo}</span>
                            <span className="text-slate-300">|</span>
                            {cargaActiva.modulo_formativo.nombre}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveGrades}
                        disabled={saving}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm flex items-center gap-2
          ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
                    >
                        <Clock className="w-4 h-4" />
                        {saving ? 'Empujando Base de Datos...' : 'Guardar en Base Central'}
                    </button>
                </header>
            )}

            {/* Pestañas de Resultados de Aprendizaje */}
            {cargaActiva && cargaActiva.modulo_formativo.resultados_aprendizaje && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {cargaActiva.modulo_formativo.resultados_aprendizaje.map((ra: any) => (
                        <button
                            key={ra.id}
                            onClick={() => setRaActivo(ra)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                            ${raActivo?.id === ra.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {ra.numero} <span className="opacity-50 font-normal ml-1">(Max: {ra.valor_maximo} pts)</span>
                        </button>
                    ))}
                    <div className="ml-auto flex items-center bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
                        <span className="text-xs text-amber-800 font-semibold">Total Módulo: 100 Pts</span>
                    </div>
                </div>
            )}

            {raActivo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-sm text-slate-600">
                        Evaluando <strong className="text-slate-900">{raActivo.numero}:</strong> {raActivo.descripcion}
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="py-4 px-6 font-semibold">RNE Escolar</th>
                                <th className="py-4 px-6 font-semibold">Estudiante</th>
                                <th className="py-4 px-6 font-semibold w-48 text-center">Nota ({raActivo.numero})</th>
                                <th className="py-4 px-6 font-semibold text-center hidden md:table-cell">Suma Total (MF)</th>
                                <th className="py-4 px-6 font-semibold text-right">Alerta Académica</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {estudiantes.map((est) => {
                                const califActual = est.calificaciones.find((c: any) => c.ra_id === raActivo.id)?.valor_logrado || '';
                                const total = getSumaTotalMF(est);

                                return (
                                    <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-500 font-mono">{est.rne}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-slate-900">{est.nombre}</td>
                                        <td className="py-4 px-6">
                                            <div className="relative flex items-center max-w-[120px] mx-auto">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={raActivo.valor_maximo}
                                                    value={califActual}
                                                    onChange={(e) => handleGradeChange(est.id, e.target.value)}
                                                    className={`w-full text-center text-sm font-bold rounded-md border py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors
                                                ${Number(califActual) === 0 ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 text-xs text-slate-400 font-medium">/{raActivo.valor_maximo}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell text-center">
                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm border 
                                            ${total >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    total > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                {total}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {(total < 70 && total > 0) ? (
                                                <button
                                                    onClick={() => openMejoraModal(est)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200"
                                                >
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Plan Recuperación
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic font-medium">Bien</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const RenderEvaluacionAcademica = () => (
        <div className="animate-in fade-in duration-300">
            {cargaActiva && (
                <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{cargaActiva.seccion.nombre}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{cargaActiva.periodo.nombre}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registro General Permanente</h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-700">{cargaActiva.asignatura_academica?.codigo}</span>
                            <span className="text-slate-300">|</span>
                            {cargaActiva.asignatura_academica?.nombre}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveGradesAcad}
                        disabled={saving}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm flex items-center gap-2
          ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
                    >
                        <Clock className="w-4 h-4" />
                        {saving ? 'Empujando...' : 'Guardar Calificaciones P1-P4'}
                    </button>
                </header>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="py-4 px-6 font-semibold">Estudiante</th>
                            <th className="py-4 px-4 font-semibold text-center hidden md:table-cell">P1</th>
                            <th className="py-4 px-4 font-semibold text-center hidden md:table-cell">P2</th>
                            <th className="py-4 px-4 font-semibold text-center hidden md:table-cell">P3</th>
                            <th className="py-4 px-4 font-semibold text-center hidden md:table-cell">P4</th>
                            <th className="py-4 px-4 font-semibold text-center">Calificación Final (CF)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((est) => {
                            const calif = est.calificaciones_acad?.[0] || { p1: '', p2: '', p3: '', p4: '' };
                            const p1 = Number(calif.p1 || 0);
                            const p2 = Number(calif.p2 || 0);
                            const p3 = Number(calif.p3 || 0);
                            const p4 = Number(calif.p4 || 0);

                            // Logica MINERD Oficial
                            let sum = p1 + p2 + p3 + p4;
                            let count = (p1 > 0 ? 1 : 0) + (p2 > 0 ? 1 : 0) + (p3 > 0 ? 1 : 0) + (p4 > 0 ? 1 : 0);
                            let cf = count > 0 ? Math.round(sum / 4) : 0;

                            return (
                                <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6">
                                        <p className="text-sm font-medium text-slate-900">{est.nombre}</p>
                                        <p className="text-xs text-slate-500 font-mono">{est.rne}</p>
                                    </td>
                                    {['p1', 'p2', 'p3', 'p4'].map((p) => (
                                        <td key={p} className="py-4 px-4 hidden md:table-cell text-center">
                                            <input
                                                type="number" min="0" max="100"
                                                value={calif[p] === 0 ? '' : calif[p]}
                                                onChange={(e) => handleGradeChangeAcad(est.id, p, e.target.value)}
                                                className="w-16 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded py-1.5 focus:border-indigo-500 focus:bg-white transition-colors"
                                                placeholder="-"
                                            />
                                        </td>
                                    ))}
                                    <td className="py-4 px-6 text-center">
                                        <span className={`inline-flex items-center justify-center w-12 h-10 rounded-lg font-bold text-sm border 
                                        ${cf >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                cf > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {cf}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const RenderObservaciones = () => (
        <div className="animate-in fade-in duration-300">
            {cargaActiva && (
                <header className="mb-8 border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Anotaciones y Psicología</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        Reporta incidencias cualitativas para el Departamento de Orientación.
                        Los coordinadores podrán ver estos registros en tiempo real en los expedientes de los estudiantes de <span className="font-semibold text-slate-700">{cargaActiva.seccion.nombre}</span>.
                    </p>
                </header>
            )}

            {!cargaActiva ? (
                <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center text-amber-700">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                    <strong>No hay ninguna clase seleccionada</strong>
                    <p className="text-sm mt-2 opacity-80">Por favor, vaya a "Seleccionar Módulo" primero.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {estudiantes.map((est) => {
                        const form = anecdotarioForm[est.id] || { tipo: 'Academica', incidencia: '' };
                        return (
                            <div key={est.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/3">
                                    <h3 className="text-lg font-bold text-slate-800">{est.nombre}</h3>
                                    <p className="text-sm text-slate-500 font-mono mb-4">RNE: {est.rne}</p>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Clasificación</label>
                                    <select
                                        value={form.tipo}
                                        onChange={(e) => setAnecdotarioForm({ ...anecdotarioForm, [est.id]: { ...form, tipo: e.target.value } })}
                                        className="w-full text-sm rounded-md border border-slate-200 py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="Academica">Académica (Logros, Dificultades)</option>
                                        <option value="Conductual">Conductual (Disciplina)</option>
                                        <option value="Asistencia">Asistencia (Tardanzas recurrentes)</option>
                                        <option value="Familiar">Familiar / Personal</option>
                                    </select>
                                </div>
                                <div className="md:w-2/3 flex flex-col gap-3">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase">Detalle Sistemático (Incidencia)</label>
                                    <textarea
                                        value={form.incidencia}
                                        onChange={(e) => setAnecdotarioForm({ ...anecdotarioForm, [est.id]: { ...form, incidencia: e.target.value } })}
                                        placeholder={`Escriba el detalle descriptivo del evento asociado a ${est.nombre}...`}
                                        className="w-full text-sm rounded-md border border-slate-200 p-3 h-24 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none placeholder:text-slate-300 shadow-inner"
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handdleSendObservacion(est.id)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow"
                                        >
                                            Enviar a Orientación
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const RenderResumen = () => (
        <div className="animate-in fade-in duration-300">
            <header className="mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Resumen de Calificaciones</h1>
                <p className="text-sm text-slate-500 mt-1">
                    {cargaActiva?.modulo_formativo?.codigo} — {cargaActiva?.modulo_formativo?.nombre} · Sección {cargaActiva?.seccion?.nombre}
                </p>
            </header>
            {!resumenData ? (
                <p className="text-slate-400 text-sm">Cargando resumen...</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">RNE</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Estudiante</th>
                                {resumenData.ras.map(ra => (
                                    <th key={ra.id} className="px-4 py-3 font-semibold text-slate-600 text-center">
                                        {ra.numero}<span className="block text-[10px] font-normal text-slate-400">/ {ra.max} pts</span>
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
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{est.rne}</td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{est.nombre}</td>
                                        {resumenData.ras.map(ra => {
                                            const nota = est.notas.find((n: any) => n.ra_id === ra.id);
                                            const valor = nota?.valor ?? null;
                                            return (
                                                <td key={ra.id} className="px-4 py-3 text-center">
                                                    {valor !== null
                                                        ? <span className={`font-bold ${valor >= ra.max * 0.7 ? 'text-emerald-600' : 'text-rose-600'}`}>{valor}</span>
                                                        : <span className="text-slate-300 text-xs">—</span>
                                                    }
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center font-black text-slate-800">{total}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {aprobado ? 'APROBADO' : 'EN RIESGO'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {resumenData.estudiantes.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-8">No hay calificaciones guardadas aún.</p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans">
            {/* Sidebar Lateral */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Módulo Docente</h2>
                    <p className="text-xs text-slate-500">Gestión de Calificaciones</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => setVistaActiva('modulos')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${vistaActiva === 'modulos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        <BookOpen className={`w-5 h-5 ${vistaActiva === 'modulos' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        Seleccionar Módulo
                    </button>
                    {(vistaActiva === 'evaluacion' || cargaActiva) && (
                        <button
                            onClick={() => setVistaActiva('evaluacion')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${vistaActiva === 'evaluacion' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <CheckCircle className={`w-5 h-5 ${vistaActiva === 'evaluacion' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            Puntear R.A.
                        </button>
                    )}
                    {cargaActiva && !cargaActiva.asignatura_academica && (
                        <button
                            onClick={fetchResumen}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${vistaActiva === 'resumen' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <BarChart2 className={`w-5 h-5 ${vistaActiva === 'resumen' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            Ver Resumen
                        </button>
                    )}
                    <button
                        onClick={() => setVistaActiva('observaciones')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md mt-8 border-t border-slate-100 pt-4 transition-colors ${vistaActiva === 'observaciones' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        <FolderOpen className={`w-5 h-5 ${vistaActiva === 'observaciones' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        Anotaciones y Psicología
                    </button>
                </nav>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {vistaActiva === 'modulos' && RenderModulos()}
                    {vistaActiva === 'evaluacion' && (cargaActiva?.asignatura_academica ? RenderEvaluacionAcademica() : RenderEvaluacion())}
                    {vistaActiva === 'observaciones' && RenderObservaciones()}
                    {vistaActiva === 'resumen' && RenderResumen()}
                </div>
            </main>

            {/* Referencia al componente Modal de Mejora */}
            <PlanDeMejoraModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                estudiante={{ nombre: estudianteActivoModal?.nombre, sigerd: estudianteActivoModal?.rne }}
                actividadOriginal={{ nombre: raActivo?.descripcion + ' (' + (estudianteActivoModal?.calificaciones.find((c: any) => c.ra_id === raActivo?.id)?.valor_logrado || 0) + ' pts)' }}
            />
        </div>
    );
}
