import { Module } from '@nestjs/common';
import { FctController } from './fct.controller';
import { FctService } from './fct.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [FctController],
    providers: [FctService, PrismaService],
})
export class FctModule { }
