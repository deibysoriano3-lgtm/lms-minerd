import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CurriculumService {
    constructor(private prisma: PrismaService) { }

    async getCarreras() {
        return this.prisma.carreraTecnica.findMany({
            include: {
                familia: true,
                _count: {
                    select: { modulos: true }
                }
            }
        });
    }

    async getFamiliasProfesionales() {
        return this.prisma.familiaProfesional.findMany();
    }

    async createCarrera(data: { codigo_minerd: string, nombre: string, familia_profesional_id: number, duracion_anios: number }) {
        return this.prisma.carreraTecnica.create({
            data: {
                codigo_minerd: data.codigo_minerd,
                nombre: data.nombre,
                familia_profesional_id: data.familia_profesional_id,
                duracion_anios: data.duracion_anios,
                estado: 'ACTIVA'
            }
        });
    }

    async createModulo(data: { carrera_id: number, codigo: string, nombre: string, horas_totales: number }) {
        return this.prisma.moduloFormativo.create({
            data: {
                carrera_id: data.carrera_id,
                codigo: data.codigo,
                nombre: data.nombre,
                horas_totales: data.horas_totales
            }
        });
    }

    async getModulosPorCarrera(carreraId: number) {
        return this.prisma.moduloFormativo.findMany({
            where: { carrera_id: carreraId },
            include: {
                resultados_aprendizaje: true
            }
        });
    }

    async actualizarRAs(moduloId: number, nuevosRAs: { numero: string, descripcion: string, valor_maximo: number }[]) {
        // Validar Sumatoria de 100
        const granTotal = nuevosRAs.reduce((acc, curr) => acc + curr.valor_maximo, 0);
        if (granTotal !== 100) {
            throw new BadRequestException(`El sumatorio de los Resultados de Aprendizaje debe ser exactamente 100 puntos. Actualmente suma: ${granTotal}`);
        }

        // Transacción Atómica: Borramos los viejos de ese Módulo y metemos los Nuevos.
        return this.prisma.$transaction(async (tx) => {
            // 1. Opcional/Requerido: Borrar notas previas (En un sistema full, se validaría antes).
            // Pero como es un Gestor de Diseño Curricular a principio de año, lo ideal es purgar e insertar:

            await tx.calificacionRA.deleteMany({
                where: { resultado_aprendizaje: { modulo_id: moduloId } }
            });

            await tx.resultadoAprendizaje.deleteMany({
                where: { modulo_id: moduloId }
            });

            // Creamos los fresecitos
            const creados = await Promise.all(
                nuevosRAs.map(ra => tx.resultadoAprendizaje.create({
                    data: {
                        modulo_id: moduloId,
                        numero: ra.numero,
                        descripcion: ra.descripcion,
                        valor_maximo: ra.valor_maximo
                    }
                }))
            );

            return creados;
        });
    }
}
