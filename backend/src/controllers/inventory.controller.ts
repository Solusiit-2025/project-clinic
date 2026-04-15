import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { InventoryService } from '../services/inventory.service';
import { getPaginationOptions, PaginatedResult } from '../utils/pagination';

/**
 * Get stock list for a specific branch
 */
export const getBranchStocks = async (req: Request, res: Response) => {
  try {
    const { branchId, search } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required' });
    }

    const { skip, take, page, limit } = getPaginationOptions(req.query);
    const pageParam = req.query.page;

    const [total, stocks] = await Promise.all([
      prisma.inventoryStock.count({
        where: {
          branchId: branchId as string,
          product: {
            productName: { contains: search as string, mode: 'insensitive' },
          },
        }
      }),
      prisma.inventoryStock.findMany({
        where: {
          branchId: branchId as string,
          product: {
            productName: { contains: search as string, mode: 'insensitive' },
          },
        },
        include: {
          product: true,
          batch: { select: { batchNumber: true, expiryDate: true, purchasePrice: true } },
        },
        orderBy: { product: { productName: 'asc' } },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ]);

    if (pageParam) {
      const result: PaginatedResult<any> = {
        data: stocks,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
      return res.json(result);
    }

    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * Get all available Products explicitly linked to a branch
 * Useful for Procurement where we need Product.id instead of ProductMaster.id
 */
export const getBranchProducts = async (req: Request, res: Response) => {
  try {
    const { branchId, search } = req.query;
    if (!branchId) return res.status(400).json({ message: 'branchId is required' });

    const products = await prisma.product.findMany({
      where: {
        clinicId: branchId as string,
        OR: search ? [
          { productName: { contains: search as string, mode: 'insensitive' } },
          { productCode: { contains: search as string, mode: 'insensitive' } }
        ] : undefined,
      },
      include: {
        masterProduct: true
      },
      orderBy: { productName: 'asc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching branch products:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * Get mutation history (Stock Card)
 */
export const getStockMutations = async (req: Request, res: Response) => {
  try {
    const { branchId, productId, startDate, endDate } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required' });
    }

    const whereClause: any = { branchId: branchId as string };
    if (productId) whereClause.productId = productId as string;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const { skip, take, page, limit } = getPaginationOptions(req.query);
    const pageParam = req.query.page;

    const [total, mutations] = await Promise.all([
      prisma.inventoryMutation.count({ where: whereClause }),
      prisma.inventoryMutation.findMany({
        where: whereClause,
        include: {
          product: { select: { productName: true, productCode: true } },
          batch: { select: { batchNumber: true, purchasePrice: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ]);

    if (pageParam) {
      const result: PaginatedResult<any> = {
        data: mutations,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
      return res.json(result);
    }

    res.json(mutations);
  } catch (error) {
    console.error('Error fetching mutations:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * Manual Stock Adjustment
 */
export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { branchId, productId, batchId, quantity, type, reason } = req.body;
    const userId = (req as any).user?.id || 'SYSTEM';

    if (!branchId || !productId || !quantity || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validation: No negative stock
    if (type === 'ADJUST_REDUCE') {
      const current = await InventoryService.getAvailableStock(productId, branchId);
      if (current.totalOnHand < quantity) {
        return res.status(400).json({ message: 'Stok tidak mencukupi untuk pengurangan.' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Stock Record
      const stock = await tx.inventoryStock.update({
        where: {
          branchId_productId_batchId: {
            branchId,
            productId,
            batchId: batchId || null,
          },
        },
        data: {
          onHandQty: type === 'ADJUST_ADD' ? { increment: quantity } : { decrement: quantity },
        },
      });

      // 2. If it's a batch record, update batch as well
      if (batchId) {
        await tx.inventoryBatch.update({
          where: { id: batchId },
          data: {
            currentQty: type === 'ADJUST_ADD' ? { increment: quantity } : { decrement: quantity },
          },
        });
      }

      // 3. Create Mutation Record
      const mutation = await tx.inventoryMutation.create({
        data: {
          branchId,
          productId,
          batchId,
          type: 'ADJUSTMENT',
          quantity: type === 'ADJUST_ADD' ? quantity : -quantity,
          referenceType: 'MANUAL_ADJUSTMENT',
          notes: reason,
          userId,
        },
      });

      // 4. Audit Log
      await tx.inventoryAuditLog.create({
        data: {
          branchId,
          userId,
          action: 'UPDATE',
          tableName: 'inventory_stocks',
          recordId: stock.id,
          newData: JSON.stringify({ type, quantity, reason }),
        },
      });

      return { stock, mutation };
    });

    res.json({ message: 'Stock adjusted successfully', data: result });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};
