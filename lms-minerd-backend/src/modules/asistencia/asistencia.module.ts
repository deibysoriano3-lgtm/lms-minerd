import { Module } from '@nestjs/common';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [AsistenciaController],
    providers: [AsistenciaService, PrismaService],
})
export class AsistenciaModule {}
