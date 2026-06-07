const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const prods = await prisma.product.findMany({ include: { masterProduct: true } });
    console.table(prods.map(p => ({
        id: p.id,
        name: p.productName,
        price: p.sellingPrice,
        medId: p.masterProduct?.medicineId
    })));
}
main().finally(() => prisma.$disconnect());
