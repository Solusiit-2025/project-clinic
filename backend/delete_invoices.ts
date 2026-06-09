import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: {
      total: 0,
      status: "unpaid"
    }
  });

  console.log(`Found ${invoices.length} unpaid invoices with total 0.`);

  if (invoices.length > 0) {
    const res = await prisma.invoice.deleteMany({
      where: {
        total: 0,
        status: "unpaid"
      }
    });
    console.log(`Deleted ${res.count} invoices.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
