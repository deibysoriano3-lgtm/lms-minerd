import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DisciplinaService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    async registrar(registrado_por: number, body: {
        estudiante_id: number;
        tipo: string;
        descripcion: string;
        sancion?: string;
        fecha_incidente: string;
        fecha_notif_padre?: string;
    }) {
        return this.db.registroDisciplina.create({
            data: {
                estudiante_id: body.estudiante_id,
                tipo: body.tipo ?? 'LEVE',
                descripcion: body.descripcion,
                sancion: body.sancion ?? null,
                fecha_incidente: new Date(body.fecha_incidente),
                fecha_notif_padre: body.fecha_notif_padre ? new Date(body.fecha_notif_padre) : null,
                registrado_por,
            },
            include: {
                estudiante: { include: { usuario: { select: { nombre_completo: true } } } },
            },
        });
    }

    async listar() {
        return this.db.registroDisciplina.findMany({
            orderBy: { fecha_incidente: 'desc' },
            include: {
                estudiante: {
                    include: {
                        usuario: { select: { nombre_completo: true } },
                        carrera_actual: { select: { nombre: true } },
                    },
                },
            },
        });
    }

    async listarPorEstudiante(estudiante_id: number) {
        return this.db.registroDisciplina.findMany({
            where: { estudiante_id },
            orderBy: { fecha_incidente: 'desc' },
        });
    }

    async actualizarEstado(id: number, body: { estado: string; resolucion?: string }) {
        return this.db.registroDisciplina.update({
            where: { id },
            data: { estado: body.estado, resolucion: body.resolucion ?? null },
        });
    }
}
