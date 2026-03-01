import { Module } from '@nestjs/common';
import { DocentesController } from './docentes.controller';
import { DocentesService } from './docentes.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DocentesController],
  providers: [DocentesService, PrismaService]
})
export class DocentesModule { }
