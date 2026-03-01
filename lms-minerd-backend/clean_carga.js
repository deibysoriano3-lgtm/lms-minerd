const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    await prisma.cargaAcademica.deleteMany({});
    console.log("Carga Academica limpia.");
}
run().catch(console.error).finally(() => prisma.$disconnect());
