import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

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
        const { email, password, nombre_completo, cedula, especialidad_tecnica, grado_academico } = data;
        const password_hash = await bcrypt.hash(password || 'Minerd2025!', 10);

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

    async asignarCarga(docente_id: number, body: { periodo_id: number; seccion_id: number; modulo_formativo_id?: number; asignatura_academica_id?: number }) {
        return this.prisma.cargaAcademica.create({
            data: {
                docente_id,
                periodo_id: body.periodo_id,
                seccion_id: body.seccion_id,
                modulo_formativo_id: body.modulo_formativo_id ?? null,
                asignatura_academica_id: body.asignatura_academica_id ?? null,
            },
            include: {
                seccion: true,
                modulo_formativo: true,
                asignatura_academica: true,
                periodo: true,
            },
        });
    }

    async eliminarCarga(carga_id: number) {
        return this.prisma.cargaAcademica.delete({ where: { id: carga_id } });
    }
}
