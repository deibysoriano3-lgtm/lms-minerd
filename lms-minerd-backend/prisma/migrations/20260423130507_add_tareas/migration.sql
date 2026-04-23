-- CreateTable
CREATE TABLE "Tarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "instrucciones" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'TAREA',
    "fecha_asignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" DATETIME NOT NULL,
    "seccion_id" INTEGER NOT NULL,
    "carga_id" INTEGER,
    "docente_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tarea_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "DocentePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
