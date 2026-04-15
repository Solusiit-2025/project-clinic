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
  static async pickBatchesFIFO(productId: string, branchId: string, quantityNeeded: number) {
    const batches = await prisma.inventoryBatch.findMany({
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
    const picks: { batchId: string; quantity: number }[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const take = Math.min(batch.currentQty, remaining);
      picks.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(`Stok tidak mencukupi untuk memenuhi permintaan. Kurang: ${remaining}`);
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
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    }
  ) {
    const picks = await this.pickBatchesFIFO(data.productId, data.branchId, data.quantity);

    for (const pick of picks) {
      // 1. Update Batch currentQty
      await tx.inventoryBatch.update({
        where: { id: pick.batchId },
        data: { currentQty: { decrement: pick.quantity } },
      });

      // 2. Update InventoryStock (per batch if exists, or global)
      // We upsert/update stock record for this batch
      await tx.inventoryStock.update({
        where: {
          branchId_productId_batchId: {
            branchId: data.branchId,
            productId: data.productId,
            batchId: pick.batchId,
          },
        },
        data: { onHandQty: { decrement: pick.quantity } },
      });

      // 3. Record Mutation
      await tx.inventoryMutation.create({
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
    }

    return picks;
  }

  /**
   * Reserve stock (e.g., when prescription is created)
   */
  static async reserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    branchId: string,
    quantity: number
  ) {
    const availability = await this.getAvailableStock(productId, branchId);
    
    if (availability.totalAvailable < quantity) {
      throw new Error(`Gagal reservasi: Stok tersedia (${availability.totalAvailable}) tidak cukup.`);
    }

    // Since reservation is usually global for a product in a branch (before batch picking at dispensing),
    // we increment reservedQty on a specific stock record without batchId, or spread across batches.
    // Recommended: Update the stock record with null batchId (Global pool for the branch).
    
    return await tx.inventoryStock.updateMany({
      where: {
        branchId,
        productId,
        // Generally we reserve against the global availability, we'll track it on the record with null batch
        // or a specific "Global" record. 
      },
      data: {
        reservedQty: { increment: quantity }
      }
    });
  }
}
