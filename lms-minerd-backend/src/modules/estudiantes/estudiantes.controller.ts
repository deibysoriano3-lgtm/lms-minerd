import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
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

    @Get('plantilla')
    async descargarPlantilla(@Res() res: Response) {
        const buffer = await this.estudiantesService.generarPlantillaExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_estudiantes.xlsx');
        res.send(Buffer.from(buffer as ArrayBuffer));
    }

    @Post('importar')
    @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage() }))
    async importar(@UploadedFile() file: any) {
        return this.estudiantesService.importarDesdeExcel(file);
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

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.estudiantesService.update(Number(id), body);
    }

    @Patch(':id/estado')
    cambiarEstado(@Param('id') id: string, @Body() body: { estado_academico: string }) {
        return this.estudiantesService.cambiarEstado(Number(id), body.estado_academico);
    }
}
