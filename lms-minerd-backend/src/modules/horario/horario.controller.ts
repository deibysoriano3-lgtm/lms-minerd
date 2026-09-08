import { Controller, Get, Post, Delete, Body, Param, Query, Request, UseGuards, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HorarioService } from './horario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/horario')
export class HorarioController {
    constructor(private readonly horarioService: HorarioService) {}

    // ── Horario personal ────────────────────────────────────────────────────
    @Get('mi-horario')
    getMiHorario(@Request() req) {
        return this.horarioService.getMiHorario(req.user.userId, req.user.rol);
    }

    // ── Cargas con horario (admin) ──────────────────────────────────────────
    @Get('cargas')
    getCargasConHorario(@Query('seccion_id') seccion_id?: string) {
        return this.horarioService.getCargasConHorario(seccion_id ? Number(seccion_id) : undefined);
    }

    @Get('cargas/:carga_id/slots')
    getSlots(@Param('carga_id', ParseIntPipe) carga_id: number) {
        return this.horarioService.getHorariosCarga(carga_id);
    }

    @Post('cargas/:carga_id/slots')
    agregarSlot(
        @Param('carga_id', ParseIntPipe) carga_id: number,
        @Body() body: { dia: string; hora_inicio: string; hora_fin: string; aula?: string },
    ) {
        return this.horarioService.agregarSlot(carga_id, body);
    }

    @Delete('slots/:id')
    eliminarSlot(@Param('id', ParseIntPipe) id: number) {
        return this.horarioService.eliminarSlot(id);
    }

    // ── Documentos ──────────────────────────────────────────────────────────
    @Get('documentos')
    listarDocumentos() {
        return this.horarioService.listarDocumentos();
    }

    @Post('documentos')
    @UseInterceptors(FileInterceptor('archivo', {
        storage: diskStorage({
            destination: './uploads/horarios',
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
                cb(null, unique);
            },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
            cb(null, allowed.includes(file.mimetype));
        },
    }))
    subirDocumento(@Request() req, @UploadedFile() archivo: Express.Multer.File, @Body() body: any) {
        return this.horarioService.guardarDocumento(req.user.userId, archivo, body);
    }

    @Delete('documentos/:id')
    eliminarDocumento(@Param('id', ParseIntPipe) id: number) {
        return this.horarioService.eliminarDocumento(id);
    }
}
