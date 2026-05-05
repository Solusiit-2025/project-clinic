import { prisma } from '../lib/prisma';

async function main() {
  const inv = await prisma.invoice.findUnique({
    where: { invoiceNo: 'INV-20260505-0002' },
    include: { payments: true, items: true }
  });
  console.log(JSON.stringify(inv, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
