import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, FileSpreadsheet, FileText, CheckCircle, GraduationCap,
    ShieldCheck, FileDown, Loader2, FileOutput, AlertCircle, Printer
} from 'lucide-react';

interface Seccion { id: number; nombre: string; carrera?: { nombre: string } }

interface Reporte {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: 'PDF' | 'EXCEL' | 'AMBOS';
    categoria: 'ACADEMICO' | 'OFICIAL' | 'ESTUDIANTE';
    activo: boolean;
}

const REPORTES: Reporte[] = [
    {
        id: 'RPT-01',
        nombre: 'Boletín de Calificaciones',
        descripcion: 'Boletín de notas oficial por estudiante, con promedio acumulado y equivalencias de letras.',
        tipo: 'PDF', categoria: 'ESTUDIANTE', activo: true
    },
    {
        id: 'RPT-02',
        nombre: 'Sábana de Calificaciones (Acta Curso)',
        descripcion: 'Matriz completa de calificaciones (RAs) de una sección firmada por el docente para MINERD.',
        tipo: 'EXCEL', categoria: 'ACADEMICO', activo: true
    },
    {
        id: 'RPT-03',
        nombre: 'Récord de Notas — Historial Completo',
        descripcion: 'Documento oficial para universidades o traslado, con historial de 1ro a 6to.',
        tipo: 'AMBOS', categoria: 'OFICIAL', activo: false
    },
    {
        id: 'RPT-04',
        nombre: 'Boletín de Curso (Final Anual)',
        descripcion: 'Resumen anual de todas las asignaturas y módulos aprobados de un grado.',
        tipo: 'PDF', categoria: 'ESTUDIANTE', activo: false
    },
    {
        id: 'RPT-05',
        nombre: 'Matrícula Inicial vs Final SIGERD',
        descripcion: 'Formulario estadístico para el Ministerio. Requerido al cierre del año escolar.',
        tipo: 'PDF', categoria: 'OFICIAL', activo: false
    },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: string }) {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
        PDF: { cls: 'text-rose-600 bg-rose-50 border-rose-200', icon: <FileText className="w-3 h-3" />, label: 'PDF' },
        EXCEL: { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <FileSpreadsheet className="w-3 h-3" />, label: 'EXCEL' },
        AMBOS: { cls: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <FileOutput className="w-3 h-3" />, label: 'MULTI' },
    };
    const { cls, icon, label } = map[tipo] ?? map.PDF;
    return (
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${cls}`}>
            {icon} {label}
        </span>
    );
}

function CategoriaBadge({ cat }: { cat: string }) {
    const map: Record<string, string> = {
        ACADEMICO: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        OFICIAL: 'bg-amber-100 text-amber-700 border-amber-200',
        ESTUDIANTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    const label: Record<string, string> = {
        ACADEMICO: 'Académico Interno', OFICIAL: 'Oficial Distrito 17-02', ESTUDIANTE: 'Para el Estudiante'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${map[cat] ?? ''}`}>{label[cat] ?? cat}</span>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminReportsDashboard() {
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [seccionId, setSeccionId] = useState<number | ''>('');
    const [busquedaRNE, setBusquedaRNE] = useState('');
    const [descargando, setDescargando] = useState<string | null>(null);
    const [mensajeOk, setMensajeOk] = useState('');

    const token = localStorage.getItem('lms_minerd_token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        axios.get('http://localhost:3000/api/matricula/secciones', { headers })
            .then(r => {
                setSecciones(r.data);
                if (r.data.length > 0) setSeccionId(r.data[0].id);
            })
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDescargar = async (rpt: Reporte) => {
        if (!rpt.activo) return;

        if (rpt.id === 'RPT-02') {
            if (!seccionId) { alert('Seleccione una sección primero.'); return; }
            setDescargando(rpt.id);
            try {
                const res = await axios.get(`http://localhost:3000/api/reportes/sabana-excel/${seccionId}`, {
                    headers, responseType: 'blob'
                });
                const secNombre = secciones.find(s => s.id === seccionId)?.nombre ?? 'Seccion';
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.setAttribute('download', `Sabana_${secNombre.replace(/\s/g, '_')}_MINERD.xlsx`);
                document.body.appendChild(a); a.click();
                a.parentNode?.removeChild(a);
                window.URL.revokeObjectURL(url);
                setMensajeOk('✅ Sábana generada y descargada correctamente.');
                setTimeout(() => setMensajeOk(''), 4000);
            } catch {
                alert('Error al generar la sábana. Verifique que la sección tenga calificaciones.');
            } finally { setDescargando(null); }
            return;
        }

        if (rpt.id === 'RPT-01') {
            if (!busquedaRNE.trim()) { alert('Ingrese el RNE del estudiante para generar el boletín.'); return; }
            // Placeholder: conectar endpoint de boletín cuando esté listo en el backend
            alert(`El endpoint de Boletín PDF para RNE "${busquedaRNE}" está en construcción en el backend (GET /api/reportes/boletin/:rne).`);
            return;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* ── Cabecera ─────────────────────────────────────────── */}
                <header className="mb-8 border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Control de Estudios</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Generación de Actas</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reportes y Evaluaciones Oficiales</h1>
                    <p className="text-slate-500 mt-1 text-sm max-w-2xl">
                        Consolidación de calificaciones, cálculo de promedios, equivalencias e impresión de documentos avalados por MINERD.
                    </p>
                </header>

                {/* ── Herramientas Rápidas ─────────────────────────────── */}
                <div className="grid md:grid-cols-2 gap-5 mb-8">
                    {/* Boletín rápido por RNE */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Boletín Rápido (por RNE)</h3>
                                <p className="text-xs text-slate-500">Imprime el boletín acumulado para padres y tutores.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={busquedaRNE}
                                    onChange={e => setBusquedaRNE(e.target.value)}
                                    placeholder="RNE del Estudiante..."
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                />
                            </div>
                            <button
                                onClick={() => handleDescargar(REPORTES[0])}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                                <Printer className="w-4 h-4" /> Imprimir
                            </button>
                        </div>
                    </div>

                    {/* Selector de Sección para Sábana */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Sábana de Calificaciones (RPT-02)</h3>
                                <p className="text-xs text-slate-500">Seleccione la sección y descargue el acta oficial en Excel.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={seccionId}
                                onChange={e => setSeccionId(Number(e.target.value))}
                                className="flex-1 border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {secciones.length === 0 && <option>Cargando secciones...</option>}
                                {secciones.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} — {s.carrera?.nombre}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleDescargar(REPORTES[1])}
                                disabled={descargando === 'RPT-02' || !seccionId}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
                            >
                                {descargando === 'RPT-02'
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                                    : <><FileDown className="w-4 h-4" /> Descargar</>
                                }
                            </button>
                        </div>
                        {mensajeOk && (
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                                <CheckCircle className="w-3.5 h-3.5" /> {mensajeOk}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Biblioteca de Reportes ───────────────────────────── */}
                <div className="flex items-center gap-2 mb-5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-800">Biblioteca de Reportes del Centro</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {REPORTES.map(rpt => (
                        <div
                            key={rpt.id}
                            className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col transition-all ${rpt.activo
                                    ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                    : 'border-slate-200 opacity-60'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3 gap-2">
                                <CategoriaBadge cat={rpt.categoria} />
                                <TipoBadge tipo={rpt.tipo} />
                            </div>

                            <div className="flex items-start gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 font-mono mt-0.5 shrink-0">{rpt.id}</span>
                                <h3 className="text-sm font-bold text-slate-800 leading-snug">{rpt.nombre}</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-5 flex-1 leading-relaxed">{rpt.descripcion}</p>

                            {rpt.activo ? (
                                <button
                                    onClick={() => handleDescargar(rpt)}
                                    disabled={descargando === rpt.id}
                                    className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {descargando === rpt.id
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                                        : <><FileDown className="w-3.5 h-3.5" /> Generar Archivo</>
                                    }
                                </button>
                            ) : (
                                <div className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-dashed border-slate-200">
                                    <AlertCircle className="w-3.5 h-3.5" /> En desarrollo — Backend pendiente
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Motor de Cierre ──────────────────────────────────── */}
                <div className="mt-8 bg-slate-900 rounded-2xl p-7 border border-slate-800 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -right-10 -top-10 opacity-5">
                        <CheckCircle className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block mb-3 border border-emerald-400/20">
                            Cierre de Año Escolar
                        </span>
                        <h3 className="text-xl font-bold mb-2">Motor de Evaluación Cíclica</h3>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Calcula el estado final de todos los estudiantes del periodo seleccionado. Aplica la equivalencia oficial de MINERD
                            convirtiendo el historial de RAs a escala numérica para la modalidad Técnico Profesional.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm outline-none flex-1 min-w-48">
                                <option>Año Escolar 2024-2025</option>
                                <option>Año Escolar 2025-2026</option>
                            </select>
                            <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.2)] transition flex items-center gap-2 whitespace-nowrap">
                                <FileOutput className="w-4 h-4" /> Procesar Promedios Globales
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
