const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    await prisma.moduloFormativo.update({ where: { id: 2 }, data: { nombre: 'Matemática Financiera' } });
    await prisma.moduloFormativo.update({ where: { id: 3 }, data: { nombre: 'Soporte Técnico a Usuarios' } });
    const data = await prisma.moduloFormativo.findMany();
    console.log(data);
}
run().catch(console.error).finally(() => prisma.$disconnect());
