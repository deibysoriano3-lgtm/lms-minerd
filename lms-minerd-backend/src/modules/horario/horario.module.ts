import { Module } from '@nestjs/common';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [HorarioController],
    providers: [HorarioService, PrismaService],
})
export class HorarioModule {}
