/*
  Warnings:

  - You are about to drop the column `p1` on the `CalificacionAcademica` table. All the data in the column will be lost.
  - You are about to drop the column `p2` on the `CalificacionAcademica` table. All the data in the column will be lost.
  - You are about to drop the column `p3` on the `CalificacionAcademica` table. All the data in the column will be lost.
  - You are about to drop the column `p4` on the `CalificacionAcademica` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalificacionAcademica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "asignatura_id" INTEGER NOT NULL,
    "com_p1" INTEGER DEFAULT 0,
    "com_p2" INTEGER DEFAULT 0,
    "com_p3" INTEGER DEFAULT 0,
    "com_p4" INTEGER DEFAULT 0,
    "cyt_p1" INTEGER DEFAULT 0,
    "cyt_p2" INTEGER DEFAULT 0,
    "cyt_p3" INTEGER DEFAULT 0,
    "cyt_p4" INTEGER DEFAULT 0,
    "hys_p1" INTEGER DEFAULT 0,
    "hys_p2" INTEGER DEFAULT 0,
    "hys_p3" INTEGER DEFAULT 0,
    "hys_p4" INTEGER DEFAULT 0,
    "dpe_p1" INTEGER DEFAULT 0,
    "dpe_p2" INTEGER DEFAULT 0,
    "dpe_p3" INTEGER DEFAULT 0,
    "dpe_p4" INTEGER DEFAULT 0,
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
INSERT INTO "new_CalificacionAcademica" ("asignatura_id", "cpc", "cpex", "docente_id", "estado", "estudiante_id", "id", "rp1", "rp2", "rp3", "rp4") SELECT "asignatura_id", "cpc", "cpex", "docente_id", "estado", "estudiante_id", "id", "rp1", "rp2", "rp3", "rp4" FROM "CalificacionAcademica";
DROP TABLE "CalificacionAcademica";
ALTER TABLE "new_CalificacionAcademica" RENAME TO "CalificacionAcademica";
CREATE UNIQUE INDEX "CalificacionAcademica_estudiante_id_asignatura_id_key" ON "CalificacionAcademica"("estudiante_id", "asignatura_id");
CREATE TABLE "new_RegistroAnecdotico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "docente_id" INTEGER,
    "incidencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OBSERVACION',
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAnecdotico_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RegistroAnecdotico_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RegistroAnecdotico" ("docente_id", "estudiante_id", "fecha_registro", "id", "incidencia", "tipo") SELECT "docente_id", "estudiante_id", "fecha_registro", "id", "incidencia", "tipo" FROM "RegistroAnecdotico";
DROP TABLE "RegistroAnecdotico";
ALTER TABLE "new_RegistroAnecdotico" RENAME TO "RegistroAnecdotico";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
