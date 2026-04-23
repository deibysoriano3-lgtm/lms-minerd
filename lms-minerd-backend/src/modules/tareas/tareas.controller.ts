import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TareasService } from './tareas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/tareas')
export class TareasController {
    constructor(private readonly tareasService: TareasService) { }

    @Get('mis-tareas')
    getMisTareas(@Request() req) {
        return this.tareasService.getMisTareas(req.user.userId);
    }

    @Get('seccion/:seccion_id')
    getTareasPorSeccion(@Param('seccion_id') seccion_id: string) {
        return this.tareasService.getTareasPorSeccion(Number(seccion_id));
    }

    @Post()
    crearTarea(@Request() req, @Body() body: {
        titulo: string;
        descripcion: string;
        instrucciones?: string;
        tipo: string;
        fecha_entrega: string;
        seccion_id: number;
        carga_id?: number;
    }) {
        return this.tareasService.crearTarea(req.user.userId, body);
    }

    @Patch(':id/fecha-entrega')
    actualizarFecha(@Request() req, @Param('id') id: string, @Body() body: { fecha_entrega: string }) {
        return this.tareasService.actualizarFechaEntrega(req.user.userId, Number(id), body.fecha_entrega);
    }

    @Patch(':id')
    actualizarTarea(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.tareasService.actualizarTarea(req.user.userId, Number(id), body);
    }

    @Delete(':id')
    eliminarTarea(@Request() req, @Param('id') id: string) {
        return this.tareasService.eliminarTarea(req.user.userId, Number(id));
    }
}
