import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createProcurement = async (req: Request, res: Response) => {
  try {
    const { branchId, type, items, vendorId, notes } = req.body;
    const userId = (req as any).user?.id || 'SYSTEM';

    if (!branchId || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const procurementNo = `PR-${Date.now()}`;
    let totalAmount = 0;

    const result = await prisma.$transaction(async (tx) => {
      const procurement = await tx.procurement.create({
        data: {
          procurementNo,
          branchId,
          vendorId,
          type,
          status: 'PENDING_APPROVAL',
          createdBy: userId,
          notes,
          items: {
            create: items.map((item: any) => {
              const subtotal = item.requestedQty * item.unitPrice;
              totalAmount += subtotal;
              return {
                productId: item.productId,
                requestedQty: item.requestedQty,
                unitPrice: item.unitPrice,
                subtotal,
              };
            }),
          },
        },
      });

      // Update total amount
      await tx.procurement.update({
        where: { id: procurement.id },
        data: { totalAmount },
      });

      return procurement;
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating procurement:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const approveProcurement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'SYSTEM';
    const userRole = (req as any).user?.role;

    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!procurement) return res.status(404).json({ message: 'PR not found' });

    // Threshold check logic
    const thresholdSetting = await prisma.siteSetting.findFirst({
      where: { key: `procurement_threshold_${procurement.branchId}` },
    });
    const threshold = thresholdSetting ? (thresholdSetting.value as number) : 10000000;

    if (procurement.totalAmount > threshold && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Approval HQ diperlukan untuk transaksi di atas limit.' });
    }

    const updated = await prisma.procurement.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error approving procurement:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const receiveGoods = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // procurementId
    const { items, grnNo } = req.body; // Array of { itemId, receivedQty, batchNumber, expiryDate }
    const userId = (req as any).user?.id || 'SYSTEM';

    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!procurement) return res.status(404).json({ message: 'Procurement record not found' });

    await prisma.$transaction(async (tx) => {
      for (const receiveItem of items) {
        const originalItem = procurement.items.find(i => i.id === receiveItem.itemId);
        if (!originalItem) continue;

        // 1. Update Procurement Item
        await tx.procurementItem.update({
          where: { id: receiveItem.itemId },
          data: {
            receivedQty: receiveItem.receivedQty,
            batchNumber: receiveItem.batchNumber,
            expiryDate: new Date(receiveItem.expiryDate),
          },
        });

        // 2. Create/Update Inventory Batch
        const batch = await tx.inventoryBatch.upsert({
          where: {
            branchId_productId_batchNumber: {
              branchId: procurement.branchId,
              productId: originalItem.productId,
              batchNumber: receiveItem.batchNumber,
            },
          },
          update: {
            currentQty: { increment: receiveItem.receivedQty },
          },
          create: {
            branchId: procurement.branchId,
            productId: originalItem.productId,
            batchNumber: receiveItem.batchNumber,
            expiryDate: new Date(receiveItem.expiryDate),
            purchasePrice: originalItem.unitPrice,
            initialQty: receiveItem.receivedQty,
            currentQty: receiveItem.receivedQty,
          },
        });

        // 3. Update Global Stock per Batch
        await tx.inventoryStock.upsert({
          where: {
            branchId_productId_batchId: {
              branchId: procurement.branchId,
              productId: originalItem.productId,
              batchId: batch.id,
            },
          },
          update: { onHandQty: { increment: receiveItem.receivedQty } },
          create: {
            branchId: procurement.branchId,
            productId: originalItem.productId,
            batchId: batch.id,
            onHandQty: receiveItem.receivedQty,
          },
        });

        // 4. Record IN Mutation
        await tx.inventoryMutation.create({
          data: {
            branchId: procurement.branchId,
            productId: originalItem.productId,
            batchId: batch.id,
            type: 'IN',
            quantity: receiveItem.receivedQty,
            referenceType: 'PROCUREMENT_GRN',
            referenceId: id,
            notes: `Received via ${grnNo || procurement.procurementNo}`,
            userId,
          },
        });
      }

      // Final status update
      await tx.procurement.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });
    });

    res.json({ message: 'Goods received and stock updated successfully' });
  } catch (error) {
    console.error('Error receiving goods:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getProcurements = async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query;
    const where: any = {};
    if (branchId) where.branchId = branchId as string;
    if (status) where.status = status as string;

    const procurements = await prisma.procurement.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(procurements);
  } catch (error) {
    console.error('Error fetching procurements:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getProcurementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { productName: true, productCode: true, masterProduct: { select: { medicineId: true } } } }
          }
        }
      }
    });

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement not found' });
    }

    res.json(procurement);
  } catch (error) {
    console.error('Error fetching procurement details:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};
