import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    AlertTriangle, Plus, Trash2, Save, ChevronRight, BookOpen,
    GraduationCap, Layers, Clock, CheckCircle2, Circle, ArrowLeft,
    Zap, BarChart3, Target
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ResultadoAprendizaje {
    id?: number;
    numero: string;
    descripcion: string;
    valor_maximo: number;
}
interface Modulo {
    id: number;
    codigo: string;
    nombre: string;
    horas_totales: number;
    resultados_aprendizaje?: ResultadoAprendizaje[];
}
interface Carrera {
    id: number;
    codigo_minerd: string;
    nombre: string;
    duracion_anios: number;
    estado: string;
    familia?: { nombre: string };
    modulos?: Modulo[];
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function AdminCurriculumDashboard() {
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [carreraActiva, setCarreraActiva] = useState<Carrera | null>(null);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [moduloActivo, setModuloActivo] = useState<Modulo | null>(null);
    const [rasTemporales, setRasTemporales] = useState<ResultadoAprendizaje[]>([]);
    const [sumaTotal, setSumaTotal] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [guardadoOk, setGuardadoOk] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [cargandoModulos, setCargandoModulos] = useState(false);

    const token = localStorage.getItem('lms_minerd_token');
    const headers = { Authorization: `Bearer ${token}` };

    // ── Carga inicial de carreras ───────────────────────────────────────────
    useEffect(() => {
        axios.get('http://localhost:3000/api/curriculum/carreras', { headers })
            .then(r => setCarreras(r.data))
            .catch(() => setErrorMsg('Error cargando las Carreras Técnicas del servidor.'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Seleccionar Carrera ─────────────────────────────────────────────────
    const handleSelectCarrera = async (carrera: Carrera) => {
        setCarreraActiva(carrera);
        setModuloActivo(null);
        setRasTemporales([]);
        setSumaTotal(0);
        setCargandoModulos(true);
        try {
            const r = await axios.get(`http://localhost:3000/api/curriculum/modulos/${carrera.id}`, { headers });
            setModulos(r.data);
        } catch { /* silencioso */ } finally {
            setCargandoModulos(false);
        }
    };

    // ── Seleccionar Módulo ──────────────────────────────────────────────────
    const handleSelectModulo = (modulo: Modulo) => {
        setModuloActivo(modulo);
        setGuardadoOk(false);
        const ras = modulo.resultados_aprendizaje?.map(r => ({ ...r })) || [];
        setRasTemporales(ras);
        recalcular(ras);
    };

    // ── Recalcular Suma ─────────────────────────────────────────────────────
    const recalcular = useCallback((ras: ResultadoAprendizaje[]) => {
        setSumaTotal(ras.reduce((a, b) => a + (Number(b.valor_maximo) || 0), 0));
    }, []);

    const handleAddRA = () => {
        const nuevos = [...rasTemporales, { numero: `RA${rasTemporales.length + 1}`, descripcion: '', valor_maximo: 0 }];
        setRasTemporales(nuevos);
        recalcular(nuevos);
    };

    const handleRemoveRA = (idx: number) => {
        const nuevos = rasTemporales.filter((_, i) => i !== idx);
        setRasTemporales(nuevos);
        recalcular(nuevos);
    };

    const handleChangeRA = (idx: number, campo: string, valor: string) => {
        const nuevos = [...rasTemporales];
        nuevos[idx] = { ...nuevos[idx], [campo]: campo === 'valor_maximo' ? Number(valor) : valor };
        setRasTemporales(nuevos);
        recalcular(nuevos);
    };

    // ── Guardar RAs ─────────────────────────────────────────────────────────
    const handleSaveRAs = async () => {
        if (sumaTotal !== 100) return;
        setGuardando(true);
        try {
            await axios.post(
                `http://localhost:3000/api/curriculum/modulos/${moduloActivo!.id}/ras`,
                { ras: rasTemporales },
                { headers }
            );
            setGuardadoOk(true);
            handleSelectCarrera(carreraActiva!);
            setTimeout(() => setGuardadoOk(false), 3000);
        } catch (e: any) {
            setErrorMsg('Error guardando: ' + (e.response?.data?.message || e.message));
        } finally {
            setGuardando(false);
        }
    };

    // ── Helpers de UI ───────────────────────────────────────────────────────
    const puntosRestantes = 100 - sumaTotal;
    const porcentajeOcupado = Math.min(sumaTotal, 100);
    const estadoSuma = sumaTotal === 100 ? 'ok' : sumaTotal > 100 ? 'exceso' : 'pendiente';

    const colorFamilia: Record<string, string> = {
        'Informática': 'from-violet-500 to-indigo-600',
        'Contabilidad': 'from-emerald-500 to-teal-600',
        'Administración': 'from-blue-500 to-cyan-600',
        'Salud': 'from-rose-500 to-pink-600',
        'Turismo': 'from-amber-500 to-orange-500',
        'Electricidad': 'from-yellow-500 to-amber-500',
    };
    const getGradient = (familia?: string) => {
        if (!familia) return 'from-slate-500 to-slate-600';
        for (const key of Object.keys(colorFamilia)) {
            if (familia.includes(key)) return colorFamilia[key];
        }
        return 'from-indigo-500 to-violet-600';
    };

    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans overflow-hidden">

            {/* ── SIDEBAR: Lista de Carreras ──────────────────────────────── */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                {/* Cabecera sidebar */}
                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-none">Gestor Curricular</h2>
                            <p className="text-xs text-slate-400 mt-0.5">MINERD — Técnico Profesional</p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        {errorMsg}
                    </div>
                )}

                {/* Lista de Carreras */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {carreras.length === 0 && !errorMsg && (
                        <div className="text-center py-8 text-slate-300">
                            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Cargando carreras...</p>
                        </div>
                    )}
                    {carreras.map(c => {
                        const activa = carreraActiva?.id === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => handleSelectCarrera(c)}
                                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group
                                    ${activa
                                        ? 'bg-violet-50 border-violet-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activa ? 'bg-violet-500' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                            {c.familia?.nombre || 'Sin familia'}
                                        </span>
                                        <p className={`text-sm font-semibold leading-tight ${activa ? 'text-violet-900' : 'text-slate-700'}`}>
                                            {c.nombre}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{c.codigo_minerd}</span>
                                    </div>
                                    {activa && <ChevronRight className="w-4 h-4 text-violet-400 shrink-0 ml-auto mt-1" />}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Pie sidebar */}
                <div className="p-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        <span className="font-bold text-slate-600">{carreras.length}</span> carreras registradas
                    </p>
                </div>
            </aside>

            {/* ── ÁREA PRINCIPAL ──────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto">

                {/* Estado: Sin carrera seleccionada */}
                {!carreraActiva && (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                <Layers className="w-10 h-10 text-violet-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700 mb-2">Diseño Curricular</h2>
                            <p className="text-sm text-slate-400">
                                Seleccione una <strong>Carrera Técnica</strong> del panel izquierdo para visualizar, construir y editar
                                los Módulos Formativos y sus Resultados de Aprendizaje según normativa MINERD.
                            </p>
                        </div>
                    </div>
                )}

                {/* Estado: Carrera seleccionada → Lista de Módulos */}
                {carreraActiva && !moduloActivo && (
                    <div className="p-8 max-w-5xl mx-auto">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{carreraActiva.familia?.nombre || 'Familia'}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-700 font-semibold">{carreraActiva.nombre}</span>
                        </div>

                        {/* Banner de Carrera */}
                        <div className={`relative bg-gradient-to-r ${getGradient(carreraActiva.familia?.nombre)} rounded-2xl p-6 mb-8 overflow-hidden shadow-lg`}>
                            <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
                            <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-8" />
                            <div className="relative">
                                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{carreraActiva.codigo_minerd}</span>
                                <h1 className="text-2xl font-black text-white mt-1 leading-tight">{carreraActiva.nombre}</h1>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {carreraActiva.duracion_anios} años de duración
                                    </span>
                                    <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {modulos.length} módulos
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${carreraActiva.estado === 'ACTIVA' ? 'bg-white/20 text-white' : 'bg-rose-400/30 text-rose-100'}`}>
                                        {carreraActiva.estado}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Módulos */}
                        {cargandoModulos ? (
                            <div className="text-center py-12 text-slate-400">
                                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm">Cargando módulos formativos...</p>
                            </div>
                        ) : modulos.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-slate-400 font-medium">Sin módulos registrados para esta carrera.</p>
                                <p className="text-xs text-slate-300 mt-1">Contacte al Administrador del Sistema SIGERD.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Módulos Formativos — Haz clic para editar RAs
                                </h2>
                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {modulos.map(mod => {
                                        const totalRAs = mod.resultados_aprendizaje?.length || 0;
                                        const sumaRAs = mod.resultados_aprendizaje?.reduce((a, b) => a + b.valor_maximo, 0) || 0;
                                        const completo = sumaRAs === 100 && totalRAs > 0;
                                        return (
                                            <button
                                                key={mod.id}
                                                onClick={() => handleSelectModulo(mod)}
                                                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-indigo-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {/* Cabecera */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{mod.codigo}</span>
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${completo
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : totalRAs === 0
                                                                ? 'bg-slate-50 text-slate-400 border-slate-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {completo ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                                        {completo ? 'Diseñado' : totalRAs === 0 ? 'Sin RAs' : 'Incompleto'}
                                                    </div>
                                                </div>

                                                {/* Nombre */}
                                                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-3 group-hover:text-violet-700 transition-colors">
                                                    {mod.nombre}
                                                </h3>

                                                {/* Footer */}
                                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {mod.horas_totales} hrs
                                                    </span>
                                                    <span className="text-xs text-violet-600 font-semibold">
                                                        {totalRAs} RAs · {sumaRAs}/100 pts
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Estado: Módulo seleccionado → Constructor de RAs */}
                {moduloActivo && (
                    <div className="p-8 max-w-4xl mx-auto">
                        {/* Breadcrumb + Volver */}
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setModuloActivo(null)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 font-semibold transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                {carreraActiva?.nombre}
                            </button>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-xs font-semibold text-slate-700">{moduloActivo.nombre}</span>
                        </div>

                        {/* Cabecera del Constructor */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-5 h-5 text-violet-500" />
                                    <h1 className="text-xl font-black text-slate-900">Constructor de R.A.</h1>
                                </div>
                                <p className="text-sm text-slate-500">
                                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2 text-slate-600">{moduloActivo.codigo}</span>
                                    {moduloActivo.nombre}
                                    <span className="ml-3 text-slate-400">· {moduloActivo.horas_totales} horas totales</span>
                                </p>
                            </div>

                            {/* Medidor de puntos */}
                            <div className={`shrink-0 px-5 py-3 rounded-xl border-2 text-center transition-all
                                ${estadoSuma === 'ok' ? 'bg-emerald-50 border-emerald-300' :
                                    estadoSuma === 'exceso' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-200'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Sumatoria Pts</p>
                                <p className={`text-3xl font-black leading-none ${estadoSuma === 'ok' ? 'text-emerald-600' : estadoSuma === 'exceso' ? 'text-rose-600' : 'text-amber-600'}`}>
                                    {sumaTotal}<span className="text-base font-semibold text-slate-300">/100</span>
                                </p>
                            </div>
                        </div>

                        {/* Barra de progreso de puntos */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    Distribución de Puntos (Ordenanza 03-2017)
                                </span>
                                <span className="text-xs text-slate-400">
                                    {estadoSuma === 'ok'
                                        ? '✅ Malla lista para guardar'
                                        : estadoSuma === 'exceso'
                                            ? `⚠️ Excede por ${sumaTotal - 100} pts`
                                            : `⬜ Faltan ${puntosRestantes} pts para completar`}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${estadoSuma === 'ok' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                            estadoSuma === 'exceso' ? 'bg-gradient-to-r from-rose-400 to-rose-500' :
                                                'bg-gradient-to-r from-violet-400 to-indigo-500'
                                        }`}
                                    style={{ width: `${Math.min(porcentajeOcupado, 100)}%` }}
                                />
                            </div>
                            {/* Leyenda de RAs */}
                            {rasTemporales.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {rasTemporales.map((ra, i) => (
                                        <span key={i} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {ra.numero}: {ra.valor_maximo}pts
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Alerta Normativa */}
                        {estadoSuma !== 'ok' && rasTemporales.length > 0 && (
                            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm mb-5 border ${estadoSuma === 'exceso'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <strong>Ordenanza 03-2017 / ISFODOSU —</strong>{' '}
                                    {estadoSuma === 'exceso'
                                        ? `Los puntos asignados superan el máximo de 100. Reduzca ${sumaTotal - 100} pts.`
                                        : `Los Resultados de Aprendizaje deben sumar exactamente 100 pts. Asigne los ${puntosRestantes} pts restantes.`}
                                </div>
                            </div>
                        )}

                        {/* Tabla de RAs */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
                            {/* Cabecera tabla */}
                            <div className="grid grid-cols-[80px_1fr_110px_40px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Código</span>
                                <span>Competencia / Resultado de Aprendizaje</span>
                                <span className="text-center">Val. Máx.</span>
                                <span />
                            </div>

                            {rasTemporales.length === 0 && (
                                <div className="text-center py-12 text-slate-300">
                                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Sin Resultados de Aprendizaje</p>
                                    <p className="text-xs mt-1">Presione "+ Agregar R.A." para comenzar el diseño.</p>
                                </div>
                            )}

                            <div className="divide-y divide-slate-100">
                                {rasTemporales.map((ra, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-[80px_1fr_110px_40px] gap-3 px-5 py-3.5 items-center group hover:bg-violet-50/30 transition-colors"
                                    >
                                        {/* Código RA */}
                                        <input
                                            type="text"
                                            value={ra.numero}
                                            onChange={e => handleChangeRA(idx, 'numero', e.target.value)}
                                            className="w-full text-center text-xs font-bold font-mono bg-white border border-slate-200 rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                                            placeholder="RA1"
                                        />

                                        {/* Descripción */}
                                        <input
                                            type="text"
                                            value={ra.descripcion}
                                            autoFocus={idx === rasTemporales.length - 1 && !ra.descripcion}
                                            onChange={e => handleChangeRA(idx, 'descripcion', e.target.value)}
                                            className="w-full text-sm bg-white border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition placeholder:text-slate-300"
                                            placeholder="Describe la competencia que el estudiante debe demostrar..."
                                        />

                                        {/* Puntos */}
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={ra.valor_maximo || ''}
                                                onChange={e => handleChangeRA(idx, 'valor_maximo', e.target.value)}
                                                className={`w-full text-center text-sm font-bold border rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition ${ra.valor_maximo === 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-800'
                                                    }`}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">pts</span>
                                        </div>

                                        {/* Eliminar */}
                                        <button
                                            onClick={() => handleRemoveRA(idx)}
                                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar R.A."
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleAddRA}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar R.A.
                            </button>

                            <div className="flex items-center gap-3">
                                {guardadoOk && (
                                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold animate-in fade-in duration-300">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Guardado exitosamente
                                    </span>
                                )}
                                <button
                                    onClick={handleSaveRAs}
                                    disabled={sumaTotal !== 100 || guardando}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all duration-200
                                        ${sumaTotal === 100 && !guardando
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md hover:-translate-y-0.5'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        }`}
                                >
                                    {guardando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            {sumaTotal === 100 ? <Zap className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            Publicar Malla Curricular
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
