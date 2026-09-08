import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/docentes')
export class DocentesController {
    constructor(private readonly docentesService: DocentesService) { }

    @Get()
    async findAll() {
        return this.docentesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.docentesService.findOne(+id);
    }

    @Post()
    async create(@Body() createVariables: any) {
        return this.docentesService.create(createVariables);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: { especialidad_tecnica?: string; grado_academico?: string; nombre_completo?: string }) {
        return this.docentesService.update(+id, body);
    }

    @Patch(':id/estado')
    async updateEstado(@Param('id') id: string, @Body() body: { estado_laboral: string }) {
        return this.docentesService.updateEstado(+id, body.estado_laboral);
    }

    @Post(':id/cargas')
    async asignarCarga(
        @Param('id') id: string,
        @Body() body: { periodo_id: number; seccion_id: number; modulo_formativo_id?: number; asignatura_academica_id?: number }
    ) {
        return this.docentesService.asignarCarga(+id, body);
    }

    @Delete('cargas/:carga_id')
    async eliminarCarga(@Param('carga_id') carga_id: string) {
        return this.docentesService.eliminarCarga(+carga_id);
    }
}
