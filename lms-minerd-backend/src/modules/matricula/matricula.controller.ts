import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MatriculaService } from './matricula.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/matricula')
export class MatriculaController {
    constructor(private readonly matriculaService: MatriculaService) { }

    @Post('inscribir')
    matricular(@Body() body: { estudiante_id: number, periodo_id: number, seccion_id: number }) {
        return this.matriculaService.matricularEstudiante(body.estudiante_id, body.periodo_id, body.seccion_id);
    }

    @Get('estudiante/:id')
    getByEstudiante(@Param('id') id: string) {
        return this.matriculaService.getMatriculasPorEstudiante(Number(id));
    }

    @Get('periodos')
    getPeriodos() {
        return this.matriculaService.getPeriodosActivos();
    }

    @Get('secciones')
    getSecciones() {
        return this.matriculaService.getSeccionesDisponibles();
    }
}
