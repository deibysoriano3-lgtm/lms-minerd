-- CreateTable
CREATE TABLE "RegistroAsistencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estudiante_id" INTEGER NOT NULL,
    "seccion_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PRESENTE',
    "observacion" TEXT,
    "docente_id" INTEGER NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAsistencia_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroAsistencia_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegistroAsistencia_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistroAsistencia_estudiante_id_seccion_id_fecha_key" ON "RegistroAsistencia"("estudiante_id", "seccion_id", "fecha");
