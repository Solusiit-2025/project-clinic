const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking Inventory Discrepancy ===\n");

  const clinics = await prisma.clinic.findMany();

  for (const clinic of clinics) {
    console.log(`\nClinic: ${clinic.name} (${clinic.id})`);

    // 1. Calculate Total Asset Value from Stock
    const stocks = await prisma.inventoryStock.findMany({
      where: { branchId: clinic.id, onHandQty: { gt: 0 } },
      include: {
        batch: { select: { purchasePrice: true } },
        product: { 
          select: { 
            purchasePrice: true,
            branchPrices: {
              where: { branchId: clinic.id },
              select: { purchasePrice: true }
            }
          } 
        }
      }
    });

    let totalAssetValue = 0;
    for (const s of stocks) {
      const branchPrice = s.product?.branchPrices?.[0]?.purchasePrice || 0;
      const price = s.unitCost || s.batch?.purchasePrice || branchPrice || s.product?.purchasePrice || 0;
      totalAssetValue += (s.onHandQty * price);
    }
    console.log(`- Total Asset Value (from InventoryStock): Rp ${totalAssetValue.toLocaleString('id-ID')}`);

    const inventoryAccounts = await prisma.chartOfAccount.findMany({
      where: { clinicId: clinic.id, name: { contains: 'Persediaan' }, code: { startsWith: '1-13' } }
    });

    if (!inventoryAccounts.length) {
      console.log("- No Inventory Accounts found for this clinic.");
      continue;
    }

    let totalLedgerBalance = 0;
    
    for (const acc of inventoryAccounts) {
      const journals = await prisma.journalDetail.findMany({
        where: { coaId: acc.id },
        include: { journalEntry: { select: { clinicId: true } } }
      });

      let ledgerBalance = 0;
      for (const j of journals) {
        if (j.journalEntry?.clinicId !== clinic.id) continue;
        
        if (acc.category === 'ASSET' || acc.category === 'EXPENSE') {
          ledgerBalance += j.debit - j.credit;
        } else {
          ledgerBalance += j.credit - j.debit;
        }
      }
      totalLedgerBalance += ledgerBalance;
      // console.log(`  - Account [${acc.code}] ${acc.name}: Rp ${ledgerBalance.toLocaleString('id-ID')}`);
    }

    console.log(`- Inventory Balance (from General Ledger): Rp ${totalLedgerBalance.toLocaleString('id-ID')}`);
    console.log(`- Discrepancy (Stock - Ledger): Rp ${(totalAssetValue - totalLedgerBalance).toLocaleString('id-ID')}`);
    
    // Let's also check the actual cost that was synced to the journal
    console.log(`\n  Checking Mutations vs Journals for this clinic...`);
    const mutations = await prisma.inventoryMutation.findMany({
      where: { branchId: clinic.id },
      orderBy: { createdAt: 'asc' }
    });
    
    let mutationTotal = 0;
    for(const m of mutations) {
       // if it's IN, value increases. If OUT, value decreases.
       // The ledger sync handles this based on mutation type.
       // Let's see Opening Balance
       if (m.type === 'OPENING_BALANCE') mutationTotal += (m.quantity * m.unitCost);
       if (m.type === 'IN' || m.type === 'PURCHASE') mutationTotal += (m.quantity * m.unitCost);
       if (m.type === 'OUT' || m.type === 'SALE' || m.type === 'USAGE' || m.type === 'EXPIRED') mutationTotal -= (m.quantity * m.unitCost);
       if (m.type === 'ADJUSTMENT' && m.quantity > 0) mutationTotal += (m.quantity * m.unitCost);
       if (m.type === 'ADJUSTMENT' && m.quantity < 0) mutationTotal += (m.quantity * m.unitCost); // negative qty means decrease
       
       // Transfer?
    }
    console.log(`- Estimated Balance from InventoryMutation (Sum of Qty * unitCost): Rp ${mutationTotal.toLocaleString('id-ID')}`);
  }
}

main().catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
