CREATE TABLE "EventoCalendario" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "titulo" TEXT NOT NULL,
  "descripcion" TEXT,
  "fecha_inicio" DATETIME NOT NULL,
  "fecha_fin" DATETIME,
  "tipo" TEXT NOT NULL DEFAULT 'EVENTO',
  "color" TEXT NOT NULL DEFAULT 'indigo',
  "es_global" BOOLEAN NOT NULL DEFAULT 1,
  "seccion_id" INTEGER,
  "periodo_id" INTEGER,
  "creado_por" INTEGER NOT NULL,
  "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
