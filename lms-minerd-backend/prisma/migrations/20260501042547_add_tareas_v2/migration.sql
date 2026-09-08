-- CreateTable
CREATE TABLE "Tarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "instrucciones" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'TAREA',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "fecha_asignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" DATETIME NOT NULL,
    "seccion_id" INTEGER NOT NULL,
    "carga_id" INTEGER,
    "docente_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "permite_entrega" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "Tarea_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_carga_id_fkey" FOREIGN KEY ("carga_id") REFERENCES "CargaAcademica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntregaTarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tarea_id" INTEGER NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "fecha_entrega" DATETIME,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntregaTarea_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "Tarea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntregaTarea_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EntregaTarea_tarea_id_estudiante_id_key" ON "EntregaTarea"("tarea_id", "estudiante_id");
