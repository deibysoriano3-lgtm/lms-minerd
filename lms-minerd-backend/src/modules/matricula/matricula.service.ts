import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MatriculaService {
    constructor(private prisma: PrismaService) { }

    async matricularEstudiante(estudiante_id: number, periodo_id: number, seccion_id: number) {
        // Validar si ya está matriculado en ese periodo
        const existente = await this.prisma.matriculaEstudiante.findFirst({
            where: { estudiante_id, periodo_id }
        });

        if (existente) {
            throw new BadRequestException('El estudiante ya está matriculado en el periodo seleccionado');
        }

        return this.prisma.matriculaEstudiante.create({
            data: {
                estudiante_id,
                periodo_id,
                seccion_id,
                estado_matricula: 'INSCRITO',
                fecha_inscripcion: new Date(),
            },
            include: {
                estudiante: { include: { usuario: true } },
                seccion: { include: { carrera: true } },
                periodo: true
            }
        });
    }

    async getMatriculasPorEstudiante(estudiante_id: number) {
        return this.prisma.matriculaEstudiante.findMany({
            where: { estudiante_id },
            include: {
                seccion: { include: { carrera: true } },
                periodo: true
            }
        });
    }

    async getPeriodosActivos() {
        return this.prisma.periodoAcademico.findMany({
            orderBy: { fecha_inicio: 'desc' }
        });
    }

    async getSeccionesDisponibles() {
        return this.prisma.seccion.findMany({
            include: {
                carrera: true,
                _count: {
                    select: { matriculas: true }
                }
            }
        });
    }
}
