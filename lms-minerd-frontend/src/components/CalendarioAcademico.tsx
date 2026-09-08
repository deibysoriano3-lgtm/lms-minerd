import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, X, Save, Trash2, Calendar
} from 'lucide-react';
import api from '../api';

const TIPOS = [
    { value: 'EXAMEN',      label: 'Examen',        color: 'rose' },
    { value: 'ENTREGA',     label: 'Entrega',        color: 'amber' },
    { value: 'ACTIVIDAD',   label: 'Actividad',      color: 'emerald' },
    { value: 'FERIADO',     label: 'Feriado',        color: 'slate' },
    { value: 'REUNION',     label: 'Reunión',        color: 'violet' },
    { value: 'EVENTO',      label: 'Evento',         color: 'indigo' },
];

const TIPO_STYLE: Record<string, string> = {
    EXAMEN:    'bg-rose-100 text-rose-700 border-rose-200',
    ENTREGA:   'bg-amber-100 text-amber-700 border-amber-200',
    ACTIVIDAD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FERIADO:   'bg-slate-100 text-slate-600 border-slate-200',
    REUNION:   'bg-violet-100 text-violet-700 border-violet-200',
    EVENTO:    'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const TIPO_DOT: Record<string, string> = {
    EXAMEN:    'bg-rose-500',
    ENTREGA:   'bg-amber-500',
    ACTIVIDAD: 'bg-emerald-500',
    FERIADO:   'bg-slate-400',
    REUNION:   'bg-violet-500',
    EVENTO:    'bg-indigo-500',
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

interface Evento {
    id: number;
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    tipo: string;
    color: string;
    es_global: boolean;
}

interface Props {
    puedeEditar?: boolean;
    seccionId?: number;
}

export default function CalendarioAcademico({ puedeEditar = false, seccionId }: Props) {
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth() + 1);
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [cargando, setCargando] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
    const [modal, setModal] = useState<{ tipo: 'crear' | 'ver'; evento?: Evento; fecha?: string } | null>(null);
    const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'EVENTO', fecha_inicio: '', fecha_fin: '', es_global: true });
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams({ mes: String(mes), anio: String(anio) });
            if (seccionId) params.append('seccion_id', String(seccionId));
            const res = await api.get(`/api/calendario/eventos?${params}`);
            setEventos(res.data);
        } catch { } finally { setCargando(false); }
    }, [mes, anio, seccionId]);

    useEffect(() => { cargar(); }, [cargar]);

    const prevMes = () => { if (mes === 1) { setMes(12); setAnio(a => a - 1); } else setMes(m => m - 1); };
    const nextMes = () => { if (mes === 12) { setMes(1); setAnio(a => a + 1); } else setMes(m => m + 1); };

    // Construir grid del mes
    const primerDia = new Date(anio, mes - 1, 1);
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const offsetInicio = (primerDia.getDay() + 6) % 7; // lunes = 0

    const eventosPorDia = (dia: number) => {
        const fecha = `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        return eventos.filter(e => e.fecha_inicio.startsWith(fecha));
    };

    const abrirCrear = (dia: number) => {
        if (!puedeEditar) return;
        const fecha = `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        setForm({ titulo: '', descripcion: '', tipo: 'EVENTO', fecha_inicio: fecha, fecha_fin: '', es_global: true });
        setModal({ tipo: 'crear', fecha });
    };

    const handleCrear = async () => {
        if (!form.titulo.trim()) return;
        setGuardando(true);
        try {
            await api.post('/api/calendario/eventos', form);
            await cargar();
            setModal(null);
            showToast('Evento creado', true);
        } catch { showToast('Error al crear evento', false); }
        finally { setGuardando(false); }
    };

    const handleEliminar = async (id: number) => {
        try {
            await api.delete(`/api/calendario/eventos/${id}`);
            await cargar();
            setModal(null);
            showToast('Evento eliminado', true);
        } catch { showToast('Error al eliminar', false); }
    };

    const eventosDelDiaSeleccionado = diaSeleccionado ? eventosPorDia(diaSeleccionado) : [];

    return (
        <div className="space-y-4">
            {/* Header del mes */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={prevMes} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 min-w-[160px] text-center">
                        {MESES[mes - 1]} {anio}
                    </h2>
                    <button onClick={nextMes} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {cargando && <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
                    {puedeEditar && (
                        <button
                            onClick={() => abrirCrear(hoy.getDate())}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Nuevo evento
                        </button>
                    )}
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-2">
                {TIPOS.map(t => (
                    <span key={t.value} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TIPO_STYLE[t.value]}`}>
                        {t.label}
                    </span>
                ))}
            </div>

            {/* Grid del calendario */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Cabecera días */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                    {DIAS_SEMANA.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
                    ))}
                </div>
                {/* Días */}
                <div className="grid grid-cols-7">
                    {Array.from({ length: offsetInicio }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-slate-100 bg-slate-50/50" />
                    ))}
                    {Array.from({ length: diasEnMes }).map((_, i) => {
                        const dia = i + 1;
                        const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();
                        const evsDia = eventosPorDia(dia);
                        const seleccionado = diaSeleccionado === dia;
                        return (
                            <div
                                key={dia}
                                onClick={() => { setDiaSeleccionado(seleccionado ? null : dia); }}
                                className={`min-h-[80px] p-1.5 border-r border-b border-slate-100 cursor-pointer transition-colors
                                    ${seleccionado ? 'bg-indigo-50' : 'hover:bg-slate-50'}
                                    ${puedeEditar ? 'group' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                                        ${esHoy ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                                        {dia}
                                    </span>
                                    {puedeEditar && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); abrirCrear(dia); }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-indigo-100 rounded transition-all"
                                        >
                                            <Plus className="w-3 h-3 text-indigo-500" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    {evsDia.slice(0, 2).map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => { e.stopPropagation(); setModal({ tipo: 'ver', evento: ev }); }}
                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border cursor-pointer hover:opacity-80 ${TIPO_STYLE[ev.tipo]}`}
                                        >
                                            {ev.titulo}
                                        </div>
                                    ))}
                                    {evsDia.length > 2 && (
                                        <div className="text-[10px] text-slate-400 px-1">+{evsDia.length - 2} más</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Panel lateral: eventos del día seleccionado */}
            {diaSeleccionado && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-sm">
                            {diaSeleccionado} de {MESES[mes - 1]}
                        </h3>
                        {puedeEditar && (
                            <button
                                onClick={() => abrirCrear(diaSeleccionado)}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                                <Plus className="w-3.5 h-3.5" /> Agregar
                            </button>
                        )}
                    </div>
                    {eventosDelDiaSeleccionado.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Sin eventos este día.</p>
                    ) : (
                        <div className="space-y-2">
                            {eventosDelDiaSeleccionado.map(ev => (
                                <div
                                    key={ev.id}
                                    onClick={() => setModal({ tipo: 'ver', evento: ev })}
                                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer hover:opacity-80 ${TIPO_STYLE[ev.tipo]}`}
                                >
                                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${TIPO_DOT[ev.tipo]}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{ev.titulo}</p>
                                        {ev.descripcion && <p className="text-xs opacity-70 truncate">{ev.descripcion}</p>}
                                        <p className="text-xs opacity-60 mt-0.5">{TIPOS.find(t => t.value === ev.tipo)?.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal crear */}
            {modal?.tipo === 'crear' && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Nuevo Evento</h3>
                            <button onClick={() => setModal(null)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Título *</label>
                                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="Ej: Examen Parcial RA1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Descripción</label>
                                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                    rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    placeholder="Detalles opcionales..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Tipo</label>
                                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Fecha inicio</label>
                                    <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Fecha fin (opcional)</label>
                                <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.es_global} onChange={e => setForm(f => ({ ...f, es_global: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600" />
                                <span className="text-sm text-slate-600">Visible para todos (evento institucional)</span>
                            </label>
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-3">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Cancelar</button>
                            <button onClick={handleCrear} disabled={guardando || !form.titulo.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ver evento */}
            {modal?.tipo === 'ver' && modal.evento && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className={`px-6 py-4 rounded-t-2xl border-b ${TIPO_STYLE[modal.evento.tipo]}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold opacity-70">{TIPOS.find(t => t.value === modal.evento!.tipo)?.label}</span>
                                    <h3 className="font-bold text-base mt-0.5">{modal.evento.titulo}</h3>
                                </div>
                                <button onClick={() => setModal(null)}><X className="w-5 h-5 opacity-60 hover:opacity-100" /></button>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {new Date(modal.evento.fecha_inicio).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                {modal.evento.fecha_fin && ` — ${new Date(modal.evento.fecha_fin).toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })}`}
                            </div>
                            {modal.evento.descripcion && (
                                <p className="text-sm text-slate-600">{modal.evento.descripcion}</p>
                            )}
                            <p className="text-xs text-slate-400">{modal.evento.es_global ? 'Evento institucional' : 'Evento de sección'}</p>
                        </div>
                        {puedeEditar && (
                            <div className="px-6 pb-6 flex justify-end">
                                <button onClick={() => handleEliminar(modal.evento!.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Eliminar evento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white
                    ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
