-- CreateTable
CREATE TABLE "FamiliaPerfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "parentesco" TEXT NOT NULL DEFAULT 'TUTOR',
    CONSTRAINT "FamiliaPerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamiliaPerfil_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "EstudiantePerfil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoordinadorPerfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "cedula" TEXT NOT NULL,
    "departamento" TEXT NOT NULL DEFAULT 'Coordinación Académica',
    "estado_laboral" TEXT NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "CoordinadorPerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SicologoPerfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "cedula" TEXT NOT NULL,
    "estado_laboral" TEXT NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT "SicologoPerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FamiliaPerfil_usuario_id_key" ON "FamiliaPerfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinadorPerfil_usuario_id_key" ON "CoordinadorPerfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinadorPerfil_cedula_key" ON "CoordinadorPerfil"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "SicologoPerfil_usuario_id_key" ON "SicologoPerfil"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "SicologoPerfil_cedula_key" ON "SicologoPerfil"("cedula");
