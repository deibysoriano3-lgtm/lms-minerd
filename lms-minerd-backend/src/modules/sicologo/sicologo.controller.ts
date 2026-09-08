import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SicologoService } from './sicologo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/sicologo')
export class SicologoController {
    constructor(private readonly sicologoService: SicologoService) {}

    @Get('mi-perfil')
    getMiPerfil(@Request() req) {
        return this.sicologoService.getMiPerfil(req.user.userId);
    }

    @Get('mis-secciones')
    getMisSecciones(@Request() req) {
        return this.sicologoService.getMisSecciones(req.user.userId);
    }

    @Get('anecdotas')
    getAnecdotas() {
        return this.sicologoService.getAnecdotas();
    }

    @Post('anecdotas')
    crearAnecdota(@Request() req, @Body() body: { estudiante_id: number; incidencia: string; tipo: string }) {
        return this.sicologoService.crearAnecdota(req.user.userId, body);
    }

    @Get('estudiantes')
    getEstudiantes(@Request() req) {
        return this.sicologoService.getEstudiantes(req.user.userId);
    }

    @Get('lista')
    listarSicologos(@Request() req) {
        if (req.user.rol !== 'ADMIN') throw new ForbiddenException();
        return this.sicologoService.listarSicologos();
    }

    @Post('crear')
    crearSicologo(@Request() req, @Body() body: any) {
        if (req.user.rol !== 'ADMIN') throw new ForbiddenException();
        return this.sicologoService.crearSicologo(body);
    }

    @Get(':id/secciones')
    getSecciones(@Request() req, @Param('id') id: string) {
        if (req.user.rol !== 'ADMIN') throw new ForbiddenException();
        return this.sicologoService.getSecciones(Number(id));
    }

    @Post(':id/secciones')
    asignarSecciones(@Request() req, @Param('id') id: string, @Body() body: { seccion_ids: number[] }) {
        if (req.user.rol !== 'ADMIN') throw new ForbiddenException();
        return this.sicologoService.asignarSecciones(Number(id), body.seccion_ids);
    }

    @Delete(':id/secciones/:seccion_id')
    quitarSeccion(@Request() req, @Param('id') id: string, @Param('seccion_id') seccion_id: string) {
        if (req.user.rol !== 'ADMIN') throw new ForbiddenException();
        return this.sicologoService.quitarSeccion(Number(id), Number(seccion_id));
    }
}
