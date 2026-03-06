import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, Building2, Clock, Users, BookMarked, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeacherGradingDashboard from './pages/TeacherGradingDashboard';
import TutorEmpresarialPortal from './pages/TutorEmpresarialPortal';
import AdminStudentsDashboard from './pages/AdminStudentsDashboard';
import AdminAcademicDashboard from './pages/AdminAcademicDashboard';
import AdminCurriculumDashboard from './pages/AdminCurriculumDashboard';
import AdminEnrollmentDashboard from './pages/AdminEnrollmentDashboard';
import AdminReportsDashboard from './pages/AdminReportsDashboard';
import BoletinCalificaciones from './pages/BoletinCalificaciones';
import StudentPortal from './pages/StudentPortal';
import LoginScreen from './pages/LoginScreen';
import Navbar from './components/Navbar';
import AnimatedPage from './components/AnimatedPage';

const API = 'http://localhost:3000';

// ── Barra de estadísticas institucionales (solo Admin) ────────
function AdminStatsBar() {
  const [stats, setStats] = useState({ estudiantes: 0, docentes: 0, periodo: '—', secciones: 0 });

  useEffect(() => {
    const token = localStorage.getItem('lms_minerd_token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/estudiantes`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/docentes`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/matricula/periodos`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/matricula/secciones`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([est, doc, periodos, sec]) => {
      const pa = (Array.isArray(periodos) ? periodos : []).find((p: any) => p.es_activo);
      setStats({
        estudiantes: Array.isArray(est) ? est.filter((e: any) => e.estado_academico === 'ACTIVO').length : 0,
        docentes: Array.isArray(doc) ? doc.filter((d: any) => d.estado_laboral === 'ACTIVO').length : 0,
        periodo: pa?.nombre ?? 'Sin período activo',
        secciones: Array.isArray(sec) ? sec.length : 0,
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {[
        { label: 'Estudiantes Activos', value: stats.estudiantes, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
        { label: 'Docentes Activos', value: stats.docentes, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
        { label: 'Período Académico', value: stats.periodo, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100', isText: true },
        { label: 'Secciones', value: stats.secciones, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
      ].map(s => (
        <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
          <p className={`font-black ${s.isText ? 'text-sm leading-tight' : 'text-2xl'} ${s.color}`}>{s.value}</p>
          <p className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.3 } }
};

const ADMIN_PORTALS = [
  {
    to: '/admin/estudiantes',
    color: 'from-indigo-500 to-indigo-600',
    hoverRing: 'hover:ring-indigo-300',
    icon: Users,
    label: 'Gestión de Estudiantes',
    desc: 'Expedientes, estados académicos, matrículas y registro anecdótico.',
    badge: 'ERP Central',
  },
  {
    to: '/admin/academico',
    color: 'from-violet-500 to-violet-600',
    hoverRing: 'hover:ring-violet-300',
    icon: GraduationCap,
    label: 'Dirección Académica',
    desc: 'Oferta formativa, plantilla docente y cargas académicas.',
    badge: 'Staff & Carreras',
  },
  {
    to: '/admin/curriculo',
    color: 'from-blue-500 to-blue-600',
    hoverRing: 'hover:ring-blue-300',
    icon: BookMarked,
    label: 'Plan Curricular',
    desc: 'Constructor de RAs y validación de módulos según Ordenanza 03-2017.',
    badge: 'MINERD',
  },
  {
    to: '/admin/matricula',
    color: 'from-teal-500 to-teal-600',
    hoverRing: 'hover:ring-teal-300',
    icon: Clock,
    label: 'Períodos y Matrícula',
    desc: 'Años escolares, secciones, inscripción y cupos disponibles.',
    badge: 'Inscripciones',
  },
  {
    to: '/admin/reportes',
    color: 'from-rose-500 to-rose-600',
    hoverRing: 'hover:ring-rose-300',
    icon: BarChart3,
    label: 'Reportes Oficiales',
    desc: 'Sábanas de calificaciones, boletines y actas para el Distrito 17-02.',
    badge: 'Actas Oficiales',
  },
];

function Home({ userRole, userName }: { userRole: string | null; userName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = userName.split(' ')[0];

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      {/* Encabezado personal */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm mb-1">{greeting},</p>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{firstName} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {userRole === 'ADMIN' && 'Panel de administración del Politécnico Prof. Rosario Rojas de Contreras'}
          {userRole === 'DOCENTE' && 'Portal de evaluación docente — Registro de calificaciones por RAs'}
          {userRole === 'TUTOR_FCT' && 'Portal de seguimiento de Formación en Centros de Trabajo (FCT)'}
          {userRole === 'ESTUDIANTE' && 'Bienvenido a tu portal estudiantil — consulta calificaciones, boletín y más'}
        </p>
      </div>

      {/* Estadísticas institucionales en tiempo real (solo Admin) */}
      {userRole === 'ADMIN' && <AdminStatsBar />}

      {/* Tarjetas por ROL */}
      {userRole === 'ADMIN' && (
        <motion.div variants={container} initial="hidden" animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADMIN_PORTALS.map(p => {
            const Icon = p.icon;
            return (
              <motion.div key={p.to} variants={item}>
                <Link to={p.to}
                  className={`group flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-xl hover:ring-2 ${p.hoverRing} transition-all duration-300 ring-offset-2`}>
                  <div className={`bg-gradient-to-br ${p.color} p-5 text-white flex items-start justify-between`}>
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full uppercase">{p.badge}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors mb-1">{p.label}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed flex-1">{p.desc}</p>
                    <div className="mt-4 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Ir al módulo →
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {userRole === 'DOCENTE' && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5">
          <motion.div variants={item}>
            <Link to="/docente"
              className="group flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:ring-2 hover:ring-blue-300 transition-all duration-300 ring-offset-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">Portal Docente</span>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">Registro de Calificaciones</h2>
                <p className="text-sm text-slate-500 mt-1">Carga tus notas por Resultado de Aprendizaje (RA) para cada módulo y sección asignada.</p>
              </div>
              <div className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform shrink-0">Acceder →</div>
            </Link>
          </motion.div>
        </motion.div>
      )}

      {userRole === 'TUTOR_FCT' && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5">
          <motion.div variants={item}>
            <Link to="/empresa"
              className="group flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:ring-2 hover:ring-emerald-300 transition-all duration-300 ring-offset-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">Portal FCT</span>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">Evaluación de Pasantías</h2>
                <p className="text-sm text-slate-500 mt-1">Valida horas laborales y califica el desempeño de los estudiantes en tu empresa.</p>
              </div>
              <div className="text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0">Acceder →</div>
            </Link>
          </motion.div>
        </motion.div>
      )}

      {userRole === 'ESTUDIANTE' && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5">
          <motion.div variants={item}>
            <Link to="/estudiante"
              className="group flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:ring-2 hover:ring-cyan-300 transition-all duration-300 ring-offset-2">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-cyan-500 uppercase">Portal Estudiantil</span>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">Mi Expediente Académico</h2>
                <p className="text-sm text-slate-500 mt-1">Consulta tus calificaciones por módulo y RA, asignaturas, boletín oficial y anotaciones.</p>
              </div>
              <div className="text-xs font-semibold text-cyan-600 group-hover:translate-x-1 transition-transform shrink-0">Acceder →</div>
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* Footer info */}
      <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>📍 Distrito Educativo 17-02 · Monte Plata</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Sistema activo · Año Escolar 2025-2026
        </span>
        <span className="ml-auto">© {new Date().getFullYear()} Politécnico P.R.R.C.</span>
      </div>
    </div>
  );
}

function AnimatedRoutes({ userRole, userName }: { userRole: 'ADMIN' | 'DOCENTE' | 'TUTOR_FCT' | 'ESTUDIANTE' | null; userName: string }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home userRole={userRole} userName={userName} /></AnimatedPage>} />

        {/* Rutas de Docente */}
        {userRole === 'DOCENTE' && (
          <Route path="/docente" element={<AnimatedPage><TeacherGradingDashboard /></AnimatedPage>} />
        )}

        {/* Rutas de Empresa (FCT) */}
        {userRole === 'TUTOR_FCT' && (
          <Route path="/empresa" element={<AnimatedPage><TutorEmpresarialPortal /></AnimatedPage>} />
        )}

        {/* Rutas de Estudiante */}
        {userRole === 'ESTUDIANTE' && (
          <Route path="/estudiante" element={<AnimatedPage><StudentPortal /></AnimatedPage>} />
        )}

        {/* Rutas de Administrador ERP */}
        {userRole === 'ADMIN' && (
          <>
            <Route path="/admin/estudiantes" element={<AnimatedPage><AdminStudentsDashboard /></AnimatedPage>} />
            <Route path="/admin/academico" element={<AnimatedPage><AdminAcademicDashboard /></AnimatedPage>} />
            <Route path="/admin/curriculo" element={<AnimatedPage><AdminCurriculumDashboard /></AnimatedPage>} />
            <Route path="/admin/matricula" element={<AnimatedPage><AdminEnrollmentDashboard /></AnimatedPage>} />
            <Route path="/admin/reportes" element={<AnimatedPage><AdminReportsDashboard /></AnimatedPage>} />
          </>
        )}

        {/* Redirección Segura por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'DOCENTE' | 'TUTOR_FCT' | 'ESTUDIANTE' | null>(null);
  const [userName, setUserName] = useState('');

  const handleLogin = (rol: 'ADMIN' | 'DOCENTE' | 'TUTOR_FCT' | 'ESTUDIANTE', nombre: string) => {
    setUserRole(rol);
    setUserName(nombre);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <LoginScreen key="login" onLoginExitoso={handleLogin} />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-slate-50 flex flex-col"
        >
          <Navbar userRole={userRole} userName={userName} onLogout={handleLogout} />
          <main className="flex-1">
            <AnimatedRoutes userRole={userRole} userName={userName} />
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública del boletín (imprimible, sin navbar) */}
        <Route path="/boletin/:id" element={<BoletinCalificaciones />} />
        {/* Resto de la aplicación autenticada */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
