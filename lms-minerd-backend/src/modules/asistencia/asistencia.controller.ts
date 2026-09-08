import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/asistencia')
export class AsistenciaController {
    constructor(private readonly asistenciaService: AsistenciaService) {}

    @Post()
    registrar(@Request() req, @Body() body: any) {
        return this.asistenciaService.registrar(req.user.userId, body);
    }

    @Get('seccion/:id')
    getPorSeccionFecha(@Param('id') id: string, @Query('fecha') fecha: string) {
        return this.asistenciaService.getPorSeccionFecha(Number(id), fecha);
    }

    @Get('estudiante/:id')
    getHistorialEstudiante(@Param('id') id: string) {
        return this.asistenciaService.getHistorialEstudiante(Number(id));
    }

    @Get('resumen/seccion/:id')
    getResumenSeccion(@Param('id') id: string) {
        return this.asistenciaService.getResumenSeccion(Number(id));
    }

    @Get('riesgo')
    getEstudiantesEnRiesgo() {
        return this.asistenciaService.getEstudiantesEnRiesgo();
    }

    @Get('mi-asistencia')
    getMiAsistencia(@Request() req) {
        return this.asistenciaService.getMiAsistencia(req.user.userId);
    }
}
