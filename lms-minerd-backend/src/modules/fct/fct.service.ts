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

    /** Listar evaluaciones FCT (para el admin) */
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
}
