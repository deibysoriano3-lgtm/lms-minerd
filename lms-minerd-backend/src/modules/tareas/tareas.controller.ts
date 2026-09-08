import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TareasService } from './tareas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/tareas')
export class TareasController {
    constructor(private readonly tareasService: TareasService) {}

    @Get('mis-tareas')
    getMisTareas(@Request() req: any) {
        return this.tareasService.getMisTareas(req.user.userId);
    }

    @Get('seccion/:seccion_id')
    getTareasPorSeccion(@Param('seccion_id') seccion_id: string, @Request() req: any) {
        return this.tareasService.getTareasPorSeccion(Number(seccion_id), req.user.userId);
    }

    @Post()
    crearTarea(@Request() req: any, @Body() body: any) {
        return this.tareasService.crearTarea(req.user.userId, body);
    }

    @Patch(':id')
    actualizarTarea(@Param('id') id: string, @Request() req: any, @Body() body: any) {
        return this.tareasService.actualizarTarea(req.user.userId, Number(id), body);
    }

    @Patch(':id/estado')
    actualizarEstado(@Param('id') id: string, @Request() req: any, @Body() body: { estado: string }) {
        return this.tareasService.actualizarEstado(req.user.userId, Number(id), body.estado);
    }

    @Delete(':id')
    eliminarTarea(@Param('id') id: string, @Request() req: any) {
        return this.tareasService.eliminarTarea(req.user.userId, Number(id));
    }

    @Get(':tarea_id/entregas')
    getEntregas(@Param('tarea_id') tarea_id: string, @Request() req: any) {
        return this.tareasService.getEntregasPorTarea(req.user.userId, Number(tarea_id));
    }

    @Post(':tarea_id/entregas')
    crearEntrega(@Param('tarea_id') tarea_id: string, @Request() req: any, @Body() body: any) {
        return this.tareasService.crearOActualizarEntrega(req.user.userId, Number(tarea_id), body);
    }

    @Patch(':tarea_id/entregas/:entrega_id')
    revisarEntrega(@Param('tarea_id') tarea_id: string, @Param('entrega_id') entrega_id: string, @Request() req: any) {
        return this.tareasService.revisarEntrega(req.user.userId, Number(tarea_id), Number(entrega_id));
    }
}
