import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AsistenciaService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    private async getDocenteId(usuario_id: number) {
        const d = await this.prisma.docentePerfil.findUnique({ where: { usuario_id } });
        if (!d) throw new NotFoundException('Perfil de docente no encontrado');
        return d.id;
    }

    async registrar(usuario_id: number, body: { seccion_id: number; fecha: string; registros: { estudiante_id: number; estado: string; observacion?: string }[] }) {
        const docente_id = await this.getDocenteId(usuario_id);
        const fecha = new Date(body.fecha);
        fecha.setHours(0, 0, 0, 0);

        const ops = body.registros.map(r =>
            this.db.registroAsistencia.upsert({
                where: { estudiante_id_seccion_id_fecha: { estudiante_id: r.estudiante_id, seccion_id: body.seccion_id, fecha } },
                update: { estado: r.estado, observacion: r.observacion ?? null, docente_id },
                create: { estudiante_id: r.estudiante_id, seccion_id: body.seccion_id, fecha, estado: r.estado, observacion: r.observacion ?? null, docente_id },
            })
        );
        return this.prisma.$transaction(ops);
    }

    async getPorSeccionFecha(seccion_id: number, fecha: string) {
        const d = new Date(fecha);
        d.setHours(0, 0, 0, 0);
        const fin = new Date(d);
        fin.setHours(23, 59, 59, 999);

        return this.db.registroAsistencia.findMany({
            where: { seccion_id, fecha: { gte: d, lte: fin } },
            include: { estudiante: { include: { usuario: { select: { nombre_completo: true } } } } },
            orderBy: { estudiante: { usuario: { nombre_completo: 'asc' } } },
        });
    }

    async getHistorialEstudiante(estudiante_id: number) {
        return this.db.registroAsistencia.findMany({
            where: { estudiante_id },
            orderBy: { fecha: 'desc' },
            include: { seccion: { select: { nombre: true, carrera: { select: { nombre: true } } } } },
        });
    }

    async getResumenSeccion(seccion_id: number) {
        const registros = await this.db.registroAsistencia.findMany({
            where: { seccion_id },
            include: { estudiante: { include: { usuario: { select: { nombre_completo: true } } } } },
        });

        const por_est: Record<number, { nombre: string; total: number; ausencias: number; tardanzas: number }> = {};
        for (const r of registros) {
            if (!por_est[r.estudiante_id]) {
                por_est[r.estudiante_id] = { nombre: r.estudiante.usuario.nombre_completo, total: 0, ausencias: 0, tardanzas: 0 };
            }
            por_est[r.estudiante_id].total++;
            if (r.estado === 'AUSENTE') por_est[r.estudiante_id].ausencias++;
            if (r.estado === 'TARDANZA') por_est[r.estudiante_id].tardanzas++;
        }

        return Object.entries(por_est).map(([id, v]) => ({
            estudiante_id: Number(id),
            nombre: v.nombre,
            total_dias: v.total,
            ausencias: v.ausencias,
            tardanzas: v.tardanzas,
            pct_asistencia: v.total > 0 ? Math.round(((v.total - v.ausencias) / v.total) * 100) : 100,
        }));
    }

    async getEstudiantesEnRiesgo() {
        const secciones = await this.prisma.seccion.findMany({ select: { id: true } });
        const riesgo: any[] = [];

        for (const sec of secciones) {
            const resumen = await this.getResumenSeccion(sec.id);
            for (const r of resumen) {
                if (r.ausencias >= 3 || r.pct_asistencia < 80) {
                    const anecdotas_neg = await this.prisma.registroAnecdotico.count({
                        where: { estudiante_id: r.estudiante_id, tipo: { in: ['NEGATIVO', 'CONDUCTUAL'] } },
                    });
                    riesgo.push({ ...r, anecdotas_negativas: anecdotas_neg, seccion_id: sec.id });
                }
            }
        }

        const visto = new Set<number>();
        return riesgo
            .filter(r => { if (visto.has(r.estudiante_id)) return false; visto.add(r.estudiante_id); return true; })
            .sort((a, b) => a.pct_asistencia - b.pct_asistencia);
    }

    async getMiAsistencia(usuario_id: number) {
        const perfil = await this.prisma.estudiantePerfil.findUnique({ where: { usuario_id } });
        if (!perfil) return { resumen: [], historial: [] };

        const registros = await this.db.registroAsistencia.findMany({
            where: { estudiante_id: perfil.id },
            orderBy: { fecha: 'desc' },
            include: {
                seccion: {
                    select: {
                        nombre: true,
                        carrera: { select: { nombre: true } },
                    },
                },
            },
        });

        // Resumen por sección
        const por_sec: Record<number, { nombre_seccion: string; carrera: string; total: number; presentes: number; ausencias: number; tardanzas: number; justificados: number }> = {};
        for (const r of registros) {
            if (!por_sec[r.seccion_id]) {
                por_sec[r.seccion_id] = {
                    nombre_seccion: r.seccion.nombre,
                    carrera: r.seccion.carrera?.nombre ?? '',
                    total: 0, presentes: 0, ausencias: 0, tardanzas: 0, justificados: 0,
                };
            }
            const s = por_sec[r.seccion_id];
            s.total++;
            if (r.estado === 'PRESENTE') s.presentes++;
            else if (r.estado === 'AUSENTE') s.ausencias++;
            else if (r.estado === 'TARDANZA') s.tardanzas++;
            else if (r.estado === 'JUSTIFICADO') s.justificados++;
        }

        const resumen = Object.entries(por_sec).map(([seccion_id, v]) => ({
            seccion_id: Number(seccion_id),
            ...v,
            pct_asistencia: v.total > 0 ? Math.round(((v.total - v.ausencias) / v.total) * 100) : 100,
        }));

        return { resumen, historial: registros };
    }
}
