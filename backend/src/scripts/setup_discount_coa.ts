import { prisma } from '../lib/prisma';

async function main() {
  const parentId = 'fa4cb4a6-fba2-46d9-bb23-e7d6f890685f'; // PENDAPATAN MEDIS
  
  // 1. Create COA for Discount (Global)
  let discountCoa = await prisma.chartOfAccount.findFirst({
    where: { code: '4-1199' }
  });

  if (!discountCoa) {
    discountCoa = await prisma.chartOfAccount.create({
      data: {
        code: '4-1199',
        name: 'Potongan Penjualan / Diskon',
        category: 'REVENUE',
        accountType: 'DETAIL',
        parentId,
        isActive: true
      }
    });
    console.log('Created Discount COA');
  }

  // 2. Map to System Account 'SALES_DISCOUNT'
  const sysAcc = await prisma.systemAccount.findFirst({
    where: { key: 'SALES_DISCOUNT' }
  });

  if (sysAcc) {
    await prisma.systemAccount.update({
      where: { id: sysAcc.id },
      data: { coaId: discountCoa.id }
    });
    console.log('Updated System Account SALES_DISCOUNT');
  } else {
    await prisma.systemAccount.create({
      data: {
        key: 'SALES_DISCOUNT',
        name: 'Potongan / Diskon Penjualan',
        coaId: discountCoa.id
      }
    });
    console.log('Created System Account SALES_DISCOUNT');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
