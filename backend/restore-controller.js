const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'inventory.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
  "import { syncInventoryToLedger } from '../services/inventoryLedger.service';",
  "import { syncInventoryToLedger, syncAllInventoryToLedger, syncOpeningBalances } from '../services/inventoryLedger.service';"
);

// 2. Fix totalAssetValue
const totalAssetTarget = `      select: { 
        onHandQty: true, 
        unitCost: true
      }
    });
    const totalAssetValue = allMatchingStocks.reduce((sum, s) => {
      return sum + (s.onHandQty * (s.unitCost || 0));
    }, 0);`;

const totalAssetReplacement = `      include: { 
        batch: { select: { purchasePrice: true } },
        product: { 
          select: { 
            purchasePrice: true,
            branchPrices: {
              where: { branchId: branchId as string },
              select: { purchasePrice: true }
            }
          } 
        }
      }
    });
    const totalAssetValue = allMatchingStocks.reduce((sum, s) => {
      const branchPrice = s.product?.branchPrices?.[0]?.purchasePrice || 0;
      const price = s.unitCost || s.batch?.purchasePrice || branchPrice || s.product?.purchasePrice || 0;
      return sum + (s.onHandQty * price);
    }, 0);`;

content = content.replace(totalAssetTarget, totalAssetReplacement);

// 3. Fix opname unitCost
const opnameTarget = `        if (existingStock) {
          await tx.inventoryStock.update({
            where: { id: existingStock.id },
            data: { onHandQty: item.physicalQty }
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              branchId: session.branchId,
              productId: item.productId,
              batchId: item.batchId || null,
              onHandQty: item.physicalQty,
            }
          });
        }`;

const opnameReplacement = `        if (existingStock) {
          await tx.inventoryStock.update({
            where: { id: existingStock.id },
            data: { 
              onHandQty: item.physicalQty,
              unitCost: item.unitPrice
            }
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              branchId: session.branchId,
              productId: item.productId,
              batchId: item.batchId || null,
              onHandQty: item.physicalQty,
              unitCost: item.unitPrice,
            }
          });
        }`;

content = content.replace(opnameTarget, opnameReplacement);

// 4. Append syncInventoryPrices (WITHOUT the sellingPrice: null error!)
const syncMethod = `
/**
 * Sync Inventory Prices (Backfill unitCost and sellingPrice)
 * and Re-sync General Ledger for inventory mutations.
 */
export const syncInventoryPrices = async (req: Request, res: Response) => {
  try {
    console.log('[SyncInventoryPrices] Starting database backfill for unitCost and sellingPrice...');
    let stockUpdatedCount = 0;
    let mutationUpdatedCount = 0;

    // 1. Sync InventoryStock
    const stocksToFix = await prisma.inventoryStock.findMany({
      where: { OR: [{ unitCost: 0 }, { sellingPrice: 0 }] },
      include: {
        batch: true,
        product: {
          include: {
            branchPrices: true,
            masterProduct: true
          }
        }
      }
    });

    for (const stock of stocksToFix) {
      let unitPrice = stock.batch?.purchasePrice || 0;
      let sellPrice = 0;

      const branchPrice = stock.product?.branchPrices?.find(bp => bp.branchId === stock.branchId);
      
      if (!unitPrice && branchPrice?.purchasePrice) unitPrice = branchPrice.purchasePrice;
      if (!unitPrice && stock.product?.purchasePrice) unitPrice = stock.product.purchasePrice;
      if (!unitPrice && stock.product?.masterProduct?.purchasePrice) unitPrice = stock.product.masterProduct.purchasePrice;

      if (branchPrice?.sellingPrice) sellPrice = branchPrice.sellingPrice;
      if (!sellPrice && stock.product?.sellingPrice) sellPrice = stock.product.sellingPrice;
      if (!sellPrice && stock.product?.masterProduct?.sellingPrice) sellPrice = stock.product.masterProduct.sellingPrice;

      if (unitPrice > 0 || sellPrice > 0) {
        await prisma.inventoryStock.update({
          where: { id: stock.id },
          data: { 
            unitCost: unitPrice > 0 ? unitPrice : stock.unitCost,
            sellingPrice: sellPrice > 0 ? sellPrice : stock.sellingPrice
          }
        });
        stockUpdatedCount++;
      }
    }

    // 2. Sync InventoryMutation
    const mutationsToFix = await prisma.inventoryMutation.findMany({
      where: { OR: [{ unitCost: 0 }, { sellingPrice: 0 }] },
      include: {
        batch: true,
        product: {
          include: {
            branchPrices: true,
            masterProduct: true
          }
        }
      }
    });

    for (const mut of mutationsToFix) {
      let unitPrice = mut.batch?.purchasePrice || 0;
      let sellPrice = 0;

      const branchPrice = mut.product?.branchPrices?.find(bp => bp.branchId === mut.branchId);
      
      if (!unitPrice && branchPrice?.purchasePrice) unitPrice = branchPrice.purchasePrice;
      if (!unitPrice && mut.product?.purchasePrice) unitPrice = mut.product.purchasePrice;
      if (!unitPrice && mut.product?.masterProduct?.purchasePrice) unitPrice = mut.product.masterProduct.purchasePrice;

      if (branchPrice?.sellingPrice) sellPrice = branchPrice.sellingPrice;
      if (!sellPrice && mut.product?.sellingPrice) sellPrice = mut.product.sellingPrice;
      if (!sellPrice && mut.product?.masterProduct?.sellingPrice) sellPrice = mut.product.masterProduct.sellingPrice;

      if (unitPrice > 0 || sellPrice > 0) {
        await prisma.inventoryMutation.update({
          where: { id: mut.id },
          data: { 
            unitCost: unitPrice > 0 ? unitPrice : mut.unitCost,
            sellingPrice: sellPrice > 0 ? sellPrice : mut.sellingPrice
          }
        });
        mutationUpdatedCount++;
      }
    }

    console.log(\`[SyncInventoryPrices] Stock Updated: \${stockUpdatedCount}, Mutations Updated: \${mutationUpdatedCount}\`);

    // 3. Delete old JournalEntries related to inventory
    const deletedJournals = await prisma.journalEntry.deleteMany({
      where: {
        OR: [
          { referenceNo: { startsWith: 'INV-MUT-' } },
          { referenceNo: { startsWith: 'OPENING-' } }
        ],
        entryType: 'SYSTEM'
      }
    });
    console.log(\`[SyncInventoryPrices] Deleted \${deletedJournals.count} old inventory journals.\`);

    // 4. Resync Ledger
    let journalsCreated = 0;
    
    // syncOpeningBalances REMOVED: It causes double accounting since syncAllInventoryToLedger 
    // processes historical ADJUSTMENT mutations which already account for the opening balance!

    // Re-run Mutations
    const retroResult = await syncAllInventoryToLedger();
    journalsCreated += retroResult.synced;

    res.json({
      message: 'Sinkronisasi Harga Stok dan Jurnal Keuangan Berhasil!',
      data: {
        stockUpdated: stockUpdatedCount,
        mutationUpdated: mutationUpdatedCount,
        oldJournalsDeleted: deletedJournals.count,
        newJournalsCreated: journalsCreated,
        ledgerSyncErrors: retroResult.errors
      }
    });

  } catch (error) {
    console.error('[InventoryController] syncInventoryPrices Error:', error);
    res.status(500).json({
      message: 'Gagal melakukan sinkronisasi harga stok',
      details: (error as Error).message
    });
  }
};
`;

if (!content.includes('export const syncInventoryPrices')) {
  content += syncMethod;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored controller successfully!');
