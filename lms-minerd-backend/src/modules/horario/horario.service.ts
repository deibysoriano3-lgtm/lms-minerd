import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HorarioService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    // ── Horario estructurado ────────────────────────────────────────────────

    async getHorariosCarga(carga_id: number) {
        return this.db.horarioCarga.findMany({ where: { carga_id }, orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }] });
    }

    async agregarSlot(carga_id: number, body: { dia: string; hora_inicio: string; hora_fin: string; aula?: string }) {
        return this.db.horarioCarga.create({ data: { carga_id, ...body } });
    }

    async eliminarSlot(id: number) {
        return this.db.horarioCarga.delete({ where: { id } });
    }

    async getMiHorario(usuario_id: number, rol: string) {
        if (rol === 'DOCENTE') {
            const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id } });
            if (!docente) throw new NotFoundException('Perfil no encontrado');
            return this.db.horarioCarga.findMany({
                where: { carga: { docente_id: docente.id } },
                include: {
                    carga: {
                        include: {
                            modulo_formativo: { select: { nombre: true } },
                            asignatura_academica: { select: { nombre: true } },
                            seccion: { select: { nombre: true, grado: true } },
                        },
                    },
                },
                orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }],
            });
        }

        if (rol === 'ESTUDIANTE') {
            const estudiante = await this.prisma.estudiantePerfil.findUnique({ where: { usuario_id } });
            if (!estudiante) throw new NotFoundException('Perfil no encontrado');
            const matriculas = await this.prisma.matriculaEstudiante.findMany({ where: { estudiante_id: estudiante.id } });
            const seccionIds = matriculas.map((m: any) => m.seccion_id);
            return this.db.horarioCarga.findMany({
                where: { carga: { seccion_id: { in: seccionIds } } },
                include: {
                    carga: {
                        include: {
                            modulo_formativo: { select: { nombre: true } },
                            asignatura_academica: { select: { nombre: true } },
                            docente: { include: { usuario: { select: { nombre_completo: true } } } },
                        },
                    },
                },
                orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }],
            });
        }

        // ADMIN / COORDINADOR: devuelve todo
        return this.db.horarioCarga.findMany({
            include: {
                carga: {
                    include: {
                        modulo_formativo: { select: { nombre: true } },
                        asignatura_academica: { select: { nombre: true } },
                        seccion: { select: { nombre: true, grado: true } },
                        docente: { include: { usuario: { select: { nombre_completo: true } } } },
                    },
                },
            },
            orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }],
        });
    }

    // ── Documentos ──────────────────────────────────────────────────────────

    async listarDocumentos() {
        return this.db.documentoHorario.findMany({ orderBy: { creado_en: 'desc' } });
    }

    async guardarDocumento(usuario_id: number, archivo: Express.Multer.File, body: { nombre: string; descripcion?: string; periodo_id?: string }) {
        return this.db.documentoHorario.create({
            data: {
                nombre: body.nombre || archivo.originalname,
                descripcion: body.descripcion ?? null,
                filename: archivo.filename,
                tipo_mime: archivo.mimetype,
                periodo_id: body.periodo_id ? Number(body.periodo_id) : null,
                subido_por: usuario_id,
            },
        });
    }

    async eliminarDocumento(id: number) {
        const doc = await this.db.documentoHorario.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException('Documento no encontrado');
        const filePath = path.join(process.cwd(), 'uploads', 'horarios', doc.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return this.db.documentoHorario.delete({ where: { id } });
    }

    // ── Cargas con horarios (para el panel admin) ───────────────────────────

    async getCargasConHorario(seccion_id?: number) {
        const where = seccion_id ? { seccion_id } : {};
        return this.prisma.cargaAcademica.findMany({
            where,
            include: {
                modulo_formativo: { select: { nombre: true } },
                asignatura_academica: { select: { nombre: true } },
                seccion: { select: { nombre: true, grado: true, carrera: { select: { nombre: true } } } },
                docente: { include: { usuario: { select: { nombre_completo: true } } } },
                horarios: { orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }] },
            },
            orderBy: { id: 'asc' },
        });
    }
}
