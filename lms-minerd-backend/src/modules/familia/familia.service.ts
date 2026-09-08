import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FamiliaService {
    constructor(private prisma: PrismaService) {}

    async getMiPerfil(usuario_id: number) {
        const familia = await this.prisma.familiaPerfil.findUnique({
            where: { usuario_id },
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true, email: true } },
                        carrera_actual: { include: { familia: true } },
                        matriculas: {
                            orderBy: { fecha_inscripcion: 'desc' },
                            include: { seccion: true, periodo: true },
                        },
                        calificaciones_ra: {
                            include: {
                                resultado_aprendizaje: { include: { modulo: true } },
                            },
                        },
                        calificaciones_acad: { include: { asignatura: true } },
                        anecdotas: {
                            orderBy: { fecha_registro: 'desc' },
                            include: {
                                docente: { include: { usuario: { select: { nombre_completo: true } } } },
                            },
                        },
                        evaluaciones_fct: { orderBy: { creado_en: 'desc' } },
                        tutores: true,
                    },
                },
            },
        });
        if (!familia) throw new NotFoundException('Perfil de familiar no encontrado');
        return familia;
    }
}
