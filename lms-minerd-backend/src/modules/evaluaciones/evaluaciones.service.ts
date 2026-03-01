import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class EvaluacionesService {
    constructor(private prisma: PrismaService) { }

    // 1. Obtener los Módulos Formativos asignados a un docente
    async getCargaAcademicaDocente(usuario_id: number) {
        // Encontrar el perfil docente
        const docente = await this.prisma.docentePerfil.findUnique({
            where: { usuario_id }
        });
        if (!docente) throw new NotFoundException("Perfil docente no encontrado");

        return this.prisma.cargaAcademica.findMany({
            where: { docente_id: docente.id },
            include: {
                modulo_formativo: {
                    include: { resultados_aprendizaje: true }
                },
                asignatura_academica: true,
                seccion: true,
                periodo: true
            }
        });
    }

    // 2. Obtener los estudiantes matriculados en una sección para evaluar un módulo O asignatura
    async getEstudiantesParaEvaluar(seccion_id: number, clase_id: number, tipo: 'MODULO' | 'ASIGNATURA') {
        const matriculas = await this.prisma.matriculaEstudiante.findMany({
            where: { seccion_id, estado_matricula: 'INSCRITO' },
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true, email: true } }
                    }
                }
            }
        });

        const estudiantesConNotas = await Promise.all(matriculas.map(async (m) => {
            let calificaciones: any[] = [];
            let calificaciones_acad: any[] = [];

            if (tipo === 'MODULO') {
                calificaciones = await this.prisma.calificacionRA.findMany({
                    where: { estudiante_id: m.estudiante_id, resultado_aprendizaje: { modulo_id: clase_id } }
                });
            } else {
                const acad = await this.prisma.calificacionAcademica.findUnique({
                    where: { estudiante_id_asignatura_id: { estudiante_id: m.estudiante_id, asignatura_id: clase_id } }
                });
                if (acad) calificaciones_acad.push(acad);
            }

            const observaciones = await this.prisma.registroAnecdotico.findMany({
                where: { estudiante_id: m.estudiante_id },
                orderBy: { fecha_registro: 'desc' }
            });

            return {
                id: m.estudiante.id,
                usuario_id: m.estudiante.usuario_id,
                rne: m.estudiante.rne,
                nombre: m.estudiante.usuario?.nombre_completo || 'Sin Nombre',
                calificaciones,
                calificaciones_acad,
                observaciones
            };
        }));

        return estudiantesConNotas;
    }

    // 3. Guardar o actualizar notas (Push) para un estudiante en un RA (Incluyendo Recup)
    async guardarCalificacionRA(usuario_docente_id: number, estudiante_id: number, ra_id: number, valor_logrado: number, rp1: number = 0, rp2: number = 0) {
        const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id: usuario_docente_id } });
        if (!docente) throw new NotFoundException("Docente no válido");

        return this.prisma.calificacionRA.upsert({
            where: { estudiante_id_ra_id: { estudiante_id, ra_id } },
            update: { valor_logrado, rp1, rp2, docente_id: docente.id, fecha_evaluacion: new Date() },
            create: {
                estudiante_id,
                ra_id,
                valor_logrado,
                rp1,
                rp2,
                docente_id: docente.id
            }
        });
    }

    // 3.5 Guardar nota de Asignatura Académica (P1-P4)
    async guardarCalificacionAcademica(usuario_docente_id: number, estudiante_id: number, asignatura_id: number, payload: any) {
        const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id: usuario_docente_id } });
        if (!docente) throw new NotFoundException("Docente no válido");

        return this.prisma.calificacionAcademica.upsert({
            where: { estudiante_id_asignatura_id: { estudiante_id, asignatura_id } },
            update: { ...payload, docente_id: docente.id },
            create: {
                estudiante_id,
                asignatura_id,
                ...payload,
                docente_id: docente.id
            }
        });
    }

    // 4. Agregar Observación Disciplinaria / Orientación
    async agregarObservacion(usuario_docente_id: number, estudiante_id: number, incidencia: string, tipo: string) {
        const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id: usuario_docente_id } });
        if (!docente) throw new NotFoundException("Docente no válido");

        return this.prisma.registroAnecdotico.create({
            data: {
                estudiante_id,
                docente_id: docente.id,
                incidencia,
                tipo // 'OBSERVACION', 'POSITIVA', 'MEJORA', 'DISCIPLINA'
            }
        });
    }

    // 5. Resumen de calificaciones ya guardadas para una carga (modulo_id + seccion_id)
    async getResumenCarga(usuario_id: number, modulo_id: number, seccion_id: number) {
        const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id } });
        if (!docente) throw new NotFoundException("Perfil docente no encontrado");

        // Obtener RAs del módulo
        const ras = await this.prisma.resultadoAprendizaje.findMany({
            where: { modulo_id },
            orderBy: { numero: 'asc' }
        });

        // Obtener estudiantes inscritos en la sección
        const matriculas = await this.prisma.matriculaEstudiante.findMany({
            where: { seccion_id, estado_matricula: 'INSCRITO' },
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true } },
                        calificaciones_ra: { where: { resultado_aprendizaje: { modulo_id } } }
                    }
                }
            }
        });

        return {
            ras: ras.map(r => ({ id: r.id, numero: r.numero, max: r.valor_maximo })),
            estudiantes: matriculas.map(m => ({
                id: m.estudiante.id,
                rne: m.estudiante.rne,
                nombre: m.estudiante.usuario?.nombre_completo ?? 'Sin nombre',
                notas: m.estudiante.calificaciones_ra.map(c => ({
                    ra_id: c.ra_id,
                    valor: c.valor_logrado
                }))
            }))
        };
    }
}
