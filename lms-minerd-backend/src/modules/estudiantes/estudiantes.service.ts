import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudiantesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.estudiantePerfil.findMany({
            include: {
                usuario: true,
                carrera_actual: true,
                matriculas: {
                    include: { seccion: true, periodo: true }
                }
            },
        });
    }

    async findOne(id: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id },
            include: {
                usuario: true,
                carrera_actual: true,
                tutores: true,
            },
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado');
        return estudiante;
    }

    async create(data: any) {
        const { email, password, nombre_completo, rne, fecha_nacimiento, telefono_contacto, carrera_id } = data;
        const hash = await bcrypt.hash(password || '123456', 10); // Clave por defecto si no se provée

        return this.prisma.usuario.create({
            data: {
                email,
                password_hash: hash,
                nombre_completo,
                rol: 'ESTUDIANTE',
                perfilEstudiante: {
                    create: {
                        rne,
                        fecha_nacimiento: new Date(fecha_nacimiento),
                        telefono_contacto,
                        carrera_actual_id: carrera_id ? Number(carrera_id) : null
                    }
                }
            },
            include: {
                perfilEstudiante: true
            }
        });
    }

    async getExpedienteCompleto(estudianteId: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id: estudianteId },
            include: {
                usuario: {
                    select: { nombre_completo: true, email: true }
                },
                carrera_actual: true,
                tutores: true,
                anecdotas: {
                    orderBy: { fecha_registro: 'desc' },
                    include: {
                        docente: {
                            include: { usuario: { select: { nombre_completo: true } } }
                        }
                    }
                },
                calificaciones_ra: {
                    include: {
                        resultado_aprendizaje: {
                            include: {
                                modulo: true
                            }
                        }
                    }
                }
            }
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado');
        return estudiante;
    }

    async getBoletinData(estudianteId: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id: estudianteId },
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                carrera_actual: {
                    include: { familia: true }
                },
                tutores: {
                    where: { es_tutor_principal: true },
                    take: 1
                },
                matriculas: {
                    orderBy: { fecha_inscripcion: 'desc' },
                    take: 1,
                    include: {
                        seccion: true,
                        periodo: true
                    }
                },
                // Calificaciones académicas (asignaturas P1-P4)
                calificaciones_acad: {
                    include: {
                        asignatura: true
                    }
                },
                // Calificaciones RA (módulos formativos técnicos)
                calificaciones_ra: {
                    include: {
                        resultado_aprendizaje: {
                            include: {
                                modulo: true
                            }
                        }
                    }
                }
            }
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado para el boletín');
        return estudiante;
    }
}
