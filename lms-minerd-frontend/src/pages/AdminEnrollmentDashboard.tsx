import { useState, useEffect } from 'react';
import { Calendar, Users, Archive, CheckCircle, Search, UserPlus, Database, ArrowRightCircle, Download } from 'lucide-react';

interface Periodo {
    id: number;
    nombre: string;
    estado: 'ACTIVO' | 'PLANIFICACION' | 'CERRADO';
    matricula: number;
    fecha_fin: string;
}

interface Seccion {
    id: number;
    nombre: string; // ej: 6to A
    carrera: string;
    inscritos: number;
    cupo_max: number;
}

export default function AdminEnrollmentDashboard() {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [seccionesActivas, setSeccionesActivas] = useState<Seccion[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [vista, setVista] = useState<'periodos' | 'matriculacion'>('periodos');

    // Funciones Fetch para conectar a NestJS
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('lms_minerd_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Traer Periodos
                const resP = await fetch('http://localhost:3000/api/matricula/periodos', { headers });
                const dataP = await resP.json();
                setPeriodos(dataP.map((p: any) => ({
                    id: p.id,
                    nombre: p.nombre,
                    estado: p.es_activo ? 'ACTIVO' : 'CERRADO',
                    matricula: 450, // Podría contarse sumando matrículas de este periodo luego
                    fecha_fin: new Date(p.fecha_fin).toLocaleDateString()
                })));

                // Traer Secciones Reales
                const resS = await fetch('http://localhost:3000/api/matricula/secciones', { headers });
                const dataS = await resS.json();
                setSeccionesActivas(dataS.map((s: any) => ({
                    id: s.id,
                    nombre: s.nombre,
                    carrera: s.carrera.nombre,
                    inscritos: s._count.matriculas,
                    cupo_max: 35
                })));

            } catch (error) {
                console.error("Error conectando con API:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // --- LÓGICA DE INSCRIPCIÓN VIVA ---
    const [busquedaRNE, setBusquedaRNE] = useState('M-LOP-09-02-0001');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInscribir = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            const res = await fetch('http://localhost:3000/api/matricula/inscribir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Hardcodeando IDs de prueba basándonos en el Seed (Estudiante 1, Seccion 1, Periodo 1)
                body: JSON.stringify({
                    estudiante_id: 1,
                    periodo_id: periodos[0]?.id || 1,
                    seccion_id: seccionesActivas[0]?.id || 1
                })
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message);

            alert("¡Matriculación oficial en MINERD confirmada con éxito!");
            window.location.reload();

        } catch (error: any) {
            alert('Fallo de Matrícula: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- LÓGICA DE DESCARGA DE SÁBANAS ---
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDescargarSabana = async (seccionId: number, nombreSeccion: string) => {
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('lms_minerd_token');
            const res = await fetch(`http://localhost:3000/api/reportes/sabana-excel/${seccionId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al generar la sábana en el servidor');
            }

            // Convertir la respuesta a Blob y forzar la descarga en el navegador
            const blob = await res.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `Sabana_Calificaciones_${nombreSeccion.replace(' ', '_')}.xlsx`);
            document.body.appendChild(a);
            a.click();

            // Limpieza
            a.parentNode?.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error: any) {
            alert('Fallo de Exportación: ' + error.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const getEstadoPeriodo = (estado: string) => {
        switch (estado) {
            case 'ACTIVO': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">AÑO EN CURSO</span>;
            case 'PLANIFICACION': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">PRE-MATRÍCULA</span>;
            case 'CERRADO': return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-300">HISTÓRICO</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Gestión de Matrícula</span>
                            {isLoadingData ?
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">Sincronizando...</span> :
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">Conectado a NestJS ✅</span>
                            }
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Periodos y Matrícula</h1>
                        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                            Administra los años lectivos, apertura de secciones e inscripción de estudiantes por Familias Profesionales.
                        </p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-1 inline-flex flex-wrap gap-1">
                    <button
                        onClick={() => setVista('periodos')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vista === 'periodos' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calendar className="w-4 h-4" /> Años Escolares Reales
                    </button>
                    <button
                        onClick={() => setVista('matriculacion')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${vista === 'matriculacion' ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Users className="w-4 h-4" /> Inscribir (API REST)
                    </button>
                </div>

                {vista === 'periodos' ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Ciclos Administrados en Base de Datos</h2>
                            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm">
                                <Calendar className="w-4 h-4" /> Aperturar Nuevo Año Escolar
                            </button>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-6">
                            {periodos.map(p => (
                                <div key={p.id} className={`bg-white rounded-xl border-2 p-6 transition-all relative overflow-hidden ${p.estado === 'ACTIVO' ? 'border-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'}`}>
                                    {p.estado === 'ACTIVO' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            {p.estado === 'CERRADO' ? <Archive className="w-6 h-6 text-slate-400" /> : <Database className="w-6 h-6 text-indigo-600" />}
                                        </div>
                                        {getEstadoPeriodo(p.estado)}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{p.nombre}</h3>
                                    <p className="text-sm text-slate-500 mb-6 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-slate-400" /> API Sincronizada</p>

                                    <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center border border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Cierre Oficial MINERD</p>
                                            <p className="text-sm font-bold text-slate-700">{p.fecha_fin}</p>
                                        </div>
                                        <button className={`text-sm font-bold flex items-center gap-1 ${p.estado === 'ACTIVO' ? 'text-rose-600 hover:text-rose-700' : 'text-indigo-600 hover:text-indigo-700'}`}>
                                            Acciones <ArrowRightCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 w-full">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Inscripción a Base de Datos Central</h3>
                                <p className="text-sm text-slate-500">El número RNE de María López (M-LOP-09-02-0001) conectará su registro con el Año Escolar actual en NestJS.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                    <input type="text" value={busquedaRNE} onChange={e => setBusquedaRNE(e.target.value)} placeholder="Buscar RNE o Nombre..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-rose-500 font-bold" />
                                </div>
                                <button onClick={handleInscribir} disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50">
                                    {isSubmitting ? 'Inscribiendo...' : <><UserPlus className="w-4 h-4" /> Matricular (POST)</>}
                                </button>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8">Panorama de Secciones Activas</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seccionesActivas.map(sec => {
                                const porcentaje = (sec.inscritos / sec.cupo_max) * 100;
                                const isFull = porcentaje >= 100;

                                return (
                                    <div key={sec.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden text-sm relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-black text-slate-800">{sec.nombre}</h3>
                                            {isFull ? (
                                                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">LLENA</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">DISPONIBLE</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium mb-4">{sec.carrera}</p>

                                        <div className="mb-2 flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Inscritos Formof (SQLite)</span>
                                            <span className={isFull ? 'text-rose-600' : 'text-slate-700'}>{sec.inscritos} de {sec.cupo_max} Alu.</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                                            <div className={`h-full ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${porcentaje}%` }}></div>
                                        </div>

                                        <button
                                            onClick={() => handleDescargarSabana(sec.id, sec.nombre)}
                                            disabled={isDownloading || sec.inscritos === 0}
                                            className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Download className="w-4 h-4" />
                                            {isDownloading ? 'Generando...' : 'Descargar Sábana (.xlsx)'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
