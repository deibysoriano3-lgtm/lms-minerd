import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CoordinadorService {
    constructor(private prisma: PrismaService) {}

    async getMiPerfil(usuario_id: number) {
        const coordinador = await this.prisma.coordinadorPerfil.findUnique({
            where: { usuario_id },
            include: { usuario: { select: { nombre_completo: true, email: true } } },
        });
        if (!coordinador) throw new NotFoundException('Perfil de coordinador no encontrado');
        return coordinador;
    }

    async getResumen() {
        const [estudiantesActivos, docentesActivos, totalSecciones, topCarreras, estadosCounts] = await Promise.all([
            this.prisma.estudiantePerfil.count({ where: { estado_academico: 'ACTIVO' } }),
            this.prisma.docentePerfil.count({ where: { estado_laboral: 'ACTIVO' } }),
            this.prisma.seccion.count(),
            this.prisma.carreraTecnica.findMany({
                take: 5,
                include: { _count: { select: { estudiantes: true } } },
                orderBy: { estudiantes: { _count: 'desc' } },
            }),
            this.prisma.estudiantePerfil.groupBy({ by: ['estado_academico'], _count: { _all: true } }),
        ]);

        const porEstado: Record<string, number> = {};
        estadosCounts.forEach((e: any) => { porEstado[e.estado_academico] = e._count._all; });

        return {
            estudiantesActivos,
            docentesActivos,
            secciones: totalSecciones,
            carreras: topCarreras.length,
            topCarreras,
            porEstado,
        };
    }

    async getEstudiantes() {
        return this.prisma.estudiantePerfil.findMany({
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                carrera_actual: true,
                matriculas: {
                    orderBy: { fecha_inscripcion: 'desc' },
                    take: 1,
                    include: { seccion: true, periodo: true },
                },
            },
            orderBy: { usuario: { nombre_completo: 'asc' } },
        });
    }

    async getDocentes() {
        return this.prisma.docentePerfil.findMany({
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                cargas_academicas: {
                    include: { modulo_formativo: true, asignatura_academica: true, seccion: true, periodo: true },
                },
            },
            orderBy: { usuario: { nombre_completo: 'asc' } },
        });
    }
}
