import { Module } from '@nestjs/common';
import { VisitasController } from './visitas.controller';
import { VisitasService } from './visitas.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [VisitasController],
    providers: [VisitasService, PrismaService],
})
export class VisitasModule {}
