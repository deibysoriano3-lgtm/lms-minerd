-- ==============================================================================
-- FASE 2: ERP ESCOLAR INTEGRAL - EXTENSIÓN DE ESQUEMA CORE
-- Objetivo: Soportar la gestión completa de Estudiantes, Docentes, Carreras y Matrícula
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. GESTIÓN DE CARRERAS TÉCNICAS (Malla Curricular Base)
-- ------------------------------------------------------------------------------
CREATE TABLE erp_carrera_tecnica (
    id SERIAL PRIMARY KEY,
    codigo_minerd VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    familia_profesional_id INT REFERENCES FAMILIA_PROFESIONAL(id),
    duracion_anios INT DEFAULT 3, -- Ej: 4to, 5to, 6to (3 años)
    perfil_egreso TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA', 'EN_REVISION'))
);

-- ------------------------------------------------------------------------------
-- 2. GESTIÓN DE PERIODOS ACADÉMICOS
-- ------------------------------------------------------------------------------
CREATE TABLE erp_periodo_academico (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Ej: "Año Escolar 2025-2026"
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    es_activo BOOLEAN DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 3. EXPEDIENTE COMPLETO DEL ESTUDIANTE (Módulo 1)
-- Amplía la tabla base USUARIO
-- ------------------------------------------------------------------------------
CREATE TABLE erp_estudiante_perfil (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES USUARIO(id) ON DELETE CASCADE,
    rne VARCHAR(50) UNIQUE NOT NULL, -- Registro Nacional de Estudiantes
    acta_nacimiento_folio VARCHAR(50),
    fecha_nacimiento DATE NOT NULL,
    direccion_residencia TEXT,
    telefono_contacto VARCHAR(20),
    estado_academico VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado_academico IN ('ACTIVO', 'RETIRADO', 'EGRESADO', 'SUSPENDIDO')),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    carrera_actual_id INT REFERENCES erp_carrera_tecnica(id)
);

CREATE TABLE erp_tutor_legal (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES erp_estudiante_perfil(id) ON DELETE CASCADE,
    nombres_apellidos VARCHAR(150) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    parentesco VARCHAR(50) NOT NULL, -- Ej: Madre, Padre, Tío, Abuela
    telefono VARCHAR(20) NOT NULL,
    es_tutor_principal BOOLEAN DEFAULT true
);

-- ------------------------------------------------------------------------------
-- 4. EXPEDIENTE COMPLETO DEL DOCENTE (Módulo 4)
-- Amplía la tabla base USUARIO
-- ------------------------------------------------------------------------------
CREATE TABLE erp_docente_perfil (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES USUARIO(id) ON DELETE CASCADE,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    especialidad_tecnica VARCHAR(150),
    grado_academico VARCHAR(100), -- Ej: Ing. Sistemas, Lic. Educación
    fecha_contratacion DATE,
    estado_laboral VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado_laboral IN ('ACTIVO', 'LICENCIA', 'INACTIVO'))
);

-- ------------------------------------------------------------------------------
-- 5. MATRÍCULA Y ASIGNACIÓN DE CURSOS (Módulo 3 y 5)
-- ------------------------------------------------------------------------------
-- Relación entre Periodo, Docente, Asignatura(Módulo) y Sección
CREATE TABLE erp_carga_academica (
    id SERIAL PRIMARY KEY,
    periodo_id INT REFERENCES erp_periodo_academico(id),
    docente_id INT REFERENCES erp_docente_perfil(id),
    modulo_formativo_id INT REFERENCES MODULO_FORMATIVO(id),
    seccion_id INT REFERENCES SECCION(id),
    horas_teoricas INT DEFAULT 0,
    horas_practicas INT DEFAULT 0,
    UNIQUE(periodo_id, modulo_formativo_id, seccion_id) -- Un módulo en una sección en un periodo solo lo da 1 profesor principal
);

-- Historial de Matrícula del Estudiante
CREATE TABLE erp_matricula_estudiante (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES erp_estudiante_perfil(id),
    periodo_id INT REFERENCES erp_periodo_academico(id),
    seccion_id INT REFERENCES SECCION(id), -- Ej: 6to de Informática - Sección A
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_matricula VARCHAR(30) DEFAULT 'INSCRITO' CHECK (estado_matricula IN ('INSCRITO', 'REPROBADO', 'PROMOVIDO', 'RETIRADO')),
    UNIQUE(estudiante_id, periodo_id) -- Un estudiante no puede estar en dos secciones distintas en el mismo año escolar
);
