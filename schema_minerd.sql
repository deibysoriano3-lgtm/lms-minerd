-- =========================================================================
-- Esquema de Base de Datos - LMS Modalidad Técnico Profesional MINERD
-- Motor Recomendado: PostgreSQL
-- =========================================================================

-- 1. ENUMERADORES (Tipos de datos personalizados)
CREATE TYPE user_rol AS ENUM ('Estudiante', 'Docente', 'Coordinador', 'Admin');
CREATE TYPE contenido_tipo AS ENUM ('PDF', 'Video', 'Simulador');
CREATE TYPE actividad_tipo AS ENUM ('Foro', 'Práctica Taller', 'Examen');
CREATE TYPE nota_minerd_tipo AS ENUM ('Logrado', 'En Proceso', 'Iniciado');

-- 2. TABLAS BASE DE USUARIOS
CREATE TABLE USUARIO (
    id SERIAL PRIMARY KEY,
    sigerd_id VARCHAR(50) UNIQUE, -- ID cruzado con el MINERD central
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol user_rol NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ESTRUCTURA ACADÉMICA (Ministerio de Educación)
CREATE TABLE FAMILIA_PROFESIONAL (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE, -- Ej: 'Informática y Comunicaciones'
    descripcion TEXT
);

CREATE TABLE TITULO_TECNICO (
    id SERIAL PRIMARY KEY,
    familia_id INTEGER NOT NULL REFERENCES FAMILIA_PROFESIONAL(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL, -- Ej: 'Desarrollo y Administración de Aplicaciones Informáticas'
    nivel VARCHAR(50) DEFAULT 'Secundaria Técnico Profesional'
);

CREATE TABLE GRADO (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Ej: '4to', '5to', '6to'
    nivel VARCHAR(50) DEFAULT 'Secundaria'
);

CREATE TABLE SECCION (
    id SERIAL PRIMARY KEY,
    grado_id INTEGER NOT NULL REFERENCES GRADO(id),
    titulo_id INTEGER NOT NULL REFERENCES TITULO_TECNICO(id),
    docente_titular_id INTEGER REFERENCES USUARIO(id),
    nombre VARCHAR(50) NOT NULL, -- Ej: '4to A - Informática'
    anio_escolar VARCHAR(20) NOT NULL -- Ej: '2024-2025'
);

-- Relación de estudiantes a secciones (Matriculación)
CREATE TABLE ESTUDIANTE_SECCION (
    estudiante_id INTEGER REFERENCES USUARIO(id) ON DELETE CASCADE,
    seccion_id INTEGER REFERENCES SECCION(id) ON DELETE CASCADE,
    PRIMARY KEY (estudiante_id, seccion_id)
);

-- 4. ESTRUCTURA CURRICULAR TÉCNICO PROFESIONAL
CREATE TABLE MODULO_FORMATIVO (
    id SERIAL PRIMARY KEY,
    titulo_id INTEGER NOT NULL REFERENCES TITULO_TECNICO(id),
    grado_id INTEGER NOT NULL REFERENCES GRADO(id),
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ej: 'MF082_3'
    nombre VARCHAR(200) NOT NULL,
    horas_totales INTEGER NOT NULL,
    docente_id INTEGER REFERENCES USUARIO(id) -- Docente encargado del módulo
);

CREATE TABLE RESULTADO_APRENDIZAJE (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES MODULO_FORMATIVO(id) ON DELETE CASCADE,
    numero VARCHAR(10) NOT NULL, -- Ej: 'RA1', 'RA2'
    descripcion TEXT NOT NULL,
    UNIQUE(modulo_id, numero) -- No puede haber dos RA1 en el mismo modulo
);

-- 5. CONTENIDOS Y EVALUACIONES (LMS Core)
CREATE TABLE CONTENIDO_DIGITAL (
    id SERIAL PRIMARY KEY,
    ra_id INTEGER NOT NULL REFERENCES RESULTADO_APRENDIZAJE(id) ON DELETE CASCADE,
    tipo contenido_tipo NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    url_s3 VARCHAR(500) NOT NULL, -- Ruta a Amazon S3 o CloudFront
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ACTIVIDAD_EVALUACION (
    id SERIAL PRIMARY KEY,
    ra_id INTEGER NOT NULL REFERENCES RESULTADO_APRENDIZAJE(id) ON DELETE CASCADE,
    tipo actividad_tipo NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    ponderacion DECIMAL(5,2), -- Opcional: Si el MINERD decide usar un peso dentro del RA
    fecha_limite TIMESTAMP
);

-- 6. CALIFICACIONES Y TRAZABILIDAD REGISTRO
CREATE TABLE CALIFICACION_COMPETENCIA (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES USUARIO(id),
    actividad_id INTEGER NOT NULL REFERENCES ACTIVIDAD_EVALUACION(id),
    nota_minerd nota_minerd_tipo NOT NULL, -- El core de la evaluación: Logrado, En Proceso, Iniciado
    valor_numerico DECIMAL(5,2), -- Apoyo interno o histórico opcional (ej: de 0 a 100 del taller)
    comentario_docente TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluador_id INTEGER NOT NULL REFERENCES USUARIO(id) -- Quién puso la nota (Auditoría)
);

-- Índices recomendados por rendimiento para consultas de los coordinadores
CREATE INDEX idx_calificacion_estudiante ON CALIFICACION_COMPETENCIA(estudiante_id);
CREATE INDEX idx_calificacion_actividad ON CALIFICACION_COMPETENCIA(actividad_id);
CREATE INDEX idx_usuario_sigerd ON USUARIO(sigerd_id);
