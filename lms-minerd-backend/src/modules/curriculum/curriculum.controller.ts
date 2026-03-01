import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/curriculum')
export class CurriculumController {
    constructor(private readonly curriculumService: CurriculumService) { }

    @Get('carreras')
    async getCarreras() {
        return this.curriculumService.getCarreras();
    }

    @Get('familias')
    async getFamilias() {
        return this.curriculumService.getFamiliasProfesionales();
    }

    @Post('carreras')
    async createCarrera(@Body() body: { codigo_minerd: string, nombre: string, familia_profesional_id: number, duracion_anios: number }) {
        return this.curriculumService.createCarrera(body);
    }

    @Post('modulos')
    async createModulo(@Body() body: { carrera_id: number, codigo: string, nombre: string, horas_totales: number }) {
        return this.curriculumService.createModulo(body);
    }

    @Get('modulos/:carreraId')
    async getModulos(@Param('carreraId') carreraId: string) {
        return this.curriculumService.getModulosPorCarrera(Number(carreraId));
    }

    @Post('modulos/:moduloId/ras')
    async updateRAs(
        @Param('moduloId') moduloId: string,
        @Body() body: { ras: { numero: string, descripcion: string, valor_maximo: number }[] }
    ) {
        return this.curriculumService.actualizarRAs(Number(moduloId), body.ras);
    }
}
