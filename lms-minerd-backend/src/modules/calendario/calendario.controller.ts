import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarioService } from './calendario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/calendario')
export class CalendarioController {
    constructor(private readonly calendarioService: CalendarioService) {}

    @Get('eventos')
    listar(@Query('mes') mes: string, @Query('anio') anio: string, @Query('seccion_id') seccion_id: string) {
        return this.calendarioService.listar(
            mes ? Number(mes) : undefined,
            anio ? Number(anio) : undefined,
            seccion_id ? Number(seccion_id) : undefined,
        );
    }

    @Post('eventos')
    crear(@Request() req, @Body() body: any) {
        return this.calendarioService.crear(req.user.userId, body);
    }

    @Put('eventos/:id')
    actualizar(@Param('id') id: string, @Request() req, @Body() body: any) {
        return this.calendarioService.actualizar(Number(id), req.user.userId, req.user.rol, body);
    }

    @Delete('eventos/:id')
    eliminar(@Param('id') id: string, @Request() req) {
        return this.calendarioService.eliminar(Number(id), req.user.userId, req.user.rol);
    }
}
