import { Controller, Get, Param, UseGuards, Header, StreamableFile } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/reportes')
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('sabana-excel/:seccion_id')
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename="Sabana_Rosario_Rojas_17_02.xlsx"')
    async descargarSabana(@Param('seccion_id') seccion_id: string): Promise<StreamableFile> {
        const buffer = await this.reportesService.generarSabanaExcel(Number(seccion_id));
        return buffer as any; // Trick tipado
    }
}
