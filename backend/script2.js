const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const rxs = await prisma.prescriptionItem.findMany({
        where: { isRacikan: true },
        include: { components: true }
    });
    console.log(JSON.stringify(rxs.slice(-2), null, 2));
}
main().finally(() => prisma.$disconnect());
