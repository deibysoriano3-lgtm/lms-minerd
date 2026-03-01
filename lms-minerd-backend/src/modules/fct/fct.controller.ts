import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
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

    /** GET /api/fct/evaluaciones  — Admin lista todas las evaluaciones */
    @UseGuards(JwtAuthGuard)
    @Get('evaluaciones')
    async listar() {
        return this.fctService.listar();
    }
}
