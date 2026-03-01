import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DocentesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.docentePerfil.findMany({
            include: {
                usuario: true, // Join SQL con la tabla base Usuario
                cargas_academicas: {
                    include: {
                        seccion: true,
                        modulo_formativo: true
                    }
                }
            }
        });
    }

    async findOne(id: number) {
        return this.prisma.docentePerfil.findUnique({
            where: { id },
            include: { usuario: true, cargas_academicas: true },
        });
    }

    // Crea el Usuario base y el Perfil Extendido en una Transacción Atómica
    async create(data: any) {
        const { email, password_hash, nombre_completo, cedula, especialidad_tecnica, grado_academico } = data;

        return this.prisma.usuario.create({
            data: {
                email,
                password_hash,
                nombre_completo,
                rol: 'DOCENTE',
                perfilDocente: {
                    create: {
                        cedula,
                        especialidad_tecnica,
                        grado_academico,
                    }
                }
            },
            include: {
                perfilDocente: true
            }
        });
    }

    async update(id: number, data: { especialidad_tecnica?: string; grado_academico?: string; nombre_completo?: string }) {
        const perfil = await this.prisma.docentePerfil.findUnique({ where: { id }, include: { usuario: true } });
        if (!perfil) return null;

        // Actualizar nombre en Usuario si viene
        if (data.nombre_completo) {
            await this.prisma.usuario.update({
                where: { id: perfil.usuario_id },
                data: { nombre_completo: data.nombre_completo }
            });
        }
        return this.prisma.docentePerfil.update({
            where: { id },
            data: {
                especialidad_tecnica: data.especialidad_tecnica,
                grado_academico: data.grado_academico,
            },
            include: { usuario: true, cargas_academicas: true }
        });
    }

    async updateEstado(id: number, estado_laboral: string) {
        return this.prisma.docentePerfil.update({
            where: { id },
            data: { estado_laboral },
        });
    }
}
