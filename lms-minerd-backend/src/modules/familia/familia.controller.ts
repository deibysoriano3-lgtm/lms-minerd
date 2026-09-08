import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FamiliaService } from './familia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/familia')
export class FamiliaController {
    constructor(private readonly familiaService: FamiliaService) {}

    @Get('mi-perfil')
    getMiPerfil(@Request() req) {
        return this.familiaService.getMiPerfil(req.user.userId);
    }
}
