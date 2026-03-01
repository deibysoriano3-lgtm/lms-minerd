# LMS MINERD - Sistema de Gestión Escolar

Este proyecto es una plataforma de gestión académica para el MINERD, diseñada para politécnicos en la República Dominicana.

## Estructura del Proyecto

- **lms-minerd-backend**: Servidor NestJS con Prisma ORM (SQLite).
- **lms-minerd-frontend**: Cliente React con Vite y Tailwind CSS.

## Características

- Gestión de Estudiantes y Expedientes.
- Control de Calificaciones (Académicas y Módulos Técnicos/RAs).
- Boletín de Calificaciones oficial MINERD.
- Portales para Docentes y Tutores FCT.

## Instrucciones de Instalación

1. Clonar el repositorio.
2. En `lms-minerd-backend`: `npm install`, `npx prisma migrate dev`, `npm run start:dev`.
3. En `lms-minerd-frontend`: `npm install`, `npm run dev`.
