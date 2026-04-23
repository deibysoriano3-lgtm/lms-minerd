import { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, ClipboardList, FileText, Award,
  CheckCircle, XCircle, AlertCircle, User, Calendar, ChevronDown,
  ChevronRight, Briefcase, Star, BookMarked, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:3000';

type Vista = 'dashboard' | 'calificaciones' | 'asignaturas' | 'anecdotas' | 'boletin' | 'fct';

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
    seccion: { nombre: string; grado: string };
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

/* ─── COMPONENTE PRINCIPAL ─── */
export default function StudentPortal() {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('lms_minerd_token');
    fetch(`${API}/api/estudiantes/mi-perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) throw new Error('No autorizado');
        return r.json();
      })
      .then(data => { setPerfil(data); setCargando(false); })
      .catch(e => { setError(e.message || 'Error de conexión'); setCargando(false); });
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
    { id: 'anecdotas', icon: ClipboardList, label: 'Anotaciones' },
    { id: 'boletin', icon: FileText, label: 'Mi Boletín' },
    ...(tieneFCT ? [{ id: 'fct' as Vista, icon: Briefcase, label: 'FCT / Pasantía' }] : []),
  ];

  const titulo: Record<Vista, string> = {
    dashboard: 'Mi Perfil',
    calificaciones: 'Módulos y Resultados de Aprendizaje',
    asignaturas: 'Asignaturas Académicas',
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
          {vista === 'anecdotas' && <VistaAnecdotas p={perfil} />}
          {vista === 'boletin' && <VistaBoletin p={perfil} />}
          {vista === 'fct' && <VistaFCT p={perfil} />}
        </motion.div>
      </main>
    </div>
  );
}
