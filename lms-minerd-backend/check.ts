import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("==> CargaAcademica:");
    const c = await prisma.cargaAcademica.findMany();
    console.log(c);
    console.log("==> DocentePerfil:");
    const d = await prisma.docentePerfil.findMany({ include: { usuario: true } });
    console.log(JSON.stringify(d, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
