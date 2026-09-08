import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DisciplinaService } from './disciplina.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/disciplina')
export class DisciplinaController {
    constructor(private readonly disciplinaService: DisciplinaService) {}

    @Post()
    registrar(@Request() req, @Body() body: any) {
        return this.disciplinaService.registrar(req.user.userId, body);
    }

    @Get()
    listar() {
        return this.disciplinaService.listar();
    }

    @Get('estudiante/:id')
    listarPorEstudiante(@Param('id') id: string) {
        return this.disciplinaService.listarPorEstudiante(Number(id));
    }

    @Patch(':id/estado')
    actualizarEstado(@Param('id') id: string, @Body() body: { estado: string; resolucion?: string }) {
        return this.disciplinaService.actualizarEstado(Number(id), body);
    }
}
