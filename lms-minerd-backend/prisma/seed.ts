import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Catálogo oficial ETP-MINERD ────────────────────────────────────────────
const catalogoETP: {
    familia: { nombre: string; descripcion: string };
    carreras: { codigo: string; nombre: string; duracion: number }[];
}[] = [
    {
        familia: { nombre: 'Salud y Bienestar', descripcion: 'SABI — Enfermería, farmacia, veterinaria, emergencias y atención sociosanitaria. Ord. 05-2025' },
        carreras: [
            { codigo: 'SABI-01', nombre: 'Técnico Básico en Asistencia en Farmacia',                              duracion: 2 },
            { codigo: 'SABI-02', nombre: 'Técnico Básico en Asistencia en Veterinaria',                           duracion: 2 },
            { codigo: 'SABI-03', nombre: 'Bachiller Técnico en Atención a Emergencias de Salud',                  duracion: 3 },
            { codigo: 'SABI-04', nombre: 'Bachiller Técnico en Atención Sociosanitaria a Personas Dependientes',  duracion: 3 },
            { codigo: 'SABI-05', nombre: 'Bachiller Técnico en Cuidados de Enfermería',                           duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Hostelería y Turismo', descripcion: 'HOYT — Alojamiento, gastronomía, panadería, viajes y animación turística. Ord. 06-2025' },
        carreras: [
            { codigo: 'HOYT-01', nombre: 'Técnico Básico en Servicios Auxiliares en Alojamientos Turísticos',    duracion: 2 },
            { codigo: 'HOYT-02', nombre: 'Técnico Básico en Operaciones Auxiliares de Alimentos y Bebidas',      duracion: 2 },
            { codigo: 'HOYT-03', nombre: 'Bachiller Técnico en Servicios de Alojamiento',                        duracion: 3 },
            { codigo: 'HOYT-04', nombre: 'Bachiller Técnico en Producción en Panadería y Pastelería',            duracion: 3 },
            { codigo: 'HOYT-05', nombre: 'Bachiller Técnico en Preparación y Servicio de Alimentos y Bebidas',   duracion: 3 },
            { codigo: 'HOYT-06', nombre: 'Bachiller Técnico en Servicios de Viajes y Eventos',                   duracion: 3 },
            { codigo: 'HOYT-07', nombre: 'Bachiller Técnico en Animación Turística',                             duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Informática y Comunicaciones', descripcion: 'INCO — Aplicaciones, redes, infraestructura, datos, domótica y DevOps. Ord. 07-2025' },
        carreras: [
            { codigo: 'INCO-01', nombre: 'Técnico Básico en Sistemas Microinformáticos y Gestor de Contenidos Web',            duracion: 2 },
            { codigo: 'INCO-02', nombre: 'Bachiller Técnico en Diseño y Desarrollo de Aplicaciones Informáticas',              duracion: 3 },
            { codigo: 'INCO-03', nombre: 'Bachiller Técnico en Gestión de Infraestructura de Redes y Sistemas Informáticos',   duracion: 3 },
            { codigo: 'INCO-04', nombre: 'Bachiller Técnico en Servicios de Datos y Domóticos',                                duracion: 3 },
            { codigo: 'INCO-05', nombre: 'Bachiller Técnico en Programación y Gestión de Aplicaciones Informáticas',           duracion: 3 },
            { codigo: 'INCO-06', nombre: 'Bachiller Técnico en Operaciones en Entornos de Desarrollo de Aplicaciones (DevOps)', duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Construcción y Minería', descripcion: 'COMI — Obras viales, maquinaria, proyectos, albañilería y fontanería. Ord. 08-2025' },
        carreras: [
            { codigo: 'COMI-01', nombre: 'Técnico Básico en Operaciones Auxiliares de Construcción',                         duracion: 2 },
            { codigo: 'COMI-02', nombre: 'Bachiller Técnico en Operaciones de Obras Viales y con Máquinas de Construcción',   duracion: 3 },
            { codigo: 'COMI-03', nombre: 'Bachiller Técnico en Representación y Desarrollo de Proyectos de Construcción',    duracion: 3 },
            { codigo: 'COMI-04', nombre: 'Bachiller Técnico en Albañilería, Acabados y Montajes de Andamios',                duracion: 3 },
            { codigo: 'COMI-05', nombre: 'Bachiller Técnico en Fontanería',                                                  duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Agropecuaria', descripcion: 'AGPE — Agricultura, ganadería, jardinería, acuicultura e industria forestal. Ord. 09-2025' },
        carreras: [
            { codigo: 'AGPE-01', nombre: 'Técnico Básico en Actividades Auxiliares en Agricultura y Jardinería',                                      duracion: 2 },
            { codigo: 'AGPE-02', nombre: 'Técnico Básico en Actividades Auxiliares en Ganadería',                                                     duracion: 2 },
            { codigo: 'AGPE-03', nombre: 'Técnico Básico en Actividades Auxiliares en la Producción Acuícola y Pesca',                                duracion: 2 },
            { codigo: 'AGPE-04', nombre: 'Técnico Básico en Actividades Auxiliares en Conservación de Ecosistemas e Industria Forestal',              duracion: 2 },
            { codigo: 'AGPE-05', nombre: 'Bachiller Técnico en Producción Agropecuaria',                                                              duracion: 3 },
            { codigo: 'AGPE-06', nombre: 'Bachiller Técnico en Instalación y Mantenimiento de Jardines',                                              duracion: 3 },
            { codigo: 'AGPE-07', nombre: 'Bachiller Técnico en Producción Acuícola y Pesca',                                                          duracion: 3 },
            { codigo: 'AGPE-08', nombre: 'Bachiller Técnico en Operaciones de Conservación del Medio Natural y de la Industria Forestal',             duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Marítimo-Pesquera', descripcion: 'MAP — Acuicultura y mantenimiento naval. Ord. 08-2017' },
        carreras: [
            { codigo: 'MAP012', nombre: 'Bachiller Técnico en Acuicultura',        duracion: 3 },
            { codigo: 'MAP035', nombre: 'Bachiller Técnico en Mantenimiento Naval', duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Industrias Alimentarias y Químicas', descripcion: 'IAQ — Industrias alimentarias y análisis químico-farmacéutico. Ord. 09-2017' },
        carreras: [
            { codigo: 'IAQ013', nombre: 'Bachiller Técnico en Industrias Alimentarias',                  duracion: 3 },
            { codigo: 'IAQ014', nombre: 'Bachiller Técnico en Análisis y Procesos Químico-Farmacéutico', duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Servicios Socioculturales y a la Comunidad', descripcion: 'SSC — Atención sociosanitaria, educación infantil e integración comunitaria. Ord. 10-2017' },
        carreras: [
            { codigo: 'SSC016', nombre: 'Bachiller Técnico en Atención Sociosanitaria a Persona Dependiente', duracion: 3 },
            { codigo: 'SSC017', nombre: 'Bachiller Técnico en Educación y Atención Infantil Especial',         duracion: 3 },
            { codigo: 'SSC018', nombre: 'Bachiller Técnico en Servicios de Integración Comunitaria',           duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Imagen Personal', descripcion: 'IMP — Peluquería y estética. Ord. 11-2017' },
        carreras: [
            { codigo: 'IMP020', nombre: 'Bachiller Técnico en Peluquería', duracion: 3 },
            { codigo: 'IMP021', nombre: 'Bachiller Técnico en Estética',   duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Fabricación, Instalación y Mantenimiento', descripcion: 'FIM — Mecanizado, metálicas, electromecánica, mantenimiento aeronáutico y automotriz. Ord. 13-2017' },
        carreras: [
            { codigo: 'FIM027', nombre: 'Bachiller Técnico en Mecanizado',                         duracion: 3 },
            { codigo: 'FIM028', nombre: 'Bachiller Técnico en Construcciones Metálicas',           duracion: 3 },
            { codigo: 'FIM029', nombre: 'Técnico Básico en Carpintería Metálica y de PVC',        duracion: 2 },
            { codigo: 'FIM030', nombre: 'Bachiller Técnico en Montaje y Mantenimiento Mecánico',  duracion: 3 },
            { codigo: 'FIM031', nombre: 'Técnico Básico en Fontanería',                           duracion: 2 },
            { codigo: 'FIM032', nombre: 'Bachiller Técnico en Electromecánica de Vehículos',      duracion: 3 },
            { codigo: 'FIM033', nombre: 'Técnico Básico en Carrocería de Vehículos',              duracion: 2 },
            { codigo: 'FIM034', nombre: 'Bachiller Técnico en Mantenimiento de Aeronaves',        duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Administración y Comercio', descripcion: 'AYC — Comercio, logística, gestión administrativa, actividades comerciales y administrativas. Ord. 14-2017' },
        carreras: [
            { codigo: 'AYC036', nombre: 'Bachiller Técnico en Comercio y Mercadeo',               duracion: 3 },
            { codigo: 'AYC037', nombre: 'Bachiller Técnico en Logística y Transporte',            duracion: 3 },
            { codigo: 'AYC038', nombre: 'Bachiller Técnico en Gestión Administrativa y Tributaria', duracion: 3 },
            { codigo: 'AYC039', nombre: 'Técnico Básico en Actividades Comerciales',              duracion: 2 },
            { codigo: 'AYC040', nombre: 'Técnico Básico en Actividades Administrativas',          duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Textil, Confección y Piel', descripcion: 'TCP — Confección, patronaje, calzado, marroquinería y tapizado. Ord. 15-2017' },
        carreras: [
            { codigo: 'TCP041', nombre: 'Bachiller Técnico en Confección y Patronaje',                          duracion: 3 },
            { codigo: 'TCP042', nombre: 'Bachiller Técnico en Producción, Patronaje, Calzado y Marroquinería',  duracion: 3 },
            { codigo: 'TCP043', nombre: 'Técnico Básico en Confección de Vestuario',                            duracion: 2 },
            { codigo: 'TCP044', nombre: 'Técnico Básico en Tapizado y Confección para Decoración',             duracion: 2 },
            { codigo: 'TCP045', nombre: 'Técnico Básico en Calzado y Artículos de Marroquinería',              duracion: 2 },
            { codigo: 'TCP046', nombre: 'Técnico Básico en Ennoblecimiento de Tejidos de Punto por Trama',     duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Madera y Mueble', descripcion: 'MAM — Muebles y estructuras de madera, ebanistería y carpintería. Ord. 16-2017' },
        carreras: [
            { codigo: 'MAM047', nombre: 'Bachiller Técnico en Muebles y Estructuras de Madera', duracion: 3 },
            { codigo: 'MAM048', nombre: 'Técnico Básico en Ebanistería y Carpintería',          duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Electricidad y Electrónica', descripcion: 'ELE — Instalaciones, electrónica, refrigeración, energías renovables, mecatrónica y telecomunicaciones. Ord. 17-2017' },
        carreras: [
            { codigo: 'ELE049', nombre: 'Bachiller Técnico en Instalaciones Eléctricas',              duracion: 3 },
            { codigo: 'ELE050', nombre: 'Bachiller Técnico en Equipos Electrónicos',                  duracion: 3 },
            { codigo: 'ELE051', nombre: 'Bachiller Técnico en Refrigeración y Acondicionamiento de Aire', duracion: 3 },
            { codigo: 'ELE052', nombre: 'Bachiller Técnico en Energías Renovables',                   duracion: 3 },
            { codigo: 'ELE053', nombre: 'Bachiller Técnico en Sistemas de Telecomunicaciones',         duracion: 3 },
            { codigo: 'ELE054', nombre: 'Bachiller Técnico en Equipos Electromédicos',                duracion: 3 },
            { codigo: 'ELE055', nombre: 'Bachiller Técnico en Mecatrónica',                           duracion: 3 },
            { codigo: 'ELE056', nombre: 'Técnico Básico en Refrigeración e Instalaciones Eléctricas', duracion: 2 },
            { codigo: 'ELE057', nombre: 'Técnico Básico en Telecomunicaciones',                       duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Actividades Físicas y Deportivas', descripcion: 'AFD — Animación físico-deportiva, acondicionamiento físico e iniciación deportiva. Ord. 19-2017' },
        carreras: [
            { codigo: 'AFD064', nombre: 'Bachiller Técnico en Animación Físico-Deportiva y Socorrismo',           duracion: 3 },
            { codigo: 'AFD065', nombre: 'Bachiller Técnico en Acondicionamiento Físico y Entrenamiento Deportivo', duracion: 3 },
            { codigo: 'AFD066', nombre: 'Técnico Básico en Iniciación Deportiva y Recreativa',                     duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Audiovisuales y Gráficas', descripcion: 'AVG — Producción audiovisual, cámara, iluminación, sonido, multimedia y procesos gráficos. Ord. 20-2017' },
        carreras: [
            { codigo: 'AVG067', nombre: 'Bachiller Técnico en Producción y Realización de Audiovisuales y Espectáculo', duracion: 3 },
            { codigo: 'AVG068', nombre: 'Bachiller Técnico en Cámara, Iluminación y Sonido',                            duracion: 3 },
            { codigo: 'AVG069', nombre: 'Bachiller Técnico en Multimedia y Gráfica',                                    duracion: 3 },
            { codigo: 'AVG070', nombre: 'Bachiller Técnico en Procesos Gráficos',                                       duracion: 3 },
            { codigo: 'AVG071', nombre: 'Técnico Básico en Operaciones Gráficas',                                       duracion: 2 },
        ],
    },
    {
        familia: { nombre: 'Seguridad y Medio Ambiente', descripcion: 'SEA — Control ambiental, conservación, prevención de riesgos y seguridad ciudadana. Ord. 21-2017' },
        carreras: [
            { codigo: 'SEA072', nombre: 'Bachiller Técnico en Control de Procesos Ambientales',    duracion: 3 },
            { codigo: 'SEA073', nombre: 'Bachiller Técnico en Conservación y Protección Ambiental', duracion: 3 },
            { codigo: 'SEA074', nombre: 'Bachiller Técnico en Prevención de Riesgos Laborales',    duracion: 3 },
            { codigo: 'SEA075', nombre: 'Bachiller Técnico en Seguridad y Protección Ciudadana',   duracion: 3 },
        ],
    },
    {
        familia: { nombre: 'Transporte y Logística', descripcion: 'TRA — Transporte terrestre, movilidad, seguridad vial y educación vial. Ord. 07-2024' },
        carreras: [
            { codigo: 'TRA077', nombre: 'Bachiller Técnico en Servicios de Transporte Terrestre', duracion: 3 },
            { codigo: 'TRA079', nombre: 'Bachiller Técnico en Movilidad y Seguridad Vial',        duracion: 3 },
            { codigo: 'TRA080', nombre: 'Bachiller Técnico en Formación y Educación Vial',        duracion: 3 },
        ],
    },
];

async function main() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.SEED_MODE === 'production';

    // ── Admin ──────────────────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@minerd.gob.do';
    const adminPassword = process.env.ADMIN_PASSWORD ?? (isProd ? null : '123456');

    if (!adminPassword) {
        console.error('❌ ADMIN_PASSWORD es requerido en producción. Configura la variable de entorno.');
        process.exit(1);
    }

    const adminNombre = process.env.ADMIN_NOMBRE ?? 'Administrador del Sistema';
    const adminHash = await bcrypt.hash(adminPassword, 12);

    await prisma.usuario.upsert({
        where: { email: adminEmail },
        update: { password_hash: adminHash, nombre_completo: adminNombre },
        create: { email: adminEmail, password_hash: adminHash, nombre_completo: adminNombre, rol: 'ADMIN' },
    });

    console.log(`✅ Admin: ${adminEmail}`);

    // ── Catálogo ETP-MINERD ────────────────────────────────────────────────
    let totalCarreras = 0;
    for (const entry of catalogoETP) {
        const familia = await prisma.familiaProfesional.upsert({
            where: { nombre: entry.familia.nombre },
            update: { descripcion: entry.familia.descripcion },
            create: entry.familia,
        });
        for (const c of entry.carreras) {
            await prisma.carreraTecnica.upsert({
                where: { codigo_minerd: c.codigo },
                update: { nombre: c.nombre, duracion_anios: c.duracion, familia_profesional_id: familia.id },
                create: { codigo_minerd: c.codigo, nombre: c.nombre, duracion_anios: c.duracion, familia_profesional_id: familia.id },
            });
            totalCarreras++;
        }
    }

    const nombresOficiales = catalogoETP.map(e => e.familia.nombre);
    await prisma.familiaProfesional.deleteMany({
        where: { nombre: { notIn: nombresOficiales }, carreras: { none: {} } },
    });

    console.log(`✅ Catálogo: ${catalogoETP.length} familias | ${totalCarreras} carreras`);

    // ── Asignaturas académicas oficiales MINERD ────────────────────────────
    const asignaturas = [
        { codigo: 'LE-01', nombre: 'Lengua Española',                        descripcion: 'Comunicativa' },
        { codigo: 'LI-01', nombre: 'Lengua Extranjera - Inglés',             descripcion: 'Comunicativa' },
        { codigo: 'MA-01', nombre: 'Matemáticas',                            descripcion: 'Científica y Tecnológica' },
        { codigo: 'CN-01', nombre: 'Ciencias de la Naturaleza',              descripcion: 'Científica y Tecnológica' },
        { codigo: 'CS-01', nombre: 'Ciencias Sociales',                      descripcion: 'Humanística y Social' },
        { codigo: 'EA-01', nombre: 'Educación Artística',                    descripcion: 'Humanística y Social' },
        { codigo: 'EF-01', nombre: 'Educación Física',                       descripcion: 'Desarrollo Personal y Espiritual' },
        { codigo: 'FI-01', nombre: 'Formación Integral, Humana y Religiosa', descripcion: 'Desarrollo Personal y Espiritual' },
    ];
    for (const a of asignaturas) {
        await prisma.asignaturaAcademica.upsert({ where: { codigo: a.codigo }, update: {}, create: a });
    }
    console.log(`✅ Asignaturas: ${asignaturas.length} materias académicas`);

    // ── Período académico activo ────────────────────────────────────────────
    const anio = new Date().getFullYear();
    const periodoNombre = `Año Escolar ${anio}-${anio + 1}`;
    const periodoExistente = await prisma.periodoAcademico.findFirst({ where: { es_activo: true } });
    if (!periodoExistente) {
        await prisma.periodoAcademico.create({
            data: {
                nombre: periodoNombre,
                fecha_inicio: new Date(`${anio}-08-01`),
                fecha_fin: new Date(`${anio + 1}-06-30`),
                es_activo: true,
            },
        });
        console.log(`✅ Período activo: ${periodoNombre}`);
    } else {
        console.log(`ℹ️  Período activo ya existe: ${periodoExistente.nombre}`);
    }

    // ── Usuarios demo (solo en desarrollo) ───────────────────────────────
    if (!isProd) {
        const devHash = await bcrypt.hash('123456', 10);
        const demos = [
            { email: 'coordinador@minerd.gob.do', nombre: 'Carmen Torres Reyes',         rol: 'COORDINADOR' },
            { email: 'sicologo@minerd.gob.do',    nombre: 'Rafael Díaz Ortega',           rol: 'SICOLOGO'    },
            { email: 'docente@minerd.gob.do',      nombre: 'José Ramón Peña Martínez',    rol: 'DOCENTE'     },
            { email: 'estudiante@minerd.gob.do',   nombre: 'María Elena López Santana',   rol: 'ESTUDIANTE'  },
        ];
        for (const d of demos) {
            const u = await prisma.usuario.upsert({
                where: { email: d.email },
                update: {},
                create: { email: d.email, password_hash: devHash, nombre_completo: d.nombre, rol: d.rol as any },
            });
            if (d.rol === 'COORDINADOR') {
                await prisma.coordinadorPerfil.upsert({ where: { usuario_id: u.id }, update: {}, create: { usuario_id: u.id, cedula: '001-0000001-1', departamento: 'Coordinación Académica' } });
            }
            if (d.rol === 'SICOLOGO') {
                await prisma.sicologoPerfil.upsert({ where: { usuario_id: u.id }, update: {}, create: { usuario_id: u.id, cedula: '001-0000002-2' } });
            }
            if (d.rol === 'DOCENTE') {
                await prisma.docentePerfil.upsert({ where: { usuario_id: u.id }, update: {}, create: { usuario_id: u.id, cedula: '001-0000003-3', especialidad_tecnica: 'Informática y Comunicaciones', grado_academico: 'Licenciatura en Informática' } });
            }
            if (d.rol === 'ESTUDIANTE') {
                await prisma.estudiantePerfil.upsert({ where: { usuario_id: u.id }, update: {}, create: { usuario_id: u.id, rne: 'M-TEST-01-00-0001', fecha_nacimiento: new Date('2006-03-15'), estado_academico: 'ACTIVO' } });
            }
        }
        console.log('✅ Usuarios demo (dev): docente, estudiante, coordinador, sicologo — contraseña: 123456');
    }

    console.log('\n🎓 LMS MINERD listo.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
