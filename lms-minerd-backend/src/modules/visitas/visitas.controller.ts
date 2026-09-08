import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VisitasService } from './visitas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/visitas')
export class VisitasController {
    constructor(private readonly visitasService: VisitasService) {}

    @Post()
    registrar(@Request() req, @Body() body: any) {
        return this.visitasService.registrar(req.user.userId, body);
    }

    @Get()
    listar() {
        return this.visitasService.listar();
    }

    @Get('estudiante/:id')
    listarPorEstudiante(@Param('id') id: string) {
        return this.visitasService.listarPorEstudiante(Number(id));
    }
}
