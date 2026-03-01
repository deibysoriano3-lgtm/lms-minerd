import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocentesModule } from './modules/docentes/docentes.module';
import { AuthModule } from './modules/auth/auth.module';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module';
import { MatriculaModule } from './modules/matricula/matricula.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { EvaluacionesModule } from './modules/evaluaciones/evaluaciones.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';

@Module({
  imports: [DocentesModule, AuthModule, EstudiantesModule, MatriculaModule, ReportesModule, EvaluacionesModule, CurriculumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
