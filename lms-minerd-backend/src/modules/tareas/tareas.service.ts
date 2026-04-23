import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TareasService {
    constructor(private prisma: PrismaService) { }

    private async getDocente(usuario_id: number) {
        const docente = await this.prisma.docentePerfil.findUnique({ where: { usuario_id } });
        if (!docente) throw new NotFoundException('Perfil docente no encontrado');
        return docente;
    }

    async getMisTareas(usuario_id: number) {
        const docente = await this.getDocente(usuario_id);
        return this.prisma.tarea.findMany({
            where: { docente_id: docente.id },
            include: { seccion: true },
            orderBy: { fecha_entrega: 'asc' },
        });
    }

    async getTareasPorSeccion(seccion_id: number) {
        return this.prisma.tarea.findMany({
            where: { seccion_id, estado: 'ACTIVA' },
            include: {
                docente: { include: { usuario: { select: { nombre_completo: true } } } },
            },
            orderBy: { fecha_entrega: 'asc' },
        });
    }

    async crearTarea(usuario_id: number, body: {
        titulo: string;
        descripcion: string;
        instrucciones?: string;
        tipo: string;
        fecha_entrega: string;
        seccion_id: number;
        carga_id?: number;
    }) {
        const docente = await this.getDocente(usuario_id);
        return this.prisma.tarea.create({
            data: {
                titulo: body.titulo,
                descripcion: body.descripcion,
                instrucciones: body.instrucciones,
                tipo: body.tipo || 'TAREA',
                fecha_entrega: new Date(body.fecha_entrega),
                seccion_id: body.seccion_id,
                carga_id: body.carga_id ?? null,
                docente_id: docente.id,
            },
            include: { seccion: true },
        });
    }

    async actualizarFechaEntrega(usuario_id: number, tarea_id: number, fecha_entrega: string) {
        const docente = await this.getDocente(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id: tarea_id } });
        if (!tarea) throw new NotFoundException('Tarea no encontrada');
        if (tarea.docente_id !== docente.id) throw new ForbiddenException('No tienes permiso');
        return this.prisma.tarea.update({
            where: { id: tarea_id },
            data: { fecha_entrega: new Date(fecha_entrega) },
            include: { seccion: true },
        });
    }

    async actualizarTarea(usuario_id: number, tarea_id: number, body: Partial<{
        titulo: string;
        descripcion: string;
        instrucciones: string;
        tipo: string;
        fecha_entrega: string;
        estado: string;
    }>) {
        const docente = await this.getDocente(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id: tarea_id } });
        if (!tarea) throw new NotFoundException('Tarea no encontrada');
        if (tarea.docente_id !== docente.id) throw new ForbiddenException('No tienes permiso');
        const data: any = { ...body };
        if (body.fecha_entrega) data.fecha_entrega = new Date(body.fecha_entrega);
        return this.prisma.tarea.update({ where: { id: tarea_id }, data, include: { seccion: true } });
    }

    async eliminarTarea(usuario_id: number, tarea_id: number) {
        const docente = await this.getDocente(usuario_id);
        const tarea = await this.prisma.tarea.findUnique({ where: { id: tarea_id } });
        if (!tarea) throw new NotFoundException('Tarea no encontrada');
        if (tarea.docente_id !== docente.id) throw new ForbiddenException('No tienes permiso');
        return this.prisma.tarea.delete({ where: { id: tarea_id } });
    }
}
