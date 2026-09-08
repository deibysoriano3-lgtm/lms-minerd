import { Module } from '@nestjs/common';
import { SicologoController } from './sicologo.controller';
import { SicologoService } from './sicologo.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [SicologoController],
    providers: [SicologoService, PrismaService],
})
export class SicologoModule {}
