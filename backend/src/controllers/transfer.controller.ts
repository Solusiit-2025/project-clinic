import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { InventoryService } from '../services/inventory.service';

/**
 * Request stock from another branch
 */
export const requestTransfer = async (req: Request, res: Response) => {
  try {
    const { sourceBranchId, destBranchId, productId, quantity, notes } = req.body;
    const userId = (req as any).user?.id || 'SYSTEM';

    if (!sourceBranchId || !destBranchId || !productId || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const transfer = await prisma.interBranchTransfer.create({
      data: {
        transferNo: `TR-${Date.now()}`,
        sourceBranchId,
        destBranchId,
        productId,
        quantity,
        status: 'REQUESTED',
        requestedBy: userId,
        notes,
      },
    });

    res.json(transfer);
  } catch (error) {
    console.error('Error requesting transfer:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * Approve transfer (HQ Logic)
 */
export const approveTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'SYSTEM';

    const updated = await prisma.interBranchTransfer.update({
      where: { id },
      data: { status: 'HQ_APPROVED', approvedBy: userId },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error approving transfer:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * SHIP Transfer (Deduct from Source branch)
 */
export const shipTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transferCost } = req.body;
    const userId = (req as any).user?.id || 'SYSTEM';

    const transfer = await prisma.interBranchTransfer.findUnique({
      where: { id },
    });

    if (!transfer) return res.status(404).json({ message: 'Transfer record not found' });
    if (transfer.status !== 'HQ_APPROVED') {
       return res.status(400).json({ message: 'Transfer must be approved by HQ first' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from Source branch using FIFO
      const picks = await InventoryService.deductStock(tx, {
        productId: transfer.productId,
        branchId: transfer.sourceBranchId,
        quantity: transfer.quantity,
        userId,
        referenceType: 'INTER_BRANCH_TRANSFER',
        referenceId: id,
        notes: `Transfer Out to Branch ${transfer.destBranchId}`,
      });

      // 2. Update status to IN_TRANSIT
      // We'll use the FIRST batch picked as the primary batch for simplicity or record all in metadata
      const updated = await tx.interBranchTransfer.update({
        where: { id },
        data: { 
          status: 'IN_TRANSIT',
          batchId: picks[0].batchId, // Primary batch reference
          transferCost : transferCost || 0
        },
      });

      return updated;
    });

    res.json({ message: 'Items are now in transit', data: result });
  } catch (error) {
    console.error('Error shipping transfer:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * RECEIVE Transfer (Add to Destination branch)
 */
export const receiveTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'SYSTEM';

    const transfer = await prisma.interBranchTransfer.findUnique({
      where: { id },
      include: { batch: true }
    });

    if (!transfer || !transfer.batch) return res.status(404).json({ message: 'Transfer/Batch record not found' });

    await prisma.$transaction(async (tx) => {
      // 1. Logic: Create destination batch with same Number/Expiry
      const destBatch = await tx.inventoryBatch.upsert({
        where: {
          branchId_productId_batchNumber: {
            branchId: transfer.destBranchId,
            productId: transfer.productId,
            batchNumber: transfer.batch!.batchNumber,
          },
        },
        update: { currentQty: { increment: transfer.quantity } },
        create: {
          branchId: transfer.destBranchId,
          productId: transfer.productId,
          batchNumber: transfer.batch!.batchNumber,
          expiryDate: transfer.batch!.expiryDate,
          purchasePrice: transfer.batch!.purchasePrice,
          initialQty: transfer.quantity,
          currentQty: transfer.quantity,
        },
      });

      // 2. Add to Stock
      await tx.inventoryStock.upsert({
        where: {
          branchId_productId_batchId: {
            branchId: transfer.destBranchId,
            productId: transfer.productId,
            batchId: destBatch.id,
          },
        },
        update: { onHandQty: { increment: transfer.quantity } },
        create: {
          branchId: transfer.destBranchId,
          productId: transfer.productId,
          batchId: destBatch.id,
          onHandQty: transfer.quantity,
        },
      });

      // 3. Mutation IN
      await tx.inventoryMutation.create({
        data: {
          branchId: transfer.destBranchId,
          productId: transfer.productId,
          batchId: destBatch.id,
          type: 'IN',
          quantity: transfer.quantity,
          referenceType: 'INTER_BRANCH_TRANSFER',
          referenceId: id,
          notes: `Transfer Received from Branch ${transfer.sourceBranchId}`,
          userId,
        },
      });

      // 4. Synchronize total quantity
      await InventoryService.syncProductQuantity(tx, transfer.productId, transfer.destBranchId);

      // 5. Update status to RECEIVED
      await tx.interBranchTransfer.update({
        where: { id },
        data: { status: 'RECEIVED', receivedBy: userId },
      });
    });

    res.json({ message: 'Transfer received successfully' });
  } catch (error) {
    console.error('Error receiving transfer:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getTransfers = async (req: Request, res: Response) => {
  try {
    const { branchId, type } = req.query; // type can be 'OUT' (source) or 'IN' (dest)
    
    let whereClause: any = {};
    if (branchId) {
      if (type === 'OUT') {
        whereClause.sourceBranchId = branchId as string;
      } else if (type === 'IN') {
        whereClause.destBranchId = branchId as string;
      } else {
        whereClause.OR = [
          { sourceBranchId: branchId as string },
          { destBranchId: branchId as string }
        ];
      }
    }

    const transfers = await prisma.interBranchTransfer.findMany({
      where: whereClause,
      include: {
        sourceBranch: { select: { name: true } },
        destBranch: { select: { name: true } },
        product: { select: { productName: true, productCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};
