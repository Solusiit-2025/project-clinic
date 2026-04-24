import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class InventoryService {
  /**
   * Calculate available stock for a product in a specific branch.
   * Available = Sum(onHandQty) - Sum(reservedQty)
   */
  static async getAvailableStock(productId: string, branchId: string) {
    const stocks = await prisma.inventoryStock.aggregate({
      where: { productId, branchId },
      _sum: {
        onHandQty: true,
        reservedQty: true,
      },
    });

    const totalOnHand = stocks._sum.onHandQty || 0;
    const totalReserved = stocks._sum.reservedQty || 0;

    return {
      totalOnHand,
      totalReserved,
      totalAvailable: Math.max(0, totalOnHand - totalReserved),
    };
  }

  /**
   * Pick batches for stock out using FIFO (First Expiry First Out) logic.
   * Returns a list of batches and quantities to be deducted.
   */
  static async pickBatchesFIFO(
    productId: string, 
    branchId: string, 
    quantityNeeded: number, 
    tx?: Prisma.TransactionClient, 
    productName?: string,
    defaultPurchasePrice: number = 0
  ) {
    const client = tx || prisma;
    const batches = await client.inventoryBatch.findMany({
      where: {
        productId,
        branchId,
        currentQty: { gt: 0 },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    let remaining = quantityNeeded;
    const picks: { batchId: string | null; quantity: number; purchasePrice: number }[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const take = Math.min(batch.currentQty, remaining);
      picks.push({ batchId: batch.id, quantity: take, purchasePrice: batch.purchasePrice });
      remaining -= take;
    }

    // FALLBACK: If still remaining, check global stock (batchId: null)
    if (remaining > 0) {
      const globalStock = await client.inventoryStock.findFirst({
        where: { productId, branchId, batchId: null, onHandQty: { gt: 0 } }
      });

      if (globalStock) {
        const take = Math.min(remaining, globalStock.onHandQty);
        picks.push({ 
          batchId: null, 
          quantity: take, 
          purchasePrice: defaultPurchasePrice 
        });
        remaining -= take;
      }
    }

    if (remaining > 0) {
      const totalAvailable = quantityNeeded - remaining;
      throw new Error(`Stok ${productName || 'Produk'} tidak mencukupi (Tersisa: ${totalAvailable}, Diminta: ${quantityNeeded}).`);
    }

    return picks;
  }

  /**
   * Perform stock deduction across multiple batches (FIFO).
   * Should be called within a transaction.
   */
  static async deductStock(
    tx: Prisma.TransactionClient,
    data: {
      productId: string;
      branchId: string;
      quantity: number;
      userId: string;
      referenceType: string;
      referenceId?: string;
      notes?: string;
      skipSync?: boolean;
      fromReserved?: boolean;
    }
  ) {
    // 0. Fetch product with Row-Level Locking (Implicit in transaction) to ensure data stability
    const product = await tx.product.findUnique({
      where: { id: data.productId },
      select: { productName: true, purchasePrice: true }
    });

    const picks = await this.pickBatchesFIFO(data.productId, data.branchId, data.quantity, tx, product?.productName, product?.purchasePrice || 0);

    for (const pick of picks) {
      // 1. Update Batch currentQty (Skip if global stock)
      if (pick.batchId) {
        const batch = await tx.inventoryBatch.findUnique({ where: { id: pick.batchId } });
        if (!batch || batch.currentQty < pick.quantity) {
          throw new Error(`Kritikal: Batch ${pick.batchId} tidak memiliki sisa stok cukup saat eksekusi.`);
        }

        await tx.inventoryBatch.update({
          where: { id: pick.batchId },
          data: { currentQty: { decrement: pick.quantity } },
        });
      }

      // 2. Update InventoryStock (per batch if exists, or global)
      const stock = await tx.inventoryStock.findFirst({
        where: { branchId: data.branchId, productId: data.productId, batchId: pick.batchId }
      });

      if (!stock || stock.onHandQty < pick.quantity) {
          throw new Error(`Kritikal: Record Stok untuk batch ${pick.batchId} tidak cukup.`);
      }

      await tx.inventoryStock.update({
        where: { id: stock.id },
        data: { onHandQty: { decrement: pick.quantity } },
      });

      // 3. Record Mutation
      const newMutation = await tx.inventoryMutation.create({
        data: {
          branchId: data.branchId,
          productId: data.productId,
          batchId: pick.batchId,
          type: 'OUT',
          quantity: pick.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          userId: data.userId,
        },
      });
      // Simpan mutation ID di pick agar caller bisa sync ke GL
      (pick as any).mutationId = newMutation.id;
    }

    // 4. Update Reserved Quantity if needed
    if (data.fromReserved) {
      await tx.inventoryStock.updateMany({
        where: {
          productId: data.productId,
          branchId: data.branchId,
          batchId: null, // Reservations are stored in the global record
          reservedQty: { gte: data.quantity }
        },
        data: {
          reservedQty: { decrement: data.quantity }
        }
      });
    }

    // 5. Sycnronize total quantity back to Product table (if not skipped)
    if (!data.skipSync) {
      await this.syncProductQuantity(tx, data.productId, data.branchId);
    }

    return picks;
  }

  /**
   * Synchronize Product.quantity with sum of onHandQty from InventoryStock.
   * Ensures data consistency for "Low Stock" reports.
   */
  static async syncProductQuantity(tx: Prisma.TransactionClient, productId: string, clinicId: string) {
    const aggregate = await tx.inventoryStock.aggregate({
      where: { productId, branchId: clinicId },
      _sum: {
        onHandQty: true,
      },
    });

    const totalQty = aggregate._sum.onHandQty || 0;

    await tx.product.update({
      where: { id: productId },
      data: { quantity: totalQty },
    });

    console.log(`[InventoryService] Synced Product ${productId} in Branch ${clinicId}. New total: ${totalQty}`);
    return totalQty;
  }

  /**
   * Synchronize multiple Products' quantity with sum of onHandQty from InventoryStock in bulk.
   * Drastically reduces DB round-trips for large Stock Opnames or Goods Receipts.
   */
  static async syncMultipleProductsQuantity(tx: Prisma.TransactionClient, productIds: string[], clinicId: string) {
    if (productIds.length === 0) return;

    // 1. Fetch all stock records for these products in one go
    const stocks = await tx.inventoryStock.findMany({
      where: {
        branchId: clinicId,
        productId: { in: productIds },
      },
      select: {
        productId: true,
        onHandQty: true,
      },
    });

    // 2. Aggregate quantities in memory
    const totalsMap: Record<string, number> = {};
    productIds.forEach(id => totalsMap[id] = 0); // Initialize

    stocks.forEach(s => {
      totalsMap[s.productId] = (totalsMap[s.productId] || 0) + s.onHandQty;
    });

    // 3. Update each product (Parallel updates within the transaction)
    await Promise.all(
      Object.entries(totalsMap).map(([productId, totalQty]) =>
        tx.product.update({
          where: { id: productId },
          data: { quantity: totalQty },
        })
      )
    );

    console.log(`[InventoryService] Bulk-synced ${productIds.length} products in Branch ${clinicId}.`);
  }

  /**
   * Reserve stock (e.g., when prescription is changed to 'preparing')
   */
  static async reserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    branchId: string,
    quantity: number,
    userId: string,
    referenceId?: string,
    notes?: string
  ) {
    const availability = await this.getAvailableStock(productId, branchId);
    
    if (availability.totalAvailable < quantity) {
      throw new Error(`Gagal reservasi: Stok tersedia (${availability.totalAvailable}) tidak cukup.`);
    }

    // Ensure a global stock record (batchId: null) exists to track reservations
    const existingGlobal = await tx.inventoryStock.findFirst({
      where: { productId, branchId, batchId: null }
    });

    if (!existingGlobal) {
      await tx.inventoryStock.create({
        data: {
          productId,
          branchId,
          batchId: null,
          onHandQty: 0,
          reservedQty: quantity
        }
      });
    } else {
      await tx.inventoryStock.update({
        where: { id: existingGlobal.id },
        data: { reservedQty: { increment: quantity } }
      });
    }

    // 1. Log Mutation for History
    await tx.inventoryMutation.create({
      data: {
        branchId,
        productId,
        type: 'RESERVE',
        quantity,
        referenceType: 'DISPENSING',
        referenceId,
        notes: notes || 'Reservasi stok untuk penyiapan obat',
        userId
      }
    });

    console.log(`[InventoryService] Reserved ${quantity} units for Product ${productId} in Branch ${branchId}`);
  }

  /**
   * Release reserved stock (e.g., when preparation is cancelled)
   */
  static async unreserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    branchId: string,
    quantity: number,
    userId: string,
    referenceId?: string,
    notes?: string
  ) {
    await tx.inventoryStock.updateMany({
      where: { productId, branchId, batchId: null },
      data: { reservedQty: { decrement: quantity } }
    });
    
    // 1. Log Mutation for History
    await tx.inventoryMutation.create({
      data: {
        branchId,
        productId,
        type: 'UNRESERVE',
        quantity,
        referenceType: 'DISPENSING',
        referenceId,
        notes: notes || 'Pelepasan reservasi (pembatalan/perubahan)',
        userId
      }
    });

    console.log(`[InventoryService] Released reservation of ${quantity} units for Product ${productId}`);
  }
}
