CREATE TABLE "RegistroDisciplina" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "estudiante_id" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'LEVE',
  "descripcion" TEXT NOT NULL,
  "sancion" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
  "fecha_incidente" DATETIME NOT NULL,
  "fecha_notif_padre" DATETIME,
  "resolucion" TEXT,
  "registrado_por" INTEGER NOT NULL,
  "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistroDisciplina_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
