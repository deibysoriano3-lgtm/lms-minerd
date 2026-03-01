const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const modulos = await prisma.moduloFormativo.findMany({ select: { nombre: true } });
  const carreras = await prisma.carreraTecnica.findMany({ select: { nombre: true } });
  console.log("--- MODULOS EN LA BASE DE DATOS ---");
  console.log(modulos);
  console.log("--- CARRERAS ---");
  console.log(carreras);
}
run().catch(console.error).finally(() => prisma.$disconnect());
