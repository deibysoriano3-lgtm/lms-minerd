CREATE TABLE "VisitaPadre" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "estudiante_id" INTEGER NOT NULL,
  "fecha" DATETIME NOT NULL,
  "quien_visita" TEXT NOT NULL,
  "parentesco" TEXT NOT NULL DEFAULT 'TUTOR',
  "motivo" TEXT NOT NULL,
  "acuerdos" TEXT,
  "proxima_reunion" DATETIME,
  "registrado_por" INTEGER NOT NULL,
  "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisitaPadre_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AsignacionFCT" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "estudiante_id" INTEGER NOT NULL,
  "empresa" TEXT NOT NULL,
  "tutor_empresa_nombre" TEXT NOT NULL,
  "tutor_empresa_tel" TEXT,
  "fecha_inicio" DATETIME NOT NULL,
  "fecha_fin_esperada" DATETIME NOT NULL,
  "horas_requeridas" INTEGER NOT NULL DEFAULT 360,
  "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
  "observaciones" TEXT,
  "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AsignacionFCT_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
