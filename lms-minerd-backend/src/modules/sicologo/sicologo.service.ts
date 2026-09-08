import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SicologoService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    async getMiPerfil(usuario_id: number) {
        const sicologo = await this.prisma.sicologoPerfil.findUnique({
            where: { usuario_id },
            include: { usuario: { select: { nombre_completo: true, email: true } } },
        });
        if (!sicologo) throw new NotFoundException('Perfil de sicólogo no encontrado');
        return sicologo;
    }

    async getAnecdotas() {
        return this.prisma.registroAnecdotico.findMany({
            orderBy: { fecha_registro: 'desc' },
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true } },
                        carrera_actual: { select: { nombre: true } },
                    },
                },
                docente: {
                    include: { usuario: { select: { nombre_completo: true } } },
                },
            },
        });
    }

    async crearAnecdota(usuario_id: number, body: { estudiante_id: number; incidencia: string; tipo: string }) {
        const sicologo = await this.prisma.sicologoPerfil.findUnique({ where: { usuario_id } });
        if (!sicologo) throw new NotFoundException('Perfil de sicólogo no encontrado');

        return this.prisma.registroAnecdotico.create({
            data: {
                estudiante_id: body.estudiante_id,
                docente_id: null as any,
                incidencia: body.incidencia,
                tipo: body.tipo,
            },
        });
    }

    async listarSicologos() {
        const lista = await this.db.sicologoPerfil.findMany({
            include: {
                usuario: { select: { id: true, nombre_completo: true, email: true } },
                secciones: {
                    include: {
                        seccion: {
                            select: { id: true, nombre: true, grado: true, carrera: { select: { nombre: true } } },
                        },
                    },
                },
            },
            orderBy: { usuario: { nombre_completo: 'asc' } },
        });
        return lista;
    }

    async crearSicologo(data: { nombre_completo: string; email: string; password: string; cedula: string }) {
        const password_hash = await bcrypt.hash(data.password || '123456', 10);
        return this.prisma.usuario.create({
            data: {
                email: data.email,
                password_hash,
                nombre_completo: data.nombre_completo,
                rol: 'SICOLOGO',
                perfilSicologo: { create: { cedula: data.cedula } },
            },
            include: { perfilSicologo: true },
        });
    }

    /** Asigna una o varias secciones a un sicólogo */
    async asignarSecciones(sicologo_id: number, seccion_ids: number[]) {
        const ops = seccion_ids.map(seccion_id =>
            this.db.sicologoSeccion.upsert({
                where: { sicologo_id_seccion_id: { sicologo_id, seccion_id } },
                update: {},
                create: { sicologo_id, seccion_id },
            })
        );
        return this.prisma.$transaction(ops);
    }

    /** Quita una sección de un sicólogo */
    async quitarSeccion(sicologo_id: number, seccion_id: number) {
        return this.db.sicologoSeccion.deleteMany({
            where: { sicologo_id, seccion_id },
        });
    }

    /** Lista las secciones asignadas a un sicólogo */
    async getSecciones(sicologo_id: number) {
        const rows = await this.db.sicologoSeccion.findMany({
            where: { sicologo_id },
            include: {
                seccion: {
                    select: { id: true, nombre: true, grado: true, carrera: { select: { nombre: true } } },
                },
            },
        });
        return rows.map((r: any) => r.seccion);
    }

    /** Secciones del sicólogo logueado (por usuario_id) */
    async getMisSecciones(usuario_id: number) {
        const sicologo = await this.prisma.sicologoPerfil.findUnique({ where: { usuario_id } });
        if (!sicologo) throw new NotFoundException('Perfil no encontrado');
        return this.getSecciones(sicologo.id);
    }

    /** Estudiantes filtrados por las secciones asignadas al sicólogo */
    async getEstudiantes(usuario_id: number) {
        const sicologo = await this.prisma.sicologoPerfil.findUnique({ where: { usuario_id } });
        if (!sicologo) throw new NotFoundException('Perfil no encontrado');

        const secciones = await this.db.sicologoSeccion.findMany({
            where: { sicologo_id: sicologo.id },
            select: { seccion_id: true },
        });

        // Si no tiene secciones asignadas devuelve todos (para no romper flujos iniciales)
        const seccionIds = secciones.map((s: any) => s.seccion_id);

        const whereClause = seccionIds.length > 0
            ? { matriculas: { some: { seccion_id: { in: seccionIds } } } }
            : {};

        return this.prisma.estudiantePerfil.findMany({
            where: whereClause,
            include: {
                usuario: { select: { nombre_completo: true } },
                carrera_actual: { select: { nombre: true } },
                anecdotas: {
                    orderBy: { fecha_registro: 'desc' },
                    include: { docente: { include: { usuario: { select: { nombre_completo: true } } } } },
                },
            },
            orderBy: { usuario: { nombre_completo: 'asc' } },
        });
    }
}
