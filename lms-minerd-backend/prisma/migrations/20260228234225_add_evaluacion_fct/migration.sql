/*
  Warnings:

  - You are about to drop the `Calificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evaluacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Calificacion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Evaluacion";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CalificacionRA" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "ra_id" INTEGER NOT NULL,
    "valor_logrado" INTEGER NOT NULL,
    "rp1" INTEGER DEFAULT 0,
    "rp2" INTEGER DEFAULT 0,
    "fecha_evaluacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docente_id" INTEGER NOT NULL,
    CONSTRAINT "CalificacionRA_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CalificacionRA_ra_id_fkey" FOREIGN KEY ("ra_id") REFERENCES "ResultadoAprendizaje" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalificacionRA_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAnecdotico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "incidencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OBSERVACION',
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAnecdotico_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroAnecdotico_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AsignaturaAcademica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "grado_sugerido" TEXT,
    "docente_id" INTEGER
);

-- CreateTable
CREATE TABLE "CalificacionAcademica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "asignatura_id" INTEGER NOT NULL,
    "p1" INTEGER DEFAULT 0,
    "p2" INTEGER DEFAULT 0,
    "p3" INTEGER DEFAULT 0,
    "p4" INTEGER DEFAULT 0,
    "rp1" INTEGER DEFAULT 0,
    "rp2" INTEGER DEFAULT 0,
    "rp3" INTEGER DEFAULT 0,
    "rp4" INTEGER DEFAULT 0,
    "cpc" INTEGER DEFAULT 0,
    "cpex" INTEGER DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'CURSANDO',
    "docente_id" INTEGER NOT NULL,
    CONSTRAINT "CalificacionAcademica_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CalificacionAcademica_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalificacionAcademica_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "AsignaturaAcademica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluacionFCT" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "tutor_empresa" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "horas_reportadas" INTEGER NOT NULL,
    "criterios" TEXT NOT NULL,
    "comentarios" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADO',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluacionFCT_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResultadoAprendizaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo_id" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "valor_maximo" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResultadoAprendizaje_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "ModuloFormativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResultadoAprendizaje" ("descripcion", "id", "modulo_id", "numero") SELECT "descripcion", "id", "modulo_id", "numero" FROM "ResultadoAprendizaje";
DROP TABLE "ResultadoAprendizaje";
ALTER TABLE "new_ResultadoAprendizaje" RENAME TO "ResultadoAprendizaje";
CREATE UNIQUE INDEX "ResultadoAprendizaje_modulo_id_numero_key" ON "ResultadoAprendizaje"("modulo_id", "numero");
CREATE TABLE "new_CargaAcademica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "periodo_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "modulo_formativo_id" INTEGER,
    "asignatura_academica_id" INTEGER,
    "seccion_id" INTEGER NOT NULL,
    "horas_teoricas" INTEGER NOT NULL DEFAULT 0,
    "horas_practicas" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CargaAcademica_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_modulo_formativo_id_fkey" FOREIGN KEY ("modulo_formativo_id") REFERENCES "ModuloFormativo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_asignatura_academica_id_fkey" FOREIGN KEY ("asignatura_academica_id") REFERENCES "AsignaturaAcademica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CargaAcademica_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "PeriodoAcademico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CargaAcademica" ("docente_id", "horas_practicas", "horas_teoricas", "id", "modulo_formativo_id", "periodo_id", "seccion_id") SELECT "docente_id", "horas_practicas", "horas_teoricas", "id", "modulo_formativo_id", "periodo_id", "seccion_id" FROM "CargaAcademica";
DROP TABLE "CargaAcademica";
ALTER TABLE "new_CargaAcademica" RENAME TO "CargaAcademica";
CREATE UNIQUE INDEX "CargaAcademica_periodo_id_modulo_formativo_id_seccion_id_key" ON "CargaAcademica"("periodo_id", "modulo_formativo_id", "seccion_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionRA_estudiante_id_ra_id_key" ON "CalificacionRA"("estudiante_id", "ra_id");

-- CreateIndex
CREATE UNIQUE INDEX "AsignaturaAcademica_codigo_key" ON "AsignaturaAcademica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionAcademica_estudiante_id_asignatura_id_key" ON "CalificacionAcademica"("estudiante_id", "asignatura_id");
