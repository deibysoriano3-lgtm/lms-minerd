CREATE TABLE "SicologoSeccion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "sicologo_id" INTEGER NOT NULL,
  "seccion_id" INTEGER NOT NULL,
  "asignado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SicologoSeccion_sicologo_id_fkey" FOREIGN KEY ("sicologo_id") REFERENCES "SicologoPerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SicologoSeccion_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Seccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SicologoSeccion_sicologo_id_seccion_id_key" ON "SicologoSeccion"("sicologo_id", "seccion_id");
