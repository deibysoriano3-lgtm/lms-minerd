CREATE TABLE "HorarioCarga" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "carga_id" INTEGER NOT NULL,
  "dia" TEXT NOT NULL,
  "hora_inicio" TEXT NOT NULL,
  "hora_fin" TEXT NOT NULL,
  "aula" TEXT,
  CONSTRAINT "HorarioCarga_carga_id_fkey" FOREIGN KEY ("carga_id") REFERENCES "CargaAcademica" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DocumentoHorario" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "filename" TEXT NOT NULL,
  "tipo_mime" TEXT NOT NULL DEFAULT 'application/pdf',
  "periodo_id" INTEGER,
  "subido_por" INTEGER NOT NULL,
  "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
