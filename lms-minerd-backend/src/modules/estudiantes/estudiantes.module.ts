import { Module } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [EstudiantesController],
  providers: [EstudiantesService, PrismaService],
})
export class EstudiantesModule { }
