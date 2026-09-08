import { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, ClipboardList, FileText, Award,
  CheckCircle, XCircle, AlertCircle, User, Calendar, ChevronDown,
  ChevronRight, Briefcase, Star, BookMarked, Activity, CalendarDays, Loader2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api, { API_BASE_URL } from '../api';
import CalendarioAcademico from '../components/CalendarioAcademico';

type Vista = 'dashboard' | 'calificaciones' | 'asignaturas' | 'anecdotas' | 'boletin' | 'fct' | 'tareas' | 'horario' | 'asistencia' | 'calendario';

interface PerfilEstudiante {
  id: number;
  rne: string;
  fecha_nacimiento: string;
  estado_academico: string;
  fecha_ingreso: string;
  usuario: { nombre_completo: string; email: string };
  carrera_actual: { nombre: string; codigo_minerd: string; familia: { nombre: string } } | null;
  tutores: { nombres_apellidos: string; parentesco: string; telefono: string; es_tutor_principal: boolean }[];
  matriculas: {
    seccion: { id: number; nombre: string; grado: string };
    periodo: { nombre: string; es_activo: boolean };
    estado_matricula: string;
  }[];
  calificaciones_ra: {
    id: number;
    valor_logrado: number;
    rp1: number;
    rp2: number;
    resultado_aprendizaje: {
      id: number;
      numero: string;
      descripcion: string;
      valor_maximo: number;
      modulo: { id: number; nombre: string; codigo: string };
    };
  }[];
  calificaciones_acad: {
    id: number;
    p1: number; p2: number; p3: number; p4: number;
    rp1: number; rp2: number; rp3: number; rp4: number;
    cpc: number; cpex: number; estado: string;
    asignatura: { id: number; nombre: string; codigo: string };
  }[];
  anecdotas: {
    id: number;
    incidencia: string;
    tipo: string;
    fecha_registro: string;
    docente: { usuario: { nombre_completo: string } };
  }[];
  evaluaciones_fct: {
    id: number;
    empresa: string;
    tutor_empresa: string;
    horas_reportadas: number;
    criterios: string;
    comentarios: string;
    estado: string;
    creado_en: string;
  }[];
}

function calcCF(c: PerfilEstudiante['calificaciones_acad'][0]): number {
  const vals = [c.p1, c.p2, c.p3, c.p4].filter(v => v && v > 0);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function StatusBadge({ aprobado, pct }: { aprobado: boolean; pct?: number }) {
  return aprobado ? (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3" /> Aprobado{pct !== undefined ? ` · ${pct}%` : ''}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
      <XCircle className="w-3 h-3" /> Reprobado{pct !== undefined ? ` · ${pct}%` : ''}
    </span>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-cyan-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

/* ─── VISTA: DASHBOARD ─── */
function VistaDashboard({ p }: { p: PerfilEstudiante }) {
  const matricula = p.matriculas[0];
  const totalRA = p.calificaciones_ra.length;
  const aprobadosRA = p.calificaciones_ra.filter(c => {
    const pct = c.resultado_aprendizaje.valor_maximo > 0
      ? Math.round((c.valor_logrado / c.resultado_aprendizaje.valor_maximo) * 100) : 0;
    return pct >= 70;
  }).length;
  const totalAcad = p.calificaciones_acad.length;
  const aprobadosAcad = p.calificaciones_acad.filter(c => calcCF(c) >= 70).length;
  const tutor = p.tutores.find(t => t.es_tutor_principal) ?? p.tutores[0];

  return (
    <div className="space-y-6">
      {/* Tarjeta de identidad */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-wider">Estudiante</p>
            <h2 className="text-xl font-black truncate">{p.usuario.nombre_completo}</h2>
            <p className="text-cyan-100 text-sm mt-0.5">RNE: <span className="font-bold">{p.rne}</span></p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
            p.estado_academico === 'ACTIVO' ? 'bg-emerald-400/30 text-emerald-100' : 'bg-rose-400/30 text-rose-100'
          }`}>
            {p.estado_academico}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-cyan-200 text-[10px] uppercase font-bold tracking-wide">Carrera</p>
            <p className="font-semibold leading-tight mt-0.5 truncate">
              {p.carrera_actual?.nombre ?? '—'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-cyan-200 text-[10px] uppercase font-bold tracking-wide">Período</p>
            <p className="font-semibold leading-tight mt-0.5 truncate">
              {matricula?.periodo.nombre ?? '—'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 col-span-2 sm:col-span-1">
            <p className="text-cyan-200 text-[10px] uppercase font-bold tracking-wide">Sección</p>
            <p className="font-semibold leading-tight mt-0.5">
              {matricula ? `${matricula.seccion.grado} · ${matricula.seccion.nombre}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'RAs Evaluadas', value: totalRA, icon: BookMarked, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'RAs Aprobadas', value: aprobadosRA, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Asignaturas', value: totalAcad, icon: BookOpen, color: 'text-violet-600 bg-violet-50' },
          { label: 'Asig. Aprobadas', value: aprobadosAcad, icon: Award, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tutor legal */}
      {tutor && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Tutor Legal</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{tutor.nombres_apellidos}</p>
              <p className="text-xs text-slate-500">{tutor.parentesco} · {tutor.telefono}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── VISTA: CALIFICACIONES RA ─── */
function VistaCalificaciones({ p }: { p: PerfilEstudiante }) {
  const [expandido, setExpandido] = useState<number | null>(null);

  // Agrupar por módulo
  const modulos = new Map<number, {
    modulo: { id: number; nombre: string; codigo: string };
    ras: PerfilEstudiante['calificaciones_ra'];
  }>();

  for (const cal of p.calificaciones_ra) {
    const mod = cal.resultado_aprendizaje.modulo;
    if (!modulos.has(mod.id)) modulos.set(mod.id, { modulo: mod, ras: [] });
    modulos.get(mod.id)!.ras.push(cal);
  }

  if (modulos.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BookMarked className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">Sin calificaciones de módulos aún</p>
        <p className="text-xs mt-1">Las notas aparecerán cuando el docente las registre.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(modulos.values()).map(({ modulo, ras }) => {
        const totalLogrado = ras.reduce((s, r) => s + r.valor_logrado, 0);
        const totalMax = ras.reduce((s, r) => s + r.resultado_aprendizaje.valor_maximo, 0);
        const pct = totalMax > 0 ? Math.round((totalLogrado / totalMax) * 100) : 0;
        const aprobado = pct >= 70;
        const abierto = expandido === modulo.id;

        return (
          <div key={modulo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
              onClick={() => setExpandido(abierto ? null : modulo.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{modulo.codigo}</span>
                  <StatusBadge aprobado={aprobado} pct={pct} />
                </div>
                <p className="font-bold text-slate-800 text-sm leading-snug">{modulo.nombre}</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className={`h-full rounded-full transition-all ${aprobado ? 'bg-emerald-500' : 'bg-rose-400'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{totalLogrado} / {totalMax} puntos</p>
              </div>
              {abierto ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>

            <AnimatePresence>
              {abierto && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {ras.map(cal => {
                      const ra = cal.resultado_aprendizaje;
                      const raPct = ra.valor_maximo > 0 ? Math.round((cal.valor_logrado / ra.valor_maximo) * 100) : 0;
                      const raOk = raPct >= 70;
                      return (
                        <div key={cal.id} className="px-5 py-3 flex items-center gap-3 bg-slate-50/50">
                          <span className="text-xs font-bold text-cyan-600 w-8 shrink-0">{ra.numero}</span>
                          <p className="flex-1 text-xs text-slate-600 leading-snug">{ra.descripcion}</p>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${raOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {cal.valor_logrado}<span className="text-slate-400 font-normal">/{ra.valor_maximo}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">{raPct}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── VISTA: ASIGNATURAS ACADÉMICAS ─── */
function VistaAsignaturas({ p }: { p: PerfilEstudiante }) {
  if (p.calificaciones_acad.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">Sin asignaturas registradas aún</p>
        <p className="text-xs mt-1">Las notas aparecerán cuando el docente las registre.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-bold">Asignatura</th>
              <th className="px-3 py-3 font-bold text-center">P1</th>
              <th className="px-3 py-3 font-bold text-center">P2</th>
              <th className="px-3 py-3 font-bold text-center">P3</th>
              <th className="px-3 py-3 font-bold text-center">P4</th>
              <th className="px-3 py-3 font-bold text-center">CF</th>
              <th className="px-4 py-3 font-bold text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {p.calificaciones_acad.map(c => {
              const cf = calcCF(c);
              const aprobado = cf >= 70;
              const nota = (v: number | null) => v && v > 0 ? (
                <span className={v >= 70 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>{v}</span>
              ) : <span className="text-slate-300">—</span>;
              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-800">{c.asignatura.nombre}</td>
                  <td className="px-3 py-3 text-center">{nota(c.p1)}</td>
                  <td className="px-3 py-3 text-center">{nota(c.p2)}</td>
                  <td className="px-3 py-3 text-center">{nota(c.p3)}</td>
                  <td className="px-3 py-3 text-center">{nota(c.p4)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-black text-base ${cf >= 70 ? 'text-emerald-700' : cf > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                      {cf > 0 ? cf : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cf > 0 ? <StatusBadge aprobado={aprobado} /> : <span className="text-xs text-slate-400">Pendiente</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── VISTA: ANOTACIONES ─── */
function VistaAnecdotas({ p }: { p: PerfilEstudiante }) {
  const colorTipo: Record<string, string> = {
    OBSERVACION: 'bg-blue-100 text-blue-700',
    FELICITACION: 'bg-emerald-100 text-emerald-700',
    LLAMADA_ATENCION: 'bg-amber-100 text-amber-700',
    SUSPENSION: 'bg-rose-100 text-rose-700',
  };

  if (p.anecdotas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">Sin anotaciones registradas</p>
        <p className="text-xs mt-1">Las observaciones del docente aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {p.anecdotas.map(a => (
        <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colorTipo[a.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                  {a.tipo.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(a.fecha_registro).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{a.incidencia}</p>
              <p className="text-xs text-slate-400 mt-2">Registrado por: <span className="font-semibold">{a.docente.usuario.nombre_completo}</span></p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── VISTA: BOLETÍN ─── */
function VistaBoletin({ p }: { p: PerfilEstudiante }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Boletín Oficial de Calificaciones</h3>
            <p className="text-xs text-slate-500">Documento oficial — Politécnico Prof. Rosario Rojas de Contreras</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
          {[
            { label: 'Estudiante', value: p.usuario.nombre_completo },
            { label: 'RNE', value: p.rne },
            { label: 'Carrera', value: p.carrera_actual?.nombre ?? '—' },
            { label: 'Sección', value: p.matriculas[0] ? `${p.matriculas[0].seccion.grado} · ${p.matriculas[0].seccion.nombre}` : '—' },
            { label: 'Período', value: p.matriculas[0]?.periodo.nombre ?? '—' },
            { label: 'Familia Profesional', value: p.carrera_actual?.familia.nombre ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>

        <a
          href={`/boletin/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Abrir Boletín para Imprimir
        </a>
      </div>

      <p className="text-xs text-slate-400 text-center">
        El boletín se abre en una nueva pestaña en formato imprimible oficial.
      </p>
    </div>
  );
}

/* ─── VISTA: MI ASISTENCIA ─── */
function VistaAsistencia() {
  const [data, setData] = useState<{ resumen: any[]; historial: any[] } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/api/asistencia/mi-asistencia')
      .then(r => setData(r.data))
      .finally(() => setCargando(false));
  }, []);

  const ESTADO_COLOR: Record<string, string> = {
    PRESENTE:    'bg-emerald-100 text-emerald-700',
    AUSENTE:     'bg-rose-100 text-rose-700',
    TARDANZA:    'bg-amber-100 text-amber-700',
    JUSTIFICADO: 'bg-blue-100 text-blue-700',
  };

  if (cargando) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data || data.resumen.length === 0) return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Aún no hay registros de asistencia para tu cuenta.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Resumen tarjetas */}
      <div className="grid sm:grid-cols-2 gap-4">
        {data.resumen.map((r: any) => (
          <div key={r.seccion_id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-bold text-slate-800 text-sm">{r.nombre_seccion}</p>
                <p className="text-xs text-slate-400">{r.carrera}</p>
              </div>
              <span className={`text-sm font-black px-3 py-1 rounded-full
                ${r.pct_asistencia >= 90 ? 'bg-emerald-100 text-emerald-700' :
                  r.pct_asistencia >= 80 ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'}`}>
                {r.pct_asistencia}%
              </span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex-1 text-center bg-slate-50 rounded-lg py-2">
                <span className="block font-bold text-slate-700 text-base">{r.total}</span>
                <span className="text-slate-400">Total</span>
              </span>
              <span className="flex-1 text-center bg-emerald-50 rounded-lg py-2">
                <span className="block font-bold text-emerald-700 text-base">{r.presentes}</span>
                <span className="text-emerald-500">Presente</span>
              </span>
              <span className="flex-1 text-center bg-rose-50 rounded-lg py-2">
                <span className="block font-bold text-rose-700 text-base">{r.ausencias}</span>
                <span className="text-rose-400">Ausente</span>
              </span>
              <span className="flex-1 text-center bg-amber-50 rounded-lg py-2">
                <span className="block font-bold text-amber-700 text-base">{r.tardanzas}</span>
                <span className="text-amber-400">Tardanza</span>
              </span>
            </div>
            {r.pct_asistencia < 80 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Estás por debajo del 80% de asistencia requerido.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Historial detallado */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Historial reciente</h3>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.historial.slice(0, 30).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">{new Date(r.fecha).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-slate-400">{r.seccion?.nombre}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ESTADO_COLOR[r.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VISTA: HORARIO ─── */
function VistaHorario({ miHorario, setMiHorario, docsHorario, setDocsHorario, cargandoHorario, setCargandoHorario }: {
  miHorario: any[]; setMiHorario: (v: any[]) => void;
  docsHorario: any[]; setDocsHorario: (v: any[]) => void;
  cargandoHorario: boolean; setCargandoHorario: (v: boolean) => void;
}) {
  const DIAS_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  const DIA_COLOR: Record<string, string> = {
    LUNES: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    MARTES: 'bg-violet-50 border-violet-200 text-violet-700',
    MIERCOLES: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    JUEVES: 'bg-amber-50 border-amber-200 text-amber-700',
    VIERNES: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    SABADO: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  useEffect(() => {
    if (miHorario.length > 0) return;
    setCargandoHorario(true);
    Promise.all([api.get('/api/horario/mi-horario'), api.get('/api/horario/documentos')])
      .then(([rH, rD]) => { setMiHorario(rH.data); setDocsHorario(rD.data); })
      .finally(() => setCargandoHorario(false));
  }, []);

  if (cargandoHorario) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

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

  const colorMap: Record<number, string> = {};
  let ci = 0;
  miHorario.forEach((h: any) => { if (h.carga_id != null && colorMap[h.carga_id] === undefined) { colorMap[h.carga_id] = BLOCK_COLORS[ci++ % BLOCK_COLORS.length]; } });

  const porDia: Record<string, any[]> = {};
  DIAS_ORDEN.forEach(d => { porDia[d] = []; });
  miHorario.forEach((h: any) => { if (porDia[h.dia]) porDia[h.dia].push(h); });
  const diasActivos = DIAS_ORDEN.filter(d => porDia[d].length > 0);
  const horas = Array.from({ length: END_H - START_H + 1 }, (_, i) => `${(START_H + i).toString().padStart(2, '0')}:00`);

  return (
    <div className="space-y-6">
      {diasActivos.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tu horario aún no ha sido cargado en el sistema.</p>
        </div>
      ) : (
        <>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex" style={{ minWidth: `${diasActivos.length * 150 + 56}px` }}>
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
              {diasActivos.map(dia => (
                <div key={dia} className="flex-1 border-r border-slate-200 last:border-r-0">
                  <div className="h-10 flex items-center justify-center bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{DIAS_LABEL[dia]}</span>
                  </div>
                  <div className="relative" style={{ height: `${GRID_H}px` }}>
                    {horas.map((_, i) => (
                      <div key={i} className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: `${(i / (END_H - START_H)) * GRID_H}px` }} />
                    ))}
                    {porDia[dia].map((h: any) => {
                      const color = colorMap[h.carga_id] ?? BLOCK_COLORS[0];
                      const nombre = h.carga?.modulo_formativo?.nombre ?? h.carga?.asignatura_academica?.nombre ?? 'Clase';
                      const ht = heightPx(h.hora_inicio, h.hora_fin);
                      return (
                        <div key={h.id}
                          className={`absolute left-1 right-1 rounded-lg border p-1.5 overflow-hidden flex flex-col gap-0.5 ${color}`}
                          style={{ top: `${topPx(h.hora_inicio)}px`, height: `${ht}px` }}>
                          <p className="text-[11px] font-bold leading-tight line-clamp-2">{nombre}</p>
                          {ht > 44 && <p className="text-[10px] opacity-70 truncate">{h.carga?.docente?.usuario?.nombre_completo}</p>}
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
        <div className="flex flex-wrap gap-2">
          {Object.entries(colorMap).map(([cargaId, color]) => {
            const h: any = miHorario.find((x: any) => x.carga_id === Number(cargaId));
            const nombre = h?.carga?.modulo_formativo?.nombre ?? h?.carga?.asignatura_academica?.nombre ?? 'Clase';
            return <span key={cargaId} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{nombre}</span>;
          })}
        </div>
        </>
      )}

      {docsHorario.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-violet-600" /> Documentos de horario
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {docsHorario.map((d: any) => (
              <a key={d.id} href={`${API_BASE_URL}/uploads/horarios/${d.filename}`} target="_blank" rel="noreferrer"
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
}

/* ─── VISTA: FCT ─── */
function VistaFCT({ p }: { p: PerfilEstudiante }) {
  const fct = p.evaluaciones_fct[0];

  if (!fct) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Briefcase className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">Sin evaluación FCT registrada</p>
        <p className="text-xs mt-1">La empresa enviará la evaluación de tu pasantía al concluir.</p>
      </div>
    );
  }

  let criterios: Record<string, string> = {};
  try { criterios = JSON.parse(fct.criterios); } catch { /* ignore */ }

  const labels: Record<string, string> = {
    asistencia: 'Asistencia y Puntualidad',
    trabajo_equipo: 'Trabajo en Equipo',
    habilidades_tecnicas: 'Habilidades Técnicas',
    seguridad: 'Normas de Seguridad',
    iniciativa: 'Iniciativa',
  };

  const colorValor: Record<string, string> = {
    Excelente: 'text-emerald-700 bg-emerald-50',
    Bueno: 'text-blue-700 bg-blue-50',
    Suficiente: 'text-amber-700 bg-amber-50',
    Deficiente: 'text-rose-700 bg-rose-50',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{fct.empresa}</h3>
            <p className="text-xs text-slate-500">Tutor: {fct.tutor_empresa}</p>
          </div>
          <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${fct.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {fct.estado}
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <Activity className="w-4 h-4 text-cyan-600" />
          <span className="text-sm font-semibold text-slate-700">
            {fct.horas_reportadas} horas reportadas
            <span className="text-slate-400 font-normal"> / 360 requeridas</span>
          </span>
          <div className="flex-1 h-2 bg-slate-200 rounded-full ml-3 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${Math.min((fct.horas_reportadas / 360) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-cyan-700 shrink-0">
            {Math.round((fct.horas_reportadas / 360) * 100)}%
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(criterios).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-600">{labels[key] ?? key}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${colorValor[val] ?? 'bg-slate-100 text-slate-600'}`}>
                <Star className="w-3 h-3" /> {val}
              </span>
            </div>
          ))}
        </div>

        {fct.comentarios && (
          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold text-xs uppercase tracking-wide text-blue-600 mb-1">Comentarios del tutor</p>
            {fct.comentarios}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── VISTA: TAREAS ─── */
function VistaTareas({ seccionId }: { seccionId: number }) {
  const [tareas, setTareas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/api/tareas/seccion/${seccionId}`)
      .then(r => { setTareas(Array.isArray(r.data) ? r.data : []); setCargando(false); })
      .catch(() => setCargando(false));
  }, [seccionId]);

  const handleEntregar = async (tarea_id: number) => {
    setEnviando(tarea_id);
    try {
      const r = await api.post(`/api/tareas/${tarea_id}/entregas`, {});
      setTareas(prev => prev.map(t => t.id === tarea_id ? { ...t, mi_entrega: r.data } : t));
    } catch { /* silencio */ }
    finally { setEnviando(null); }
  };

  if (cargando) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  const ahora = new Date();
  const proximas = tareas.filter(t => t.estado === 'ACTIVA' && new Date(t.fecha_entrega) >= ahora);
  const vencidas = tareas.filter(t => t.estado === 'ACTIVA' && new Date(t.fecha_entrega) < ahora);
  const cerradas = tareas.filter(t => t.estado !== 'ACTIVA');

  const urgencia = (fecha: string) => {
    const diff = (new Date(fecha).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'border-rose-300 bg-rose-50';
    if (diff < 1) return 'border-amber-300 bg-amber-50';
    if (diff < 3) return 'border-orange-200 bg-orange-50';
    return 'border-slate-200 bg-white';
  };

  const TareaCard = ({ t }: { t: any }) => (
    <div className={`rounded-2xl border p-4 shadow-sm space-y-2 ${urgencia(t.fecha_entrega)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">{t.tipo}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.prioridad}</span>
          </div>
          <h3 className="font-bold text-slate-800 leading-tight">{t.titulo}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.descripcion}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Entrega: <span className="font-semibold">{new Date(t.fecha_entrega).toLocaleDateString('es-DO')}</span></span>
        </div>

        {t.mi_entrega ? (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            t.mi_entrega.estado === 'REVISADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {t.mi_entrega.estado === 'REVISADA' ? '✓ Revisada' : '✓ Entregada'}
          </span>
        ) : t.permite_entrega ? (
          <button
            onClick={() => handleEntregar(t.id)}
            disabled={enviando === t.id}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            {enviando === t.id ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Marcar entregada
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Sin entregas</span>
        )}
      </div>
    </div>
  );

  const Seccion = ({ titulo, items, empty }: { titulo: string; items: any[]; empty: string }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">{titulo} <span className="text-slate-400 font-normal">({items.length})</span></h3>
      {items.length === 0 ? <p className="text-sm text-slate-400 italic">{empty}</p> : items.map(t => <TareaCard key={t.id} t={t} />)}
    </div>
  );

  if (tareas.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No hay tareas asignadas</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <Seccion titulo="Próximas" items={proximas} empty="No hay tareas próximas" />
      <Seccion titulo="Vencidas sin entregar" items={vencidas.filter(t => !t.mi_entrega)} empty="¡Sin vencidas! Todo al día." />
      <Seccion titulo="Cerradas / Archivadas" items={cerradas} empty="Ninguna" />
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function StudentPortal() {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [miHorario, setMiHorario] = useState<any[]>([]);
  const [docsHorario, setDocsHorario] = useState<any[]>([]);
  const [cargandoHorario, setCargandoHorario] = useState(false);

  useEffect(() => {
    api.get('/api/estudiantes/mi-perfil')
      .then(r => { setPerfil(r.data); setCargando(false); })
      .catch(e => { setError(e.response?.data?.message || e.message || 'Error de conexión'); setCargando(false); });
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-rose-500">
          <AlertCircle className="w-10 h-10 opacity-60" />
          <p className="text-sm font-semibold">{error || 'Error cargando perfil'}</p>
        </div>
      </div>
    );
  }

  const tieneFCT = perfil.evaluaciones_fct.length > 0;

  const navItems: { id: Vista; icon: any; label: string }[] = [
    { id: 'dashboard', icon: User, label: 'Mi Perfil' },
    { id: 'calificaciones', icon: BookMarked, label: 'Módulos y RAs' },
    { id: 'asignaturas', icon: BookOpen, label: 'Asignaturas' },
    { id: 'tareas', icon: ClipboardList, label: 'Mis Tareas' },
    { id: 'horario', icon: CalendarDays, label: 'Mi Horario' },
    { id: 'asistencia', icon: CheckCircle, label: 'Mi Asistencia' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'anecdotas', icon: Activity, label: 'Anotaciones' },
    { id: 'boletin', icon: FileText, label: 'Mi Boletín' },
    ...(tieneFCT ? [{ id: 'fct' as Vista, icon: Briefcase, label: 'FCT / Pasantía' }] : []),
  ];

  const titulo: Record<Vista, string> = {
    dashboard: 'Mi Perfil',
    calificaciones: 'Módulos y Resultados de Aprendizaje',
    asignaturas: 'Asignaturas Académicas',
    tareas: 'Mis Tareas',
    horario: 'Mi Horario',
    asistencia: 'Mi Asistencia',
    calendario: 'Calendario Académico',
    anecdotas: 'Registro de Anotaciones',
    boletin: 'Mi Boletín de Calificaciones',
    fct: 'Formación en Centros de Trabajo',
  };

  return (
    <div className="flex gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 hidden md:block">
        <div className="sticky top-6 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Portal Estudiantil</p>
          {navItems.map(n => (
            <NavItem key={n.id} icon={n.icon} label={n.label} active={vista === n.id} onClick={() => setVista(n.id)} />
          ))}
        </div>
      </aside>

      {/* Navegación móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex overflow-x-auto">
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => setVista(n.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-bold transition-colors shrink-0 ${
              vista === n.id ? 'text-cyan-600' : 'text-slate-400'
            }`}
          >
            <n.icon className="w-5 h-5" />
            {n.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="mb-5">
          <h1 className="text-xl font-black text-slate-800">{titulo[vista]}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {perfil.usuario.nombre_completo} · {perfil.carrera_actual?.nombre ?? 'Sin carrera asignada'}
          </p>
        </div>

        <motion.div
          key={vista}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {vista === 'dashboard' && <VistaDashboard p={perfil} />}
          {vista === 'calificaciones' && <VistaCalificaciones p={perfil} />}
          {vista === 'asignaturas' && <VistaAsignaturas p={perfil} />}
          {vista === 'tareas' && <VistaTareas seccionId={perfil.matriculas[0]?.seccion?.id ?? 0} />}
          {vista === 'horario' && <VistaHorario miHorario={miHorario} setMiHorario={setMiHorario} docsHorario={docsHorario} setDocsHorario={setDocsHorario} cargandoHorario={cargandoHorario} setCargandoHorario={setCargandoHorario} />}
          {vista === 'asistencia' && <VistaAsistencia />}
          {vista === 'calendario' && <CalendarioAcademico puedeEditar={false} seccionId={perfil.matriculas[0]?.seccion?.id} />}
          {vista === 'anecdotas' && <VistaAnecdotas p={perfil} />}
          {vista === 'boletin' && <VistaBoletin p={perfil} />}
          {vista === 'fct' && <VistaFCT p={perfil} />}
        </motion.div>
      </main>
    </div>
  );
}
