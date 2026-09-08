import { Module } from '@nestjs/common';
import { CalendarioService } from './calendario.service';
import { CalendarioController } from './calendario.controller';
import { PrismaService } from '../../prisma.service';

@Module({
    providers: [CalendarioService, PrismaService],
    controllers: [CalendarioController],
})
export class CalendarioModule {}
