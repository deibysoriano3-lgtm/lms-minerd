import { Module } from '@nestjs/common';
import { CoordinadorController } from './coordinador.controller';
import { CoordinadorService } from './coordinador.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [CoordinadorController],
    providers: [CoordinadorService, PrismaService],
})
export class CoordinadorModule {}
