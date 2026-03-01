-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sigerd_id" TEXT,
    "nombre_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ESTUDIANTE',
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FamiliaProfesional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT
);

-- CreateTable
CREATE TABLE "CarreraTecnica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_minerd" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "familia_profesional_id" INTEGER NOT NULL,
    "duracion_anios" INTEGER NOT NULL DEFAULT 3,
    "perfil_egreso" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT "CarreraTecnica_familia_profesional_id_fkey" FOREIGN KEY ("familia_profesional_id") REFERENCES "FamiliaProfesional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeriodoAcademico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME NOT NULL,
    "es_activo" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "carrera_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    CONSTRAINT "Seccion_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "CarreraTecnica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstudiantePerfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "rne" TEXT NOT NULL,
    "acta_nacimiento_folio" TEXT,
    "fecha_nacimiento" DATETIME NOT NULL,
    "direccion_residencia" TEXT,
    "telefono_contacto" TEXT,
    "estado_academico" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fecha_ingreso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carrera_actual_id" INTEGER,
    CONSTRAINT "EstudiantePerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstudiantePerfil_carrera_actual_id_fkey" FOREIGN KEY ("carrera_actual_id") REFERENCES "CarreraTecnica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TutorLegal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "nombres_apellidos" TEXT NOT NULL,
    "cedula" TEXT,
    "parentesco" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "es_tutor_principal" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TutorLegal_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocentePerfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "cedula" TEXT NOT NULL,
    "especialidad_tecnica" TEXT,
    "grado_academico" TEXT,
    "fecha_contratacion" DATETIME,
    "estado_laboral" TEXT NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "DocentePerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuloFormativo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "carrera_id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horas_totales" INTEGER NOT NULL,
    "docente_id" INTEGER,
    CONSTRAINT "ModuloFormativo_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "CarreraTecnica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModuloFormativo_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultadoAprendizaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo_id" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    CONSTRAINT "ResultadoAprendizaje_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloFormativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CargaAcademica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "periodo_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "modulo_formativo_id" INTEGER NOT NULL,
    "seccion_id" INTEGER NOT NULL,
    "horas_teoricas" INTEGER NOT NULL DEFAULT 0,
    "horas_practicas" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CargaAcademica_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "PeriodoAcademico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_modulo_formativo_id_fkey" FOREIGN KEY ("modulo_formativo_id") REFERENCES "ModuloFormativo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatriculaEstudiante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "periodo_id" INTEGER NOT NULL,
    "seccion_id" INTEGER NOT NULL,
    "fecha_inscripcion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_matricula" TEXT NOT NULL DEFAULT 'INSCRITO',
    CONSTRAINT "MatriculaEstudiante_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatriculaEstudiante_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "PeriodoAcademico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatriculaEstudiante_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ra_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_limite" DATETIME,
    CONSTRAINT "Evaluacion_ra_id_fkey" FOREIGN KEY ("ra_id") REFERENCES "ResultadoAprendizaje" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "evaluacion_id" INTEGER NOT NULL,
    "nota_minerd" TEXT NOT NULL,
    "comentario_docente" TEXT,
    "fecha_evaluacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluador_id" INTEGER NOT NULL,
    CONSTRAINT "Calificacion_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Calificacion_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "Evaluacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Calificacion_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_sigerd_id_key" ON "Usuario"("sigerd_id");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FamiliaProfesional_nombre_key" ON "FamiliaProfesional"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CarreraTecnica_codigo_minerd_key" ON "CarreraTecnica"("codigo_minerd");

-- CreateIndex
CREATE UNIQUE INDEX "EstudiantePerfil_usuario_id_key" ON "EstudiantePerfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "EstudiantePerfil_rne_key" ON "EstudiantePerfil"("rne");

-- CreateIndex
CREATE UNIQUE INDEX "TutorLegal_cedula_key" ON "TutorLegal"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "DocentePerfil_usuario_id_key" ON "DocentePerfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "DocentePerfil_cedula_key" ON "DocentePerfil"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloFormativo_codigo_key" ON "ModuloFormativo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoAprendizaje_modulo_id_numero_key" ON "ResultadoAprendizaje"("modulo_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "CargaAcademica_periodo_id_modulo_formativo_id_seccion_id_key" ON "CargaAcademica"("periodo_id", "modulo_formativo_id", "seccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "MatriculaEstudiante_estudiante_id_periodo_id_key" ON "MatriculaEstudiante"("estudiante_id", "periodo_id");
