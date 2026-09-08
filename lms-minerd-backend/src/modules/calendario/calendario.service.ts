import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CalendarioService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    async listar(mes?: number, anio?: number, seccion_id?: number) {
        const where: any = {};
        if (mes !== undefined && anio !== undefined) {
            const inicio = new Date(anio, mes - 1, 1);
            const fin = new Date(anio, mes, 0, 23, 59, 59);
            where.fecha_inicio = { gte: inicio, lte: fin };
        }
        if (seccion_id) {
            where.OR = [{ es_global: true }, { seccion_id }];
        }
        return this.db.eventoCalendario.findMany({ where, orderBy: { fecha_inicio: 'asc' } });
    }

    async crear(usuario_id: number, body: {
        titulo: string; descripcion?: string; fecha_inicio: string;
        fecha_fin?: string; tipo: string; color: string; es_global: boolean; seccion_id?: number; periodo_id?: number;
    }) {
        return this.db.eventoCalendario.create({
            data: {
                titulo: body.titulo,
                descripcion: body.descripcion ?? null,
                fecha_inicio: new Date(body.fecha_inicio),
                fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : null,
                tipo: body.tipo ?? 'EVENTO',
                color: body.color ?? 'indigo',
                es_global: body.es_global ?? true,
                seccion_id: body.seccion_id ?? null,
                periodo_id: body.periodo_id ?? null,
                creado_por: usuario_id,
            },
        });
    }

    async actualizar(id: number, usuario_id: number, rol: string, body: any) {
        const evento = await this.db.eventoCalendario.findUnique({ where: { id } });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (rol !== 'ADMIN' && evento.creado_por !== usuario_id) throw new ForbiddenException('Sin permiso para editar este evento');
        return this.db.eventoCalendario.update({
            where: { id },
            data: {
                titulo: body.titulo ?? evento.titulo,
                descripcion: body.descripcion ?? evento.descripcion,
                fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : evento.fecha_inicio,
                fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : evento.fecha_fin,
                tipo: body.tipo ?? evento.tipo,
                color: body.color ?? evento.color,
                es_global: body.es_global ?? evento.es_global,
                seccion_id: body.seccion_id ?? evento.seccion_id,
                periodo_id: body.periodo_id ?? evento.periodo_id,
            },
        });
    }

    async eliminar(id: number, usuario_id: number, rol: string) {
        const evento = await this.db.eventoCalendario.findUnique({ where: { id } });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (rol !== 'ADMIN' && evento.creado_por !== usuario_id) throw new ForbiddenException('Sin permiso para eliminar este evento');
        return this.db.eventoCalendario.delete({ where: { id } });
    }
}
