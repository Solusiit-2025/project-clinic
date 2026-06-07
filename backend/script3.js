const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const p = await prisma.product.findFirst({
        where: { masterProduct: { medicineId: 'c6d07eef-081a-48e3-a0ef-e780ef7a7a0d' } }
    });
    console.log(p);
}
main().finally(() => prisma.$disconnect());
