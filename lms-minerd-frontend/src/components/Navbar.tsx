import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Users, BookOpen, Bookmark, FolderClock,
    Printer, LogOut, ChevronDown, GraduationCap, Building2,
    Bell, Menu, X
} from 'lucide-react';

interface NavbarProps {
    userRole: 'ADMIN' | 'DOCENTE' | 'TUTOR_FCT' | 'ESTUDIANTE' | null;
    userName: string;
    onLogout: () => void;
}

const ROLE_COLOR: Record<string, string> = {
    ADMIN: 'bg-violet-600',
    DOCENTE: 'bg-blue-600',
    TUTOR_FCT: 'bg-emerald-600',
    ESTUDIANTE: 'bg-amber-600',
};

const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Administrador',
    DOCENTE: 'Docente',
    TUTOR_FCT: 'Tutor FCT',
    ESTUDIANTE: 'Estudiante',
};

function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const ALL_LINKS = [
    { path: '/', label: 'Inicio', icon: Home, roles: ['ADMIN', 'DOCENTE', 'TUTOR_FCT', 'ESTUDIANTE'] },
    { path: '/admin/estudiantes', label: 'Estudiantes', icon: Users, roles: ['ADMIN'] },
    { path: '/admin/matricula', label: 'Matrícula', icon: FolderClock, roles: ['ADMIN'] },
    { path: '/admin/academico', label: 'Dir. Académica', icon: GraduationCap, roles: ['ADMIN'] },
    { path: '/admin/curriculo', label: 'Currículo', icon: Bookmark, roles: ['ADMIN'] },
    { path: '/admin/reportes', label: 'Reportes', icon: Printer, roles: ['ADMIN'] },
    { path: '/docente', label: 'Portal Docente', icon: BookOpen, roles: ['DOCENTE'] },
    { path: '/empresa', label: 'Portal FCT', icon: Building2, roles: ['TUTOR_FCT'] },
    { path: '/estudiante', label: 'Mi Expediente', icon: GraduationCap, roles: ['ESTUDIANTE'] },
];

export default function Navbar({ userRole, userName, onLogout }: NavbarProps) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = ALL_LINKS.filter(l => userRole && l.roles.includes(userRole));
    const avatarBg = userRole ? ROLE_COLOR[userRole] : 'bg-slate-600';
    const roleLabel = userRole ? ROLE_LABEL[userRole] : '';

    const NavLink = ({ path, label, icon: Icon }: typeof ALL_LINKS[0]) => {
        const active = location.pathname === path;
        return (
            <Link
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}
            >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
                {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-white/70 rounded-full" />
                )}
            </Link>
        );
    };

    return (
        <>
            <nav className="bg-gradient-to-r from-[#0b2d4e] to-[#0d3f69] text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-screen-2xl mx-auto px-4">
                    <div className="flex items-center h-14 gap-2">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <BookOpen className="w-5 h-5 text-[#0b2d4e]" />
                            </div>
                            <div className="hidden md:block leading-none">
                                <span className="text-sm font-bold tracking-wide text-white block">P.R.R.C.</span>
                                <span className="text-[9px] text-blue-200 block tracking-widest uppercase">Politécnico</span>
                            </div>
                        </Link>

                        <div className="h-5 w-px bg-white/20 mx-1 shrink-0" />

                        {/* Nav links – desktop */}
                        <div className="flex-1 hidden sm:flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                            {links.map(l => <NavLink key={l.path} {...l} />)}
                        </div>

                        {/* Right side */}
                        <div className="ml-auto flex items-center gap-2">
                            {/* Campana placeholder */}
                            <button className="relative p-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition">
                                <Bell className="w-4 h-4" />
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full" />
                            </button>

                            {/* Avatar + dropdown */}
                            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                                <div className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0`}>
                                    {initials(userName || 'U')}
                                </div>
                                <div className="hidden md:block text-right leading-none">
                                    <p className="text-xs font-bold text-white truncate max-w-[120px]">{userName}</p>
                                    <p className="text-[9px] text-blue-200 uppercase tracking-wider">{roleLabel}</p>
                                </div>
                                <ChevronDown className="w-3 h-3 text-blue-300 hidden md:block" />
                            </div>

                            <button
                                onClick={onLogout}
                                title="Cerrar sesión"
                                className="p-2 rounded-lg text-blue-200 hover:bg-rose-600/80 hover:text-white transition"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>

                            {/* Hamburger – mobile */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="sm:hidden p-2 rounded-lg text-blue-200 hover:bg-white/10 transition"
                            >
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile menu — muestra ícono + etiqueta completa */}
            {mobileOpen && (
                <div className="sm:hidden bg-[#0b2d4e] border-b border-white/10 px-4 py-3 flex flex-col gap-0.5 z-40">
                    {links.map(({ path, label, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${active ? 'bg-white/15 text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}
