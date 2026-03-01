-- =========================================================================
-- Esquema de Base de Datos (Módulos Avanzados) - LMS MINERD
-- Extensiones para FCT, Planes de Mejora, SIGERD y SSO
-- =========================================================================

-- 1. ACTUALIZACIONES A TABLA USUARIO (SSO y SIGERD)
-- (En un escenario real se haría un ALTER TABLE, pero lo mostramos conceptualmente)
ALTER TABLE USUARIO ADD COLUMN minerd_email VARCHAR(150) UNIQUE; -- Ej: 1234@educacion.minerd.gob.do
ALTER TABLE USUARIO ADD COLUMN azure_ad_id VARCHAR(255) UNIQUE; -- Para cruzar con Entra ID (Office 365)
-- El password_hash se volvería opcional al usar SSO.

-- 2. MÓDULO DE FORMACIÓN EN CENTROS DE TRABAJO (FCT)
CREATE TABLE EMPRESA_FCT (
    id SERIAL PRIMARY KEY,
    rnc VARCHAR(20) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    sector_economico VARCHAR(100),
    direccion TEXT,
    estado_convenio VARCHAR(50) DEFAULT 'Activo' -- MINERD debe tener convenios activos
);

CREATE TABLE TUTOR_EMPRESARIAL (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES EMPRESA_FCT(id),
    nombre_completo VARCHAR(150) NOT NULL,
    cargo VARCHAR(100),
    email_contacto VARCHAR(150) NOT NULL,
    telefono VARCHAR(20)
);

CREATE TABLE ASIGNACION_FCT (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES USUARIO(id),
    empresa_id INTEGER NOT NULL REFERENCES EMPRESA_FCT(id),
    tutor_id INTEGER NOT NULL REFERENCES TUTOR_EMPRESARIAL(id),
    docente_supervisor_id INTEGER NOT NULL REFERENCES USUARIO(id), -- El maestro del politécnico responsable
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    horas_completadas INTEGER DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'En Curso' -- Ej: 'Completado', 'Suspendido'
);

CREATE TABLE EVALUACION_FCT (
    id SERIAL PRIMARY KEY,
    asignacion_id INTEGER NOT NULL REFERENCES ASIGNACION_FCT(id),
    nota_minerd nota_minerd_tipo NOT NULL, -- Logrado, En Proceso, Iniciado
    comentarios_tutor TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MÓDULO DE PLAN DE MEJORA PEDAGÓGICA
CREATE TABLE PLAN_MEJORA (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES USUARIO(id),
    actividad_original_id INTEGER NOT NULL REFERENCES ACTIVIDAD_EVALUACION(id),
    docente_id INTEGER NOT NULL REFERENCES USUARIO(id),
    motivo_creacion TEXT NOT NULL, -- Justificación obligatoria inicial
    estrategia_pedagogica TEXT NOT NULL, -- ¿Qué se hará? (Ej. Tutoría, nueva asignación guiada)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Abierto' -- 'Abierto', 'Cerrado'
);

CREATE TABLE EVIDENCIA_MEJORA (
    id SERIAL PRIMARY KEY,
    plan_mejora_id INTEGER NOT NULL REFERENCES PLAN_MEJORA(id) ON DELETE CASCADE,
    url_archivo_s3 VARCHAR(500), -- Prueba de que el estudiante hizo el plan
    comentario_docente TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESTRICCIÓN LÓGICA (Simulada por Triggers o en el Backend):
-- No se puede insertar una CALIFICACION_COMPETENCIA = 'Logrado' para un RA 
-- si el estudiante tiene una nota anterior de 'Iniciado'/'En Proceso' en ese mismo RA,
-- A MENOS QUE exista un PLAN_MEJORA con estado 'Cerrado' vinculado a ese RA.
