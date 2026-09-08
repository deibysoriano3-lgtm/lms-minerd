import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CoordinadorService } from './coordinador.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/coordinador')
export class CoordinadorController {
    constructor(private readonly coordinadorService: CoordinadorService) {}

    @Get('mi-perfil')
    getMiPerfil(@Request() req) {
        return this.coordinadorService.getMiPerfil(req.user.userId);
    }

    @Get('resumen')
    getResumen() {
        return this.coordinadorService.getResumen();
    }

    @Get('estudiantes')
    getEstudiantes() {
        return this.coordinadorService.getEstudiantes();
    }

    @Get('docentes')
    getDocentes() {
        return this.coordinadorService.getDocentes();
    }
}
