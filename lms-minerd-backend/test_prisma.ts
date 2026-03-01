import { PrismaClient } from '@prisma/client';

async function main() {
    console.log('Iniciando Test Aislado de Prisma...');
    const prisma = new PrismaClient();

    try {
        console.log('Intentando conectar...');
        await prisma.$connect();
        console.log('OK. Conexión a Base de Datos (dev.db) Exitosa ✔️');
    } catch (err) {
        console.error('ERROR FATAL AL CONECTAR:');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
