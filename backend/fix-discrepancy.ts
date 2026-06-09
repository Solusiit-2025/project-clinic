import { PrismaClient } from '@prisma/client';
import { syncAllInventoryToLedger } from './src/services/inventoryLedger.service';

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { name: { contains: 'Yasfina' } } });
  if (!clinic) return;

  const stocks = await prisma.inventoryStock.findMany({ include: { product: true } });
  const muts = await prisma.inventoryMutation.findMany({ include: { product: true } });
  
  const mutGroups: any = {};
  for (const m of muts) {
    const key = m.productId + '_' + (m.batchId || 'null');
    if (!mutGroups[key]) mutGroups[key] = { qty: 0 };
    if (m.type === 'OPENING_BALANCE' || m.type === 'IN' || m.type === 'PURCHASE') {
      mutGroups[key].qty += m.quantity;
    } else if (m.type === 'OUT' || m.type === 'SALE' || m.type === 'USAGE' || m.type === 'EXPIRED') {
      mutGroups[key].qty -= m.quantity;
    } else if (m.type === 'ADJUSTMENT') {
      mutGroups[key].qty += m.quantity;
    }
  }

  for (const key in mutGroups) {
    const [pid, bid] = key.split('_');
    const stock = stocks.find(s => s.productId === pid && (s.batchId || 'null') === bid);
    const stockQty = stock ? stock.onHandQty : 0;
    const mutQty = mutGroups[key].qty;
    
    if (Math.abs(stockQty - mutQty) > 0.001) {
      const diffQty = stockQty - mutQty; // + if stock > mut, - if stock < mut
      
      const product = await prisma.product.findUnique({ where: { id: pid }, include: { branchPrices: { where: { branchId: clinic.id } }, masterProduct: true } });
      if (!product) continue;

      let unitCost = stock?.unitCost || product.purchasePrice || product.masterProduct?.purchasePrice || 0;
      if (!unitCost && product.branchPrices?.length > 0) {
         unitCost = product.branchPrices[0].purchasePrice || 0;
      }
      
      console.log(`Adjusting ${product.productName} by ${diffQty} (Stock: ${stockQty}, Mut: ${mutQty}) unitCost: ${unitCost}`);
      
      const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      await prisma.inventoryMutation.create({
        data: {
          branchId: clinic.id,
          productId: pid,
          batchId: bid === 'null' ? null : bid,
          type: 'ADJUSTMENT',
          quantity: diffQty, // can be negative, adjustment type accepts it logically
          unitCost: unitCost,
          sellingPrice: product.sellingPrice || 0,
          notes: 'Auto-adjustment to reconcile physical stock with ledger',
          userId: user?.id || 'system'
        }
      });
    }
  }

  console.log("Deleting old journals...");
  await prisma.journalEntry.deleteMany({
    where: {
      OR: [
        { referenceNo: { startsWith: 'INV-MUT-' } },
        { referenceNo: { startsWith: 'OPENING-' } }
      ],
      entryType: 'SYSTEM'
    }
  });

  console.log("Resyncing mutations to ledger...");
  const retroResult = await syncAllInventoryToLedger();
  console.log("Retro Result:", retroResult);
}

main().catch(console.error).finally(() => prisma.$disconnect());
