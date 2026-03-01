import { Module } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [CurriculumService, PrismaService],
  controllers: [CurriculumController]
})
export class CurriculumModule { }
