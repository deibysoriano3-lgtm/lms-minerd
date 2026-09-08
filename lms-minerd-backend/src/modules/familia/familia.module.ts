import { Module } from '@nestjs/common';
import { FamiliaController } from './familia.controller';
import { FamiliaService } from './familia.service';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [FamiliaController],
    providers: [FamiliaService, PrismaService],
})
export class FamiliaModule {}
