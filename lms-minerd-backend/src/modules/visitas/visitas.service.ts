import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VisitasService {
    constructor(private prisma: PrismaService) {}

    private get db(): any { return this.prisma; }

    async registrar(registrado_por: number, body: {
        estudiante_id: number;
        fecha: string;
        quien_visita: string;
        parentesco: string;
        motivo: string;
        acuerdos?: string;
        proxima_reunion?: string;
    }) {
        return this.db.visitaPadre.create({
            data: {
                estudiante_id: body.estudiante_id,
                fecha: new Date(body.fecha),
                quien_visita: body.quien_visita,
                parentesco: body.parentesco ?? 'TUTOR',
                motivo: body.motivo,
                acuerdos: body.acuerdos ?? null,
                proxima_reunion: body.proxima_reunion ? new Date(body.proxima_reunion) : null,
                registrado_por,
            },
            include: {
                estudiante: { include: { usuario: { select: { nombre_completo: true } } } },
            },
        });
    }

    async listar() {
        return this.db.visitaPadre.findMany({
            orderBy: { fecha: 'desc' },
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
        return this.db.visitaPadre.findMany({
            where: { estudiante_id },
            orderBy: { fecha: 'desc' },
        });
    }
}
