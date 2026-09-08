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
import { FamiliaModule } from './modules/familia/familia.module';
import { CoordinadorModule } from './modules/coordinador/coordinador.module';
import { SicologoModule } from './modules/sicologo/sicologo.module';
import { TareasModule } from './modules/tareas/tareas.module';
import { AsistenciaModule } from './modules/asistencia/asistencia.module';
import { VisitasModule } from './modules/visitas/visitas.module';
import { DisciplinaModule } from './modules/disciplina/disciplina.module';
import { HorarioModule } from './modules/horario/horario.module';
import { CalendarioModule } from './modules/calendario/calendario.module';

@Module({
  imports: [DocentesModule, AuthModule, EstudiantesModule, MatriculaModule, ReportesModule, EvaluacionesModule, CurriculumModule, FamiliaModule, CoordinadorModule, SicologoModule, TareasModule, AsistenciaModule, VisitasModule, DisciplinaModule, HorarioModule, CalendarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
