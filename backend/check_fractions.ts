import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const decimals = await prisma.journalDetail.findMany({
    where: {
      OR: [
        // SQLite doesn't have a floor function we can easily call in where, 
        // so we just fetch all and check in JS. This is only for debugging.
      ]
    }
  });

  // Let's just do a raw query or fetch all
  const all = await prisma.journalDetail.findMany({
    select: { id: true, debit: true, credit: true, description: true }
  });

  for (const item of all) {
    if (item.debit % 1 !== 0 || item.credit % 1 !== 0) {
      console.log(`Fractional entry: ID=${item.id}, Debit=${item.debit}, Credit=${item.credit}, Desc=${item.description}`);
    }
  }

  console.log("Finished checking fractional entries.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
