import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/evaluaciones')
export class EvaluacionesController {
    constructor(private readonly evaluacionesService: EvaluacionesService) { }

    @Get('mis-cargas')
    async getMisCargas(@Request() req) {
        return this.evaluacionesService.getCargaAcademicaDocente(req.user.userId);
    }

    @Get('estudiantes/:seccion_id/:clase_id/:tipo')
    async getEstudiantesMatriculados(@Param('seccion_id') seccion_id: string, @Param('clase_id') clase_id: string, @Param('tipo') tipo: 'MODULO' | 'ASIGNATURA') {
        return this.evaluacionesService.getEstudiantesParaEvaluar(Number(seccion_id), Number(clase_id), tipo);
    }

    @Post('guardar-nota')
    async guardarNota(@Request() req, @Body() body: { estudiante_id: number, ra_id: number, valor_logrado: number, rp1?: number, rp2?: number }) {
        return this.evaluacionesService.guardarCalificacionRA(req.user.userId, body.estudiante_id, body.ra_id, body.valor_logrado, body.rp1 || 0, body.rp2 || 0);
    }

    @Post('guardar-nota-academica')
    async guardarNotaAcademica(@Request() req, @Body() body: { estudiante_id: number, asignatura_id: number, payload: any }) {
        return this.evaluacionesService.guardarCalificacionAcademica(req.user.userId, body.estudiante_id, body.asignatura_id, body.payload);
    }

    @Post('observaciones')
    async guardarObservacion(@Request() req, @Body() body: { estudiante_id: number, incidencia: string, tipo: string }) {
        return this.evaluacionesService.agregarObservacion(req.user.userId, body.estudiante_id, body.incidencia, body.tipo);
    }

    @Get('resumen/:modulo_id/:seccion_id')
    async getResumen(@Request() req, @Param('modulo_id') modulo_id: string, @Param('seccion_id') seccion_id: string) {
        return this.evaluacionesService.getResumenCarga(req.user.userId, Number(modulo_id), Number(seccion_id));
    }
}
