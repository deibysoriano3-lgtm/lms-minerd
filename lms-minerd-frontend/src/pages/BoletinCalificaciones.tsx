import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const s1 = (p1: number, p2: number) => Math.round((p1 + p2) / 2);
const s2 = (p3: number, p4: number) => Math.round((p3 + p4) / 2);
const colorNota = (n: number | null) => {
    if (n === null || n === 0) return 'text-slate-300';
    return n >= 70 ? 'text-emerald-700' : 'text-rose-600';
};

// Orden canónico de áreas MINERD (para que siempre salgan en el mismo orden)
const ORDEN_AREAS = [
    'Comunicativa',
    'Científica y Tecnológica',
    'Humanística y Social',
    'Desarrollo Personal y Espiritual',
];

// Agrupa calificaciones académicas por asignatura.descripcion (el área/competencia)
function agruparPorArea(calificaciones: any[]): Map<string, any[]> {
    const mapa = new Map<string, any[]>();
    // Primero insertamos las áreas en orden canónico
    ORDEN_AREAS.forEach(a => mapa.set(a, []));
    calificaciones.forEach(c => {
        const area = c.asignatura?.descripcion ?? 'Otras';
        if (!mapa.has(area)) mapa.set(area, []);
        mapa.get(area)!.push(c);
    });
    // Eliminar áreas vacías (que sí están en el orden canónico pero no tienen registros)
    mapa.forEach((califs, area) => { if (califs.length === 0) mapa.delete(area); });
    return mapa;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function BoletinCalificaciones() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [datos, setDatos] = useState<any>(null);
    const [error, setError] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('lms_minerd_token');
                const res = await axios.get(`http://localhost:3000/api/estudiantes/${id}/boletin`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDatos(res.data);
            } catch {
                setError('No se pudo cargar el boletín. Verifique que el estudiante exista y el servidor esté activo.');
            }
        };
        load();
    }, [id]);

    const handlePrint = () => window.print();

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
            <div className="max-w-md text-center">
                <p className="text-rose-600 font-semibold">{error}</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">← Volver</button>
            </div>
        </div>
    );

    if (!datos) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    // Agrupación de datos
    const esTecnico = !!datos.carrera_actual;
    const matricula = datos.matriculas?.[0];
    const periodo = matricula?.periodo?.nombre ?? '2025-2026';
    const seccion = matricula?.seccion?.nombre ?? '—';
    const grado = matricula?.seccion?.grado ?? '—';
    const tutor = datos.tutores?.[0]?.nombres_apellidos ?? 'Sin tutor registrado';

    // Calificaciones académicas indexadas por nombre de asignatura
    const acadMap: Record<string, any> = {};
    (datos.calificaciones_acad ?? []).forEach((c: any) => {
        acadMap[c.asignatura?.nombre] = c;
    });

    // Módulos formativos (agrupados)
    const modulosMap = new Map<string, { modulo: any; calificaciones: any[] }>();
    (datos.calificaciones_ra ?? []).forEach((c: any) => {
        const mod = c.resultado_aprendizaje?.modulo;
        if (!mod) return;
        if (!modulosMap.has(mod.codigo)) modulosMap.set(mod.codigo, { modulo: mod, calificaciones: [] });
        modulosMap.get(mod.codigo)!.calificaciones.push(c);
    });
    const modulos = Array.from(modulosMap.values());

    // Situación final
    const todasAsignAprobadas = Object.values(acadMap).every((c: any) => {
        const promS2 = s2(c.p3 ?? 0, c.p4 ?? 0);
        return promS2 >= 70;
    });
    const todosModAprobados = modulos.every(({ calificaciones }) => {
        const total = calificaciones.reduce((sum, c) => sum + (c.valor_logrado ?? 0), 0);
        return total >= 70;
    });
    const promovido = todasAsignAprobadas && (esTecnico ? todosModAprobados : true);

    return (
        <>
            {/* ── Barra de herramientas (solo en pantalla) ── */}
            <div className="no-print fixed top-0 left-0 right-0 bg-slate-900 text-white px-6 py-3 flex items-center justify-between z-50 shadow-xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <div className="text-sm font-semibold">
                    Boletín de Calificaciones — {datos.usuario?.nombre_completo}
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                    <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
                </button>
            </div>

            {/* ── Hoja para imprimir ── */}
            <div ref={printRef} className="boletin-container pt-16 print:pt-0 font-sans text-xs bg-white min-h-screen">

                {/* ═══════════════════════ PÁGINA 1 — PORTADA ═══════════════════════ */}
                <div className="boletin-page border border-slate-300 mx-auto print:mx-0 print:border-none">

                    {/* Encabezado institucional */}
                    <div className="flex items-start gap-3 border-b-2 border-slate-800 pb-2 mb-3">
                        {/* Logo MINERD (texto simplificado) */}
                        <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center shrink-0">
                            <span className="text-white text-[8px] font-black text-center leading-tight px-1">MINERD RD</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[8px] text-slate-500 uppercase tracking-wide font-semibold">República Dominicana · Ministerio de Educación</p>
                            <p className="text-[8px] font-semibold text-slate-600">Viceministerio de Servicios Técnicos y Pedagógicos</p>
                            <p className="text-[8px] text-slate-500">Dirección de la Modalidad de Educación Técnico Profesional</p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="bg-slate-800 text-white px-3 py-1 rounded text-[10px] font-black">{grado}</div>
                            <p className="text-[8px] text-slate-400 mt-0.5">Grado</p>
                        </div>
                    </div>

                    {/* Título */}
                    <div className="text-center mb-4">
                        <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">Boletín de Calificaciones</h1>
                        <p className="text-[9px] font-semibold text-slate-500 mt-0.5">
                            {esTecnico ? `${datos.carrera_actual?.nombre} · Modalidad Técnico Profesional` : 'Bachillerato General'}
                        </p>
                    </div>

                    {/* Datos del estudiante */}
                    <table className="w-full border-collapse mb-4 text-[9px]">
                        <tbody>
                            <tr>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold w-36">NOMBRES Y APELLIDOS</td>
                                <td className="border border-slate-300 px-2 py-1 font-semibold" colSpan={3}>{datos.usuario?.nombre_completo?.toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">NÚMERO DE ORDEN (RNE)</td>
                                <td className="border border-slate-300 px-2 py-1 font-mono">{datos.rne}</td>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">AÑO ESCOLAR</td>
                                <td className="border border-slate-300 px-2 py-1">{periodo}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">NOMBRE DEL CENTRO</td>
                                <td className="border border-slate-300 px-2 py-1" colSpan={1}>Politécnico MINERD</td>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">SECCIÓN</td>
                                <td className="border border-slate-300 px-2 py-1">{seccion}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">DISTRITO EDUCATIVO</td>
                                <td className="border border-slate-300 px-2 py-1">—</td>
                                <td className="border border-slate-300 px-2 py-1 bg-slate-100 font-bold">DIRECCIÓN REGIONAL</td>
                                <td className="border border-slate-300 px-2 py-1">—</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Período de reportes */}
                    <div className="mb-4">
                        <div className="bg-slate-800 text-white text-center text-[9px] font-bold py-1 mb-0">PERÍODO DE REPORTES DE CALIFICACIONES</div>
                        <table className="w-full border-collapse text-[8px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    {['Agost-Sept-Oct', 'Nov-Dic-Enero', 'Feb-Mar', 'Abril-May-Jun', 'Fin de Año Escolar'].map(p => (
                                        <th key={p} className="border border-slate-300 px-2 py-1 font-semibold text-center">{p}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <td key={i} className="border border-slate-300 px-2 py-3 text-center">
                                            {i === 4 ? <span className={`font-black text-sm ${promovido ? 'text-emerald-600' : 'text-rose-600'}`}>✓</span> : ''}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Situación final */}
                    <div className="mb-4">
                        <div className="bg-slate-800 text-white text-center text-[9px] font-bold py-1 mb-0">SITUACIÓN FINAL DEL ESTUDIANTE</div>
                        <table className="w-full border-collapse text-[9px]">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 px-4 py-2 text-center font-bold bg-slate-50 w-1/2">PROMOVIDO</th>
                                    <th className="border border-slate-300 px-4 py-2 text-center font-bold bg-slate-50 w-1/2">REPROBADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 px-4 py-3 text-center text-xl font-black">
                                        {promovido ? 'X' : ''}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center text-xl font-black text-rose-600">
                                        {!promovido ? 'X' : ''}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Observaciones */}
                    <div className="mb-4">
                        <div className="bg-slate-800 text-white text-center text-[9px] font-bold py-1 mb-1">OBSERVACIONES</div>
                        <div className="border border-slate-300 h-16 px-2 py-1 text-[8px] text-slate-400">
                            {datos.anecdotas?.[0]?.incidencia ?? ''}
                        </div>
                    </div>

                    {/* Firmas */}
                    <div className="grid grid-cols-2 gap-8 mt-6">
                        <div>
                            <div className="border-b border-slate-400 mb-1" />
                            <p className="text-[8px] text-center text-slate-500">Maestro/Encargado de Curso</p>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 mb-1" />
                            <p className="text-[8px] text-center text-slate-500">Director/a del Centro</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="border-b border-slate-400 mb-1" />
                        <p className="text-[8px] text-center text-slate-500">Firma del Padre, Madre o Tutor · Tutor: {tutor}</p>
                    </div>
                </div>

                {/* ═══════════════════════ SEPARADOR DE PÁGINA ═══════════════════════ */}
                <div className="page-break" />

                {/* ═══════════════════════ PÁGINA 2 — CALIFICACIONES ═══════════════════════ */}
                <div className="boletin-page border border-slate-300 mx-auto print:mx-0 print:border-none">

                    {/* Mini-encabezado */}
                    <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-2">
                        <div>
                            <p className="text-[8px] font-black uppercase text-slate-700">{datos.usuario?.nombre_completo}</p>
                            <p className="text-[8px] text-slate-400 font-mono">RNE: {datos.rne} · {grado} · Sección {seccion} · Año {periodo}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-600">{datos.carrera_actual?.nombre ?? 'Bachillerato General'}</p>
                            <p className="text-[8px] text-slate-400">{datos.carrera_actual?.codigo_minerd ?? ''}</p>
                        </div>
                    </div>

                    <div className={`grid gap-3 ${esTecnico ? 'grid-cols-2' : 'grid-cols-1'}`}>

                        {/* ── SECCIÓN ASIGNATURAS ── */}
                        <div>
                            <div className="bg-slate-800 text-white text-center text-[8px] font-bold py-0.5 mb-0">ASIGNATURAS</div>
                            <table className="w-full border-collapse text-[7.5px]">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-slate-300 px-1 py-0.5 text-left font-bold">Asignatura</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Primer Período">P1</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Segundo Período">P2</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold bg-slate-200" title="Promedio 1er Semestre">S1</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Tercer Período">P3</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Cuarto Período">P4</th>
                                        <th className="border border-slate-300 px-1 py-0.5 text-center font-bold bg-slate-200" title="Promedio 2do Semestre">S2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(datos.calificaciones_acad?.length ?? 0) === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4 text-[8px] text-slate-400">
                                                Sin calificaciones académicas registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        Array.from(agruparPorArea(datos.calificaciones_acad ?? [])).map(([area, califs]) => (
                                            <>
                                                <tr key={area}>
                                                    <td className="border border-slate-400 px-1 py-0.5 bg-slate-700 text-white font-bold text-[7px] uppercase tracking-wide" colSpan={7}>
                                                        {area}
                                                    </td>
                                                </tr>
                                                {califs.map((c: any) => {
                                                    const p1v = c?.p1 ?? 0;
                                                    const p2v = c?.p2 ?? 0;
                                                    const p3v = c?.p3 ?? 0;
                                                    const p4v = c?.p4 ?? 0;
                                                    const s1v = s1(p1v, p2v);
                                                    const s2v = s2(p3v, p4v);
                                                    return (
                                                        <tr key={c.asignatura_id} className="hover:bg-slate-50">
                                                            <td className="border border-slate-200 px-1 py-0.5">{c.asignatura?.nombre}</td>
                                                            {[p1v, p2v].map((n, i) => (
                                                                <td key={i} className={`border border-slate-200 px-1 py-0.5 text-center font-semibold ${colorNota(n)}`}>{n || '—'}</td>
                                                            ))}
                                                            <td className={`border border-slate-200 px-1 py-0.5 text-center font-black bg-slate-50 ${colorNota(s1v)}`}>{s1v || '—'}</td>
                                                            {[p3v, p4v].map((n, i) => (
                                                                <td key={i} className={`border border-slate-200 px-1 py-0.5 text-center font-semibold ${colorNota(n)}`}>{n || '—'}</td>
                                                            ))}
                                                            <td className={`border border-slate-200 px-1 py-0.5 text-center font-black bg-slate-50 ${colorNota(s2v)}`}>{s2v || '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Leyenda */}
                            <div className="mt-1 text-[6.5px] text-slate-400 leading-tight">
                                <strong>P1/P2/P3/P4</strong> — Calificación de período (0-100) &nbsp;|&nbsp;
                                <strong>S1</strong> — Semestral I (prom. P1+P2) &nbsp;|&nbsp;
                                <strong>S2</strong> — Semestral II (prom. P3+P4) &nbsp;|&nbsp;
                                Aprobación: ≥ 70 puntos
                            </div>
                        </div>

                        {/* ── BLOQUE MÓDULOS FORMATIVOS (solo técnicos) ── */}
                        {esTecnico && (
                            <div>
                                <div className="bg-slate-800 text-white text-center text-[8px] font-bold py-0.5 mb-0">BLOQUE DE LOS MÓDULOS FORMATIVOS</div>
                                {modulos.length === 0 ? (
                                    <div className="border border-dashed border-slate-200 p-4 text-center text-[8px] text-slate-400 mt-1">
                                        No hay calificaciones de módulos registradas aún.
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-[7.5px]">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="border border-slate-300 px-1 py-0.5 text-left font-bold">Módulo Formativo</th>
                                                <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Calificación Acumulada">CA</th>
                                                <th className="border border-slate-300 px-1 py-0.5 text-center font-bold" title="Resultado Aprendizaje Total / Max">RA Logrado</th>
                                                <th className="border border-slate-300 px-1 py-0.5 text-center font-bold">Final</th>
                                                <th className="border border-slate-300 px-1 py-0.5 text-center font-bold">A/R</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modulos.map(({ modulo, calificaciones }) => {
                                                const totalLogrado = calificaciones.reduce((sum, c) => sum + (c.valor_logrado ?? 0), 0);
                                                const totalMax = calificaciones.reduce((sum, c) => sum + (c.resultado_aprendizaje?.valor_maximo ?? 0), 0);
                                                const cf = totalMax > 0 ? Math.round((totalLogrado / totalMax) * 100) : 0;
                                                const aprobado = cf >= 70;
                                                return (
                                                    <>
                                                        <tr key={modulo.codigo} className={aprobado ? 'bg-emerald-50' : 'bg-rose-50'}>
                                                            <td className="border border-slate-200 px-1 py-0.5 font-bold" colSpan={1}>
                                                                <span className="font-mono text-slate-400 mr-1">{modulo.codigo}</span>{modulo.nombre}
                                                            </td>
                                                            <td className="border border-slate-200 px-1 py-0.5 text-center font-black">{totalLogrado}</td>
                                                            <td className="border border-slate-200 px-1 py-0.5 text-center text-slate-500">{totalLogrado}/{totalMax}</td>
                                                            <td className={`border border-slate-200 px-1 py-0.5 text-center font-black ${aprobado ? 'text-emerald-700' : 'text-rose-600'}`}>{cf}%</td>
                                                            <td className={`border border-slate-200 px-1 py-0.5 text-center font-black ${aprobado ? 'text-emerald-700' : 'text-rose-600'}`}>{aprobado ? 'A' : 'R'}</td>
                                                        </tr>
                                                        {/* Detalle RAs */}
                                                        {calificaciones.map((c: any) => (
                                                            <tr key={c.ra_id} className="bg-white">
                                                                <td className="border border-slate-100 px-1 py-0.5 pl-3 text-slate-400 text-[6.5px]">
                                                                    ↳ {c.resultado_aprendizaje?.numero}: {c.resultado_aprendizaje?.descripcion?.slice(0, 50)}…
                                                                </td>
                                                                <td className={`border border-slate-100 px-1 py-0.5 text-center text-[6.5px] ${colorNota(c.valor_logrado)}`}>{c.valor_logrado}</td>
                                                                <td className="border border-slate-100 px-1 py-0.5 text-center text-[6.5px] text-slate-400">/{c.resultado_aprendizaje?.valor_maximo}</td>
                                                                <td className="border border-slate-100" colSpan={2} />
                                                            </tr>
                                                        ))}
                                                    </>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}

                                {/* Leyenda módulos */}
                                <div className="mt-1 text-[6.5px] text-slate-400 leading-tight">
                                    <strong>CA</strong> — Calificación Acumulada (suma de RAs) &nbsp;|&nbsp;
                                    <strong>RA</strong> — Resultado de Aprendizaje &nbsp;|&nbsp;
                                    <strong>A</strong> — Aprobado (≥70%) &nbsp;|&nbsp;
                                    <strong>R</strong> — Reprobado
                                </div>

                                {/* Evaluación especial si hay recuperación */}
                                {(datos.calificaciones_ra ?? []).some((c: any) => (c.rp1 ?? 0) > 0 || (c.rp2 ?? 0) > 0) && (
                                    <div className="mt-2 border border-amber-200 rounded bg-amber-50 p-1.5 text-[7px] text-amber-800">
                                        <strong>⚠ Evaluación Especial / Recuperación:</strong> este estudiante tiene calificaciones de recuperación registradas.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen final */}
                    <div className="mt-3 border-t border-slate-200 pt-2">
                        <div className={`text-center py-2 rounded font-black text-sm ${promovido ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {promovido ? '✓ PROMOVIDO/A AL SIGUIENTE GRADO' : '✗ REPROBADO/A — DEBE REPETIR EL GRADO'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Estilos de impresión ── */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; break-after: page; }
                    .boletin-page { page-break-inside: avoid; margin: 0; padding: 16px; }
                    body { background: white; }
                }
                @media screen {
                    .boletin-page {
                        max-width: 800px;
                        padding: 24px;
                        margin: 24px auto;
                        background: white;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                        border-radius: 8px;
                    }
                }
            `}</style>
        </>
    );
}
