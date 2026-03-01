import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('123456', 10);

    // 1. Datos Institucionales (Estructura)
    const familia = await prisma.familiaProfesional.upsert({
        where: { nombre: 'Informática y Comunicaciones' },
        update: {},
        create: {
            nombre: 'Informática y Comunicaciones',
            descripcion: 'Familia Tecnológica'
        }
    });

    const carrera = await prisma.carreraTecnica.upsert({
        where: { codigo_minerd: 'INF-01' },
        update: {},
        create: {
            codigo_minerd: 'INF-01',
            nombre: 'Técnico en Desarrollo de Aplicaciones y Sistemas Informáticos',
            familia_profesional_id: familia.id
        }
    });

    // Asegurar que el periodo existe
    let periodo = await prisma.periodoAcademico.findFirst({ where: { nombre: 'Año Escolar 2025-2026' } });
    if (!periodo) {
        periodo = await prisma.periodoAcademico.create({
            data: {
                nombre: 'Año Escolar 2025-2026',
                fecha_inicio: new Date('2025-08-15'),
                fecha_fin: new Date('2026-06-30'),
                es_activo: true
            }
        });
    }

    // Asegurar que las secciones existen
    let seccionA = await prisma.seccion.findFirst({ where: { nombre: '4to A' } });
    if (!seccionA) {
        seccionA = await prisma.seccion.create({
            data: {
                carrera_id: carrera.id,
                nombre: '4to A',
                grado: '4to'
            }
        });
    }

    let seccionB = await prisma.seccion.findFirst({ where: { nombre: '4to B' } });
    if (!seccionB) {
        seccionB = await prisma.seccion.create({
            data: {
                carrera_id: carrera.id,
                nombre: '4to B',
                grado: '4to'
            }
        });
    }

    // 2. Usuarios base
    await prisma.usuario.upsert({
        where: { email: 'admin@minerd.gob.do' },
        update: {},
        create: {
            email: 'admin@minerd.gob.do',
            password_hash: hash,
            nombre_completo: 'Dirección Politécnico Rosario Rojas (17-02)',
            rol: 'ADMIN',
        },
    });

    const docenteUser = await prisma.usuario.upsert({
        where: { email: 'docente@minerd.gob.do' },
        update: {},
        create: {
            email: 'docente@minerd.gob.do',
            password_hash: hash,
            nombre_completo: 'Docente Politécnico Rosario Rojas',
            rol: 'DOCENTE',
            perfilDocente: {
                create: {
                    cedula: '402-5454545-2',
                    especialidad_tecnica: 'Desarrollo de Software',
                }
            }
        },
    });

    const docentePerfil = await prisma.docentePerfil.findUnique({ where: { usuario_id: docenteUser.id } });

    const estudianteUser = await prisma.usuario.upsert({
        where: { email: 'estudiante@minerd.gob.do' },
        update: {},
        create: {
            email: 'estudiante@minerd.gob.do',
            password_hash: hash,
            nombre_completo: 'María López (Estudiante Rosario Rojas)',
            rol: 'ESTUDIANTE',
            perfilEstudiante: {
                create: {
                    rne: 'M-LOP-09-02-0001',
                    fecha_nacimiento: new Date('2009-02-15'),
                    carrera_actual_id: carrera.id
                }
            }
        },
    });

    const estudiantePerfil = await prisma.estudiantePerfil.findUnique({ where: { usuario_id: estudianteUser.id } });

    // 3. Creación de Malla Curricular, RAs y Asignación Docente
    const modulo = await prisma.moduloFormativo.upsert({
        where: { codigo: 'MF082_3' },
        update: {},
        create: {
            carrera_id: carrera.id,
            codigo: 'MF082_3',
            nombre: 'Desarrollo de Aplicaciones en la Nube',
            horas_totales: 120,
            docente_id: docenteUser.id
        }
    });

    await prisma.resultadoAprendizaje.upsert({
        where: { modulo_id_numero: { modulo_id: modulo.id, numero: 'RA1' } },
        update: {},
        create: { modulo_id: modulo.id, numero: 'RA1', descripcion: 'Implementa servicios Cloud AWS', valor_maximo: 30 }
    });
    await prisma.resultadoAprendizaje.upsert({
        where: { modulo_id_numero: { modulo_id: modulo.id, numero: 'RA2' } },
        update: {},
        create: { modulo_id: modulo.id, numero: 'RA2', descripcion: 'Desarrolla APIs RESTful seguras', valor_maximo: 40 }
    });
    await prisma.resultadoAprendizaje.upsert({
        where: { modulo_id_numero: { modulo_id: modulo.id, numero: 'RA3' } },
        update: {},
        create: { modulo_id: modulo.id, numero: 'RA3', descripcion: 'Despliegues Continuos CI/CD', valor_maximo: 30 }
    });

    if (docentePerfil) {
        await prisma.cargaAcademica.upsert({
            where: { periodo_id_modulo_formativo_id_seccion_id: { periodo_id: periodo.id, modulo_formativo_id: modulo.id, seccion_id: seccionA.id } },
            update: {},
            create: { periodo_id: periodo.id, docente_id: docentePerfil.id, modulo_formativo_id: modulo.id, seccion_id: seccionA.id }
        });
    }

    if (estudiantePerfil) {
        await prisma.matriculaEstudiante.upsert({
            where: { estudiante_id_periodo_id: { estudiante_id: estudiantePerfil.id, periodo_id: periodo.id } },
            update: {},
            create: { estudiante_id: estudiantePerfil.id, periodo_id: periodo.id, seccion_id: seccionA.id, estado_matricula: 'INSCRITO' }
        });
    }

    // 4. Asignaturas Académicas (Bachillerato + Técnico) — área en "descripcion"
    const asignaturasOficiales = [
        // ÁREA: COMUNICATIVA
        { codigo: 'LE-01', nombre: 'Lengua Española', descripcion: 'Comunicativa' },
        { codigo: 'LI-01', nombre: 'Lengua Extranjera - Inglés', descripcion: 'Comunicativa' },
        // ÁREA: CIENTÍFICA Y TECNOLÓGICA
        { codigo: 'MA-01', nombre: 'Matemáticas', descripcion: 'Científica y Tecnológica' },
        { codigo: 'CN-01', nombre: 'Ciencias de la Naturaleza', descripcion: 'Científica y Tecnológica' },
        // ÁREA: HUMANÍSTICA Y SOCIAL
        { codigo: 'CS-01', nombre: 'Ciencias Sociales', descripcion: 'Humanística y Social' },
        { codigo: 'EA-01', nombre: 'Educación Artística', descripcion: 'Humanística y Social' },
        // ÁREA: DESARROLLO PERSONAL Y ESPIRITUAL
        { codigo: 'EF-01', nombre: 'Educación Física', descripcion: 'Desarrollo Personal y Espiritual' },
        { codigo: 'FI-01', nombre: 'Formación Integral, Humana y Religiosa', descripcion: 'Desarrollo Personal y Espiritual' },
    ];

    for (const asig of asignaturasOficiales) {
        const asignatura = await prisma.asignaturaAcademica.upsert({
            where: { codigo: asig.codigo },
            update: {},
            create: asig
        });

        // Crear CargaAcademica para el docente en esta asignatura + sección
        if (docentePerfil) {
            const existeCarga = await prisma.cargaAcademica.findFirst({
                where: { periodo_id: periodo.id, asignatura_academica_id: asignatura.id, seccion_id: seccionA.id }
            });
            if (!existeCarga) {
                await prisma.cargaAcademica.create({
                    data: { periodo_id: periodo.id, docente_id: docentePerfil.id, asignatura_academica_id: asignatura.id, seccion_id: seccionA.id }
                });
            }
        }

        // Crear CalificacionAcademica de prueba para la estudiante demo
        if (estudiantePerfil && docentePerfil) {
            await prisma.calificacionAcademica.upsert({
                where: { estudiante_id_asignatura_id: { estudiante_id: estudiantePerfil.id, asignatura_id: asignatura.id } },
                update: {},
                create: {
                    estudiante_id: estudiantePerfil.id,
                    asignatura_id: asignatura.id,
                    p1: 85, p2: 88, p3: 80, p4: 92,
                    docente_id: docentePerfil.id,
                    estado: 'CURSANDO'
                }
            });
        }
    }

    console.log('✅ Base de datos SQLite inicializada y poblada completamente (Roles y Estructura Académica).');

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
