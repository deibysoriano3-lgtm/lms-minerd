import { Module } from '@nestjs/common';
import { DisciplinaController } from './disciplina.controller';
import { DisciplinaService } from './disciplina.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [DisciplinaController],
    providers: [DisciplinaService, PrismaService],
})
export class DisciplinaModule {}
