import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FctService } from './fct.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/fct')
export class FctController {
    constructor(private readonly fctService: FctService) { }

    /** POST /api/fct/evaluacion  — Tutor empresarial envía la evaluación */
    @Post('evaluacion')
    async crearEvaluacion(@Body() body: {
        rne: string;
        tutor_empresa: string;
        empresa: string;
        horas_reportadas: number;
        criterios: Record<string, string>;
        comentarios?: string;
    }) {
        return this.fctService.crearEvaluacion(body);
    }

    /** GET /api/fct/evaluaciones  — Admin/coordinador lista todas las evaluaciones */
    @UseGuards(JwtAuthGuard)
    @Get('evaluaciones')
    async listar() {
        return this.fctService.listar();
    }

    /** POST /api/fct/asignacion — Coordinador asigna estudiante a empresa */
    @UseGuards(JwtAuthGuard)
    @Post('asignacion')
    async crearAsignacion(@Body() body: any) {
        return this.fctService.crearAsignacion(body);
    }

    /** GET /api/fct/asignaciones — Lista todas las asignaciones FCT */
    @UseGuards(JwtAuthGuard)
    @Get('asignaciones')
    async listarAsignaciones() {
        return this.fctService.listarAsignaciones();
    }

    /** PATCH /api/fct/asignacion/:id/estado — Actualizar estado */
    @UseGuards(JwtAuthGuard)
    @Patch('asignacion/:id/estado')
    async actualizarEstado(@Param('id') id: string, @Body() body: { estado: string }) {
        return this.fctService.actualizarEstadoAsignacion(Number(id), body.estado);
    }
}
