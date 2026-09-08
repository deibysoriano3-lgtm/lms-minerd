import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

interface CreateEvaluacionFCTDto {
    rne: string;           // RNE del estudiante pasante
    tutor_empresa: string;
    empresa: string;
    horas_reportadas: number;
    criterios: Record<string, string>; // { c1: 'Excelente', c2: 'Bueno', ... }
    comentarios?: string;
}

@Injectable()
export class FctService {
    constructor(private prisma: PrismaService) { }

    /** Registrar una evaluación FCT enviada por el tutor empresarial */
    async crearEvaluacion(dto: CreateEvaluacionFCTDto) {
        const perfil = await this.prisma.estudiantePerfil.findFirst({
            where: { rne: dto.rne },
        });
        if (!perfil) {
            throw new NotFoundException(`No se encontró estudiante con RNE: ${dto.rne}`);
        }

        const evaluacion = await this.prisma.evaluacionFCT.create({
            data: {
                estudiante_id: perfil.id,
                tutor_empresa: dto.tutor_empresa,
                empresa: dto.empresa,
                horas_reportadas: dto.horas_reportadas,
                criterios: JSON.stringify(dto.criterios),
                comentarios: dto.comentarios ?? '',
                estado: 'ENVIADO',
            },
            include: { estudiante: { include: { usuario: { select: { nombre_completo: true } } } } },
        });

        return {
            ok: true,
            mensaje: `Evaluación FCT enviada correctamente para ${evaluacion.estudiante.usuario.nombre_completo}.`,
            evaluacion_id: evaluacion.id,
            estado: evaluacion.estado,
        };
    }

    /** Listar evaluaciones FCT (para el admin/coordinador) */
    async listar() {
        return this.prisma.evaluacionFCT.findMany({
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true, email: true } },
                    },
                },
            },
            orderBy: { creado_en: 'desc' },
        });
    }

    private get db(): any { return this.prisma; }

    async crearAsignacion(body: {
        estudiante_id: number;
        empresa: string;
        tutor_empresa_nombre: string;
        tutor_empresa_tel?: string;
        fecha_inicio: string;
        fecha_fin_esperada: string;
        horas_requeridas?: number;
        observaciones?: string;
    }) {
        return this.db.asignacionFCT.create({
            data: {
                estudiante_id: body.estudiante_id,
                empresa: body.empresa,
                tutor_empresa_nombre: body.tutor_empresa_nombre,
                tutor_empresa_tel: body.tutor_empresa_tel ?? null,
                fecha_inicio: new Date(body.fecha_inicio),
                fecha_fin_esperada: new Date(body.fecha_fin_esperada),
                horas_requeridas: body.horas_requeridas ?? 360,
                observaciones: body.observaciones ?? null,
            },
            include: {
                estudiante: { include: { usuario: { select: { nombre_completo: true } } } },
            },
        });
    }

    async listarAsignaciones() {
        const asignaciones = await this.db.asignacionFCT.findMany({
            orderBy: { creado_en: 'desc' },
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true } },
                        carrera_actual: { select: { nombre: true } },
                        evaluaciones_fct: { orderBy: { creado_en: 'desc' }, take: 1 },
                    },
                },
            },
        });
        return asignaciones.map((a: any) => ({
            ...a,
            ultima_evaluacion: a.estudiante.evaluaciones_fct[0] ?? null,
            horas_reportadas: a.estudiante.evaluaciones_fct[0]?.horas_reportadas ?? 0,
        }));
    }

    async actualizarEstadoAsignacion(id: number, estado: string) {
        return this.db.asignacionFCT.update({
            where: { id },
            data: { estado },
        });
    }
}
