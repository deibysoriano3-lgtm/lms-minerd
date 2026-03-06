import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/estudiantes')
export class EstudiantesController {
    constructor(private readonly estudiantesService: EstudiantesService) { }

    @Get()
    findAll() {
        return this.estudiantesService.findAll();
    }

    @Get('mi-perfil')
    async getMiPerfil(@Request() req: any) {
        return this.estudiantesService.getMiPerfil(req.user.userId);
    }

    @Get(':id/expediente')
    async getExpediente(@Param('id') id: string) {
        return this.estudiantesService.getExpedienteCompleto(Number(id));
    }

    @Get(':id/boletin')
    async getBoletin(@Param('id') id: string) {
        return this.estudiantesService.getBoletinData(Number(id));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.estudiantesService.findOne(+id);
    }

    @Post()
    create(@Body() createVariables: any) {
        return this.estudiantesService.create(createVariables);
    }
}
