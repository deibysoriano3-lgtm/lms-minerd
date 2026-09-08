import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EstudiantesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.estudiantePerfil.findMany({
            include: {
                usuario: true,
                carrera_actual: true,
                matriculas: {
                    include: { seccion: true, periodo: true }
                }
            },
        });
    }

    async findOne(id: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id },
            include: {
                usuario: true,
                carrera_actual: true,
                tutores: true,
            },
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado');
        return estudiante;
    }

    async create(data: any) {
        const { email, password, nombre_completo, rne, fecha_nacimiento, telefono_contacto, carrera_id } = data;
        const hash = await bcrypt.hash(password || '123456', 10); // Clave por defecto si no se provée

        return this.prisma.usuario.create({
            data: {
                email,
                password_hash: hash,
                nombre_completo,
                rol: 'ESTUDIANTE',
                perfilEstudiante: {
                    create: {
                        rne,
                        fecha_nacimiento: new Date(fecha_nacimiento),
                        telefono_contacto,
                        carrera_actual_id: carrera_id ? Number(carrera_id) : null
                    }
                }
            },
            include: {
                perfilEstudiante: true
            }
        });
    }

    async getExpedienteCompleto(estudianteId: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id: estudianteId },
            include: {
                usuario: {
                    select: { nombre_completo: true, email: true }
                },
                carrera_actual: true,
                tutores: true,
                anecdotas: {
                    orderBy: { fecha_registro: 'desc' },
                    include: {
                        docente: {
                            include: { usuario: { select: { nombre_completo: true } } }
                        }
                    }
                },
                calificaciones_ra: {
                    include: {
                        resultado_aprendizaje: {
                            include: {
                                modulo: true
                            }
                        }
                    }
                }
            }
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado');
        return estudiante;
    }

    async getMiPerfil(usuarioId: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { usuario_id: usuarioId },
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                carrera_actual: { include: { familia: true } },
                tutores: true,
                matriculas: {
                    orderBy: { fecha_inscripcion: 'desc' },
                    take: 1,
                    include: { seccion: true, periodo: true }
                },
                calificaciones_ra: {
                    include: {
                        resultado_aprendizaje: {
                            include: { modulo: true }
                        }
                    }
                },
                calificaciones_acad: {
                    include: { asignatura: true }
                },
                anecdotas: {
                    orderBy: { fecha_registro: 'desc' },
                    include: {
                        docente: {
                            include: { usuario: { select: { nombre_completo: true } } }
                        }
                    }
                },
                evaluaciones_fct: {
                    orderBy: { creado_en: 'desc' },
                    take: 1
                }
            }
        });

        if (!estudiante) throw new NotFoundException('Perfil de estudiante no encontrado');
        return estudiante;
    }

    async update(id: number, data: any) {
        const { nombre_completo, email, rne, carrera_id } = data;
        const perfil = await this.prisma.estudiantePerfil.findUnique({ where: { id } });
        if (!perfil) throw new NotFoundException('Estudiante no encontrado');

        await this.prisma.usuario.update({
            where: { id: perfil.usuario_id },
            data: { nombre_completo, email }
        });

        return this.prisma.estudiantePerfil.update({
            where: { id },
            data: {
                rne,
                carrera_actual_id: carrera_id ? Number(carrera_id) : null,
            },
            include: { usuario: true, carrera_actual: true }
        });
    }

    async cambiarEstado(id: number, estado_academico: string) {
        return this.prisma.estudiantePerfil.update({
            where: { id },
            data: { estado_academico: estado_academico as any }
        });
    }

    async generarPlantillaExcel(): Promise<ExcelJS.Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Estudiantes');

        sheet.columns = [
            { header: 'nombre_completo',   key: 'nombre_completo',   width: 38 },
            { header: 'email',             key: 'email',             width: 36 },
            { header: 'rne',               key: 'rne',               width: 22 },
            { header: 'fecha_nacimiento',  key: 'fecha_nacimiento',  width: 18 },
            { header: 'telefono_contacto', key: 'telefono_contacto', width: 20 },
            { header: 'password',          key: 'password',          width: 18 },
            { header: 'carrera_id',        key: 'carrera_id',        width: 12 },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FF6366F1' } } };
        });

        // Fila de ejemplo
        sheet.addRow({
            nombre_completo:   'María Elena López Santana',
            email:             'mlopez@est.minerd.gob.do',
            rne:               'M-LOP-09-02-0001',
            fecha_nacimiento:  '2009-02-15',
            telefono_contacto: '809-555-0001',
            password:          'Minerd2025!',
            carrera_id:        '',
        });

        // Fila de instrucciones
        const notaRow = sheet.addRow({
            nombre_completo:   '← Requerido',
            email:             '← Requerido · debe ser único',
            rne:               '← Requerido · debe ser único',
            fecha_nacimiento:  '← AAAA-MM-DD',
            telefono_contacto: '← Opcional',
            password:          '← Default: Minerd2025!',
            carrera_id:        '← ID numérico (opcional)',
        });
        notaRow.font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } };

        return workbook.xlsx.writeBuffer();
    }

    async importarDesdeExcel(file: any): Promise<{ exitosos: number; errores: Array<{ fila: number; nombre: string; error: string }> }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const sheet = workbook.worksheets[0];
        let exitosos = 0;
        const errores: Array<{ fila: number; nombre: string; error: string }> = [];

        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);

            const nombre_completo   = row.getCell(1).value?.toString().trim() ?? '';
            const email             = row.getCell(2).value?.toString().trim() ?? '';
            const rne               = row.getCell(3).value?.toString().trim() ?? '';
            const fechaVal          = row.getCell(4).value;
            const telefono_contacto = row.getCell(5).value?.toString().trim() || null;
            const password          = row.getCell(6).value?.toString().trim() || 'Minerd2025!';
            const carrera_id        = row.getCell(7).value ? Number(row.getCell(7).value) : null;

            // Saltar filas vacías o de instrucciones
            if (!nombre_completo || nombre_completo.startsWith('←') || !email || !rne || !fechaVal) continue;

            // Normalizar fecha (Excel puede devolver Date o string)
            const fecha_nacimiento = fechaVal instanceof Date
                ? fechaVal.toISOString().split('T')[0]
                : fechaVal.toString().trim();

            try {
                await this.create({ nombre_completo, email, rne, fecha_nacimiento, telefono_contacto, password, carrera_id });
                exitosos++;
            } catch (err: any) {
                const msg = err?.message ?? '';
                errores.push({
                    fila: i,
                    nombre: nombre_completo,
                    error: msg.includes('Unique constraint') ? 'RNE o Email ya registrado' : 'Error al crear registro',
                });
            }
        }

        return { exitosos, errores };
    }

    async getBoletinData(estudianteId: number) {
        const estudiante = await this.prisma.estudiantePerfil.findUnique({
            where: { id: estudianteId },
            include: {
                usuario: { select: { nombre_completo: true, email: true } },
                carrera_actual: {
                    include: { familia: true }
                },
                tutores: {
                    where: { es_tutor_principal: true },
                    take: 1
                },
                matriculas: {
                    orderBy: { fecha_inscripcion: 'desc' },
                    take: 1,
                    include: {
                        seccion: true,
                        periodo: true
                    }
                },
                // Calificaciones académicas (asignaturas P1-P4)
                calificaciones_acad: {
                    include: {
                        asignatura: true
                    }
                },
                // Calificaciones RA (módulos formativos técnicos)
                calificaciones_ra: {
                    include: {
                        resultado_aprendizaje: {
                            include: {
                                modulo: true
                            }
                        }
                    }
                }
            }
        });

        if (!estudiante) throw new NotFoundException('Estudiante no encontrado para el boletín');
        return estudiante;
    }
}
