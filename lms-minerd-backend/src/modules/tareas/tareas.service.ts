import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TareasService {
    constructor(private prisma: PrismaService) {}

    private async getDocenteId(usuario_id: number) {
        const perfil = await this.prisma.docentePerfil.findUnique({ where: { usuario_id } });
        if (!perfil) throw new ForbiddenException('No eres docente');
        return perfil.id;
    }

    private async getEstudianteId(usuario_id: number) {
        const perfil = await this.prisma.estudiantePerfil.findUnique({ where: { usuario_id } });
        if (!perfil) throw new ForbiddenException('No eres estudiante');
        return perfil.id;
    }

    async getMisTareas(usuario_id: number) {
        const docente_id = await this.getDocenteId(usuario_id);
        return this.prisma.tarea.findMany({
            where: { docente_id },
            include: {
                seccion: { select: { id: true, nombre: true } },
                _count: { select: { entregas: true } },
            },
            orderBy: { fecha_entrega: 'asc' },
        });
    }

    async getTareasPorSeccion(seccion_id: number, usuario_id: number) {
        const estudiante_id = await this.getEstudianteId(usuario_id);
        const tareas = await this.prisma.tarea.findMany({
            where: { seccion_id, estado: { not: 'ARCHIVADA' } },
            include: {
                docente: { include: { usuario: { select: { nombre_completo: true } } } },
                entregas: { where: { estudiante_id }, take: 1 },
            },
            orderBy: { fecha_entrega: 'asc' },
        });
        return tareas.map(t => ({ ...t, mi_entrega: t.entregas[0] ?? null, entregas: undefined }));
    }

    async crearTarea(usuario_id: number, body: any) {
        const docente_id = await this.getDocenteId(usuario_id);
        return this.prisma.tarea.create({
            data: {
                titulo: body.titulo,
                descripcion: body.descripcion,
                instrucciones: body.instrucciones ?? null,
                tipo: body.tipo ?? 'TAREA',
                prioridad: body.prioridad ?? 'MEDIA',
                fecha_entrega: new Date(body.fecha_entrega),
                seccion_id: body.seccion_id,
                carga_id: body.carga_id ?? null,
                docente_id,
                permite_entrega: body.permite_entrega ?? true,
            },
            include: { seccion: { select: { id: true, nombre: true } }, _count: { select: { entregas: true } } },
        });
    }

    async actualizarTarea(usuario_id: number, id: number, body: any) {
        const docente_id = await this.getDocenteId(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id } });
        if (!tarea) throw new NotFoundException('Tarea no encontrada');
        if (tarea.docente_id !== docente_id) throw new ForbiddenException('No es tu tarea');

        return this.prisma.tarea.update({
            where: { id },
            data: {
                titulo: body.titulo ?? tarea.titulo,
                descripcion: body.descripcion ?? tarea.descripcion,
                instrucciones: body.instrucciones ?? tarea.instrucciones,
                tipo: body.tipo ?? tarea.tipo,
                prioridad: body.prioridad ?? tarea.prioridad,
                fecha_entrega: body.fecha_entrega ? new Date(body.fecha_entrega) : tarea.fecha_entrega,
                permite_entrega: body.permite_entrega ?? tarea.permite_entrega,
            },
            include: { seccion: { select: { id: true, nombre: true } }, _count: { select: { entregas: true } } },
        });
    }

    async actualizarEstado(usuario_id: number, id: number, estado: string) {
        const docente_id = await this.getDocenteId(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id } });
        if (!tarea || tarea.docente_id !== docente_id) throw new ForbiddenException();
        return this.prisma.tarea.update({
            where: { id },
            data: { estado, permite_entrega: estado === 'CERRADA' ? false : tarea.permite_entrega },
        });
    }

    async eliminarTarea(usuario_id: number, id: number) {
        const docente_id = await this.getDocenteId(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id } });
        if (!tarea || tarea.docente_id !== docente_id) throw new ForbiddenException();
        return this.prisma.tarea.delete({ where: { id } });
    }

    async getEntregasPorTarea(usuario_id: number, tarea_id: number) {
        const docente_id = await this.getDocenteId(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({
            where: { id: tarea_id },
            include: {
                seccion: {
                    include: {
                        matriculas: {
                            include: { estudiante: { include: { usuario: { select: { nombre_completo: true } } } } },
                        },
                    },
                },
                entregas: {
                    include: { estudiante: { include: { usuario: { select: { nombre_completo: true } } } } },
                },
            },
        });
        if (!tarea || tarea.docente_id !== docente_id) throw new ForbiddenException();

        const matriculados = tarea.seccion.matriculas.map(m => m.estudiante);
        return matriculados.map(est => ({
            estudiante_id: est.id,
            rne: est.rne,
            nombre: est.usuario.nombre_completo,
            entrega: tarea.entregas.find(e => e.estudiante_id === est.id) ?? null,
        }));
    }

    async crearOActualizarEntrega(usuario_id: number, tarea_id: number, body: any) {
        const estudiante_id = await this.getEstudianteId(usuario_id);
        return this.prisma.entregaTarea.upsert({
            where: { tarea_id_estudiante_id: { tarea_id, estudiante_id } },
            update: { estado: 'ENTREGADA', comentario: body.comentario ?? null, fecha_entrega: new Date() },
            create: { tarea_id, estudiante_id, estado: 'ENTREGADA', comentario: body.comentario ?? null, fecha_entrega: new Date() },
        });
    }

    async revisarEntrega(usuario_id: number, tarea_id: number, entrega_id: number) {
        const docente_id = await this.getDocenteId(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id: tarea_id } });
        if (!tarea || tarea.docente_id !== docente_id) throw new ForbiddenException();
        return this.prisma.entregaTarea.update({ where: { id: entrega_id }, data: { estado: 'REVISADA' } });
    }
}
