import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportesService {
    constructor(private prisma: PrismaService) { }

    async generarSabanaExcel(seccion_id: number) {
        // 1. Consultar estudiantes en la sección dada
        const matriculas = await this.prisma.matriculaEstudiante.findMany({
            where: { seccion_id },
            include: {
                estudiante: {
                    include: { usuario: true }
                }
            }
        });

        if (matriculas.length === 0) {
            throw new NotFoundException('No se encontraron estudiantes para la Sábana en esta sección.');
        }

        // 2. Traer la sección y carrera asociada
        const seccionDB = await this.prisma.seccion.findUnique({
            where: { id: seccion_id },
            include: { carrera: true }
        });

        // 3. Crear Estructura del Libro de Excel (Sábana de Calificación)
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Politécnico Prof. Rosario Rojas de Contreras';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Sábana de Calificaciones', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }, // Formato Legal, Horizontal
        });

        // --- DISEÑO DE LA PLANTILLA OFICIAL ---
        // Cabecera Institucional
        sheet.mergeCells('A1:G1');
        sheet.getCell('A1').value = 'MINISTERIO DE EDUCACIÓN - Distrito Educativo 17-02 Monte Plata';
        sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.mergeCells('A2:G2');
        sheet.getCell('A2').value = 'SÁBANA DE CALIFICACIONES DE MÓDULOS FORMATIVOS (TÉCNICO PROFESIONAL)';
        sheet.getCell('A2').font = { name: 'Arial', size: 12, bold: true };
        sheet.getCell('A2').alignment = { horizontal: 'center' };

        sheet.mergeCells('A3:G3');
        sheet.getCell('A3').value = `Centro Educativo: Politécnico Prof. Rosario Rojas de Contreras | Año Escolar: 2025-2026`;
        sheet.getCell('A3').font = { name: 'Arial', size: 11, italic: true };
        sheet.getCell('A3').alignment = { horizontal: 'center' };

        sheet.addRow([]); // Espacio en blanco

        // Metadatos de la Sección
        sheet.addRow(['Familia Profesional:', 'Informática y Comunicaciones', '', 'Especialidad (Título):', seccionDB?.carrera.nombre]);
        sheet.addRow(['Grado y Sección:', `${seccionDB?.grado} ${seccionDB?.nombre}`]);
        sheet.addRow([]); // Espacio en blanco

        // Filas de Cabecera de la Tabla
        const encabFila1 = sheet.addRow(['No.', 'RNE', 'Nombres y Apellidos del Estudiante', 'RAs EVALUADOS', 'PUNTOS ALCANZADOS', '% ACUMULADO', 'CONDICIÓN FINAL']);

        // Estilizar cabecera de la tabla
        encabFila1.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' } // Gris claro
            };
            cell.font = { bold: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Ajuste de anchos
        sheet.getColumn(1).width = 5;  // No
        sheet.getColumn(2).width = 20; // RNE
        sheet.getColumn(3).width = 40; // Nombres
        sheet.getColumn(4).width = 15; // Total RAs
        sheet.getColumn(5).width = 15; // Logrados
        sheet.getColumn(6).width = 15; // Porcentaje
        sheet.getColumn(7).width = 20; // Condicion

        // 4. Inserción de Estudiantes (Sumatoria Real Prisma)
        let index = 0;
        for (const matricula of matriculas) {
            const calificaciones = await this.prisma.calificacionRA.findMany({
                where: { estudiante_id: matricula.estudiante_id }
            });

            const rasEvaluados = calificaciones.length;
            const totalPuntos = calificaciones.reduce((acc, c) => acc + c.valor_logrado, 0);
            let condicion = totalPuntos >= 70 ? 'APROBADO' : 'AL PLAN DE MEJORA';

            const filaDatos = sheet.addRow([
                index + 1,
                matricula.estudiante.rne,
                matricula.estudiante.usuario.nombre_completo,
                rasEvaluados,
                totalPuntos,
                `${totalPuntos}%`,
                condicion
            ]);

            filaDatos.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
                if (colNumber >= 4) cell.alignment = { horizontal: 'center' };

                // Coloreo Condicional
                if (colNumber === 7 && condicion === 'APROBADO') {
                    cell.font = { color: { argb: 'FF00B050' }, bold: true }; // Verde
                } else if (colNumber === 7) {
                    cell.font = { color: { argb: 'FFFF0000' }, bold: true }; // Rojo
                }
            });
            index++;
        }

        // 5. Entregar Archivo al Cliente (Firmas Requeridas)
        sheet.addRow([]);
        sheet.addRow([]);
        sheet.addRow(['', '_______________________________', '', '', '_______________________________']);
        sheet.addRow(['', 'Firma del Docente Módulo Técnico', '', '', 'Firma y Sello del Director/a']);
        const buffer = await workbook.xlsx.writeBuffer();

        return new StreamableFile(Buffer.from(buffer));
    }
}
