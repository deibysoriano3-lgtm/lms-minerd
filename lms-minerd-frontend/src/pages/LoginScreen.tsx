import { useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, Building, AlertCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
    onLoginExitoso: (rol: 'ADMIN' | 'DOCENTE' | 'TUTOR_FCT' | 'ESTUDIANTE', nombre: string) => void;
}

export default function LoginScreen({ onLoginExitoso }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            // data.user contiene { email, sub, rol, nombre }
            // data.access_token contiene el JWT
            localStorage.setItem('lms_minerd_token', data.access_token);
            onLoginExitoso(data.user.rol as any, data.user.nombre);

        } catch (err: any) {
            setError(err.message || 'Error de conexión con el Servidor MINERD.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">

            {/* Elementos de Diseño de Fondo */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="mx-auto w-16 h-16 bg-[#0b3b60] rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-xl font-black text-rose-800 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Rosario Rojas de Contreras
                </h1>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    Sistema Integrado de Gestión Técnico Profesional
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px] relative z-10"
            >
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">

                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                            <p className="text-sm font-medium text-rose-700">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                                Correo Institucional
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b3b60] focus:border-[#0b3b60] sm:text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                                    placeholder="ejemplo@minerd.gob.do"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b3b60] focus:border-[#0b3b60] sm:text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-[#0b3b60] focus:ring-[#0b3b60] border-slate-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium">
                                    Recordar credenciales
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-bold text-[#0b3b60] hover:text-blue-800 transition">
                                    ¿Olvidaste tu clave?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#0b3b60] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b3b60] transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Autenticando...
                                    </span>
                                ) : (
                                    <span className="relative z-10">Ingresar al Sistema Oficial</span>
                                )}
                                <div className="absolute inset-0 h-full w-full scale-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10 z-0"></div>
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500 font-medium">¿Eres Tutor del Sector Empresarial?</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setEmail('fct@empresa.com');
                                    setPassword('1234');
                                }}
                                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                                <Building className="w-4 h-4 mr-2 text-slate-500" />
                                Entrar a Portal FCT (Prueba)
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 text-center text-xs text-slate-500 font-medium relative z-10 w-full px-4"
            >
                <div className="absolute bottom-8 text-center w-full text-slate-400 text-xs font-medium px-4">
                    <p>Distrito Educativo 17-02 Monte Plata © {new Date().getFullYear()}</p>
                    <p className="mt-1 opacity-75">Sistema ERP Escolar exclusivo del Politécnico Prof. Rosario Rojas de Contreras</p>
                </div>    <div className="mt-2 flex justify-center gap-4">
                    <button onClick={() => { setEmail('admin@minerd.gob.do'); setPassword('123456'); }} className="hover:text-amber-600 transition underline underline-offset-2 text-[11px]">Probar Admin</button>
                    <button onClick={() => { setEmail('docente@minerd.gob.do'); setPassword('123456'); }} className="hover:text-blue-600 transition underline underline-offset-2 text-[11px]">Probar Docente</button>
                    <button onClick={() => { setEmail('estudiante@minerd.gob.do'); setPassword('123456'); }} className="hover:text-green-600 transition underline underline-offset-2 text-[11px]">Probar Estudiante</button>
                </div>
            </motion.div>
        </div>
    );
}
