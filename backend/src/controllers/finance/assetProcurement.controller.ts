import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { v4 as uuidv4 } from 'uuid'


// Helper: Generate PO Number
const generatePONumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '') // YYYYMM
  const prefix = `POA-${dateStr}-`
  
  const lastPO = await prisma.assetProcurement.findFirst({
    where: { procurementNo: { startsWith: prefix } },
    orderBy: { procurementNo: 'desc' },
  })
  
  if (!lastPO) return `${prefix}0001`
  
  const lastNumber = parseInt(lastPO.procurementNo.slice(-4), 10)
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
}

export const createPO = async (req: Request, res: Response) => {
  try {
    const { branchId, supplierId, supplierName, paymentType, downPayment, totalInterest, items, tenorMonths } = req.body
    const userId = (req as any).user.id
    
    // Calculate totals
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.requestedQty * item.unitPrice), 0)
    
    const procurementNo = await generatePONumber()
    
    const newPO = await prisma.assetProcurement.create({
      data: {
        procurementNo,
        branchId,
        supplierId,
        supplierName,
        paymentType, // CASH or INSTALLMENT
        totalAmount,
        downPayment: downPayment || 0,
        totalInterest: totalInterest || 0,
        createdBy: userId,
        status: 'PO_SENT',
        paymentStatus: paymentType === 'CASH' ? 'UNPAID' : (downPayment > 0 ? 'PARTIAL' : 'UNPAID'),
        items: {
          create: items.map((item: any) => ({
            masterProductId: item.masterProductId,
            requestedQty: item.requestedQty,
            unitPrice: item.unitPrice,
            subtotal: item.requestedQty * item.unitPrice
          }))
        }
      }
    })

    // If installment, generate payment schedules
    if (paymentType === 'INSTALLMENT' && tenorMonths > 0) {
      const principalTotal = totalAmount - (downPayment || 0)
      const monthlyPrincipal = principalTotal / tenorMonths
      const monthlyInterest = (totalInterest || 0) / tenorMonths
      
      const schedules = []
      let currentDate = new Date()
      
      for (let i = 1; i <= tenorMonths; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1)
        const periodStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        
        schedules.push({
          procurementId: newPO.id,
          monthPeriod: periodStr,
          dueDate: new Date(currentDate),
          principalAmount: monthlyPrincipal,
          interestAmount: monthlyInterest,
          totalAmount: monthlyPrincipal + monthlyInterest
        })
      }
      
      await prisma.assetPaymentSchedule.createMany({
        data: schedules
      })
    }
    
    res.status(201).json(newPO)
  } catch (error) {
    console.error('Error creating asset PO:', error)
    res.status(500).json({ error: 'Failed to create asset PO' })
  }
}

export const getPOs = async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query
    const where: any = {}
    if (branchId) where.branchId = String(branchId)
    if (status) where.status = String(status)
    
    const pos = await prisma.assetProcurement.findMany({
      where,
      include: {
        items: {
          include: { masterProduct: true }
        },
        schedules: {
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(pos)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch POs' })
  }
}

export const receiveGoods = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // Simple receive logic: receive all
    const po = await prisma.assetProcurement.findUnique({
      where: { id },
      include: { items: true }
    })
    
    if (!po) return res.status(404).json({ error: 'PO not found' })
    
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.assetProcurement.update({
        where: { id },
        data: { status: 'RECEIVED' }
      })
      
      // 2. Update received qty
      for (const item of po.items) {
        await tx.assetProcurementItem.update({
          where: { id: item.id },
          data: { receivedQty: item.requestedQty }
        })
      }
    })
    
    res.json({ message: 'Goods received' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive goods' })
  }
}

export const payInstallment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params // Schedule ID
    const { clinicId, bankId } = req.body
    
    const schedule = await prisma.assetPaymentSchedule.findUnique({
      where: { id },
      include: { procurement: { include: { items: { include: { masterProduct: true } } } } }
    })
    
    if (!schedule || schedule.status === 'PAID') {
      return res.status(400).json({ error: 'Invalid or already paid schedule' })
    }
    
    // Resolve COA for Liability (Hutang Aset) and Interest Expense (Beban Bunga)
    let kasAccount = null
    if (bankId) {
      const bank = await prisma.bank.findUnique({ where: { id: bankId } })
      if (bank) {
        kasAccount = await prisma.chartOfAccount.findUnique({ where: { id: bank.coaId } })
      }
    }
    if (!kasAccount) {
      kasAccount = await prisma.chartOfAccount.findFirst({
        where: { code: { startsWith: '1-110' }, clinicId }
      })
    }
    
    if (!kasAccount) return res.status(400).json({ error: 'Kas account not found' })
      
    // find or create Hutang Leasing
    let liabilityCoa = await prisma.chartOfAccount.findFirst({
      where: { name: { contains: 'Hutang Leasing' }, clinicId }
    })
    if (!liabilityCoa) {
      liabilityCoa = await prisma.chartOfAccount.create({
        data: {
          code: '2-1201-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          name: 'Hutang Leasing Aset',
          category: 'LIABILITY',
          accountType: 'DETAIL',
          clinicId,
          isActive: true
        }
      })
    }
    
    let interestCoa = null
    if (schedule.interestAmount > 0) {
      interestCoa = await prisma.chartOfAccount.findFirst({
        where: { name: { contains: 'Beban Bunga' }, clinicId }
      })
      if (!interestCoa) {
        interestCoa = await prisma.chartOfAccount.create({
          data: {
            code: '6-2101-K001',
            name: 'Beban Bunga Leasing',
            category: 'EXPENSE',
            accountType: 'DETAIL',
            clinicId,
            isActive: true
          }
        })
      }
    }
    
    await prisma.$transaction(async (tx) => {
      // Create Journal
      const journal = await tx.journalEntry.create({
        data: {
          date: new Date(),
          referenceNo: `PAY-AST-${schedule.id.slice(0,6)}`,
          description: `Pembayaran Cicilan Aset PO ${schedule.procurement.procurementNo}`,
          entryType: 'SYSTEM',
          clinicId,
        }
      })
      
      // Debit Liability (Principal)
      await tx.journalDetail.create({
        data: {
          journalEntryId: journal.id,
          coaId: liabilityCoa!.id,
          debit: schedule.principalAmount,
          credit: 0,
          description: `Cicilan Pokok Aset`
        }
      })
      
      // Debit Expense (Interest)
      if (schedule.interestAmount > 0 && interestCoa) {
        await tx.journalDetail.create({
          data: {
            journalEntryId: journal.id,
            coaId: interestCoa.id,
            debit: schedule.interestAmount,
            credit: 0,
            description: `Beban Bunga Aset`
          }
        })
      }
      
      // Credit Kas (Total)
      await tx.journalDetail.create({
        data: {
          journalEntryId: journal.id,
          coaId: kasAccount.id,
          debit: 0,
          credit: schedule.totalAmount,
          description: `Pembayaran Cicilan`
        }
      })
      
      // Update Schedule
      await tx.assetPaymentSchedule.update({
        where: { id: schedule.id },
        data: { status: 'PAID', paidAt: new Date(), journalId: journal.id }
      })
      
      // Update Procurement paid amount
      await tx.assetProcurement.update({
        where: { id: schedule.procurementId },
        data: {
          totalPaid: { increment: schedule.totalAmount }
        }
      })
    })
    
    res.json({ message: 'Payment recorded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to process payment' })
  }
}

export const deletePO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const po = await prisma.assetProcurement.findUnique({
      where: { id },
      include: { schedules: true }
    })
    
    if (!po) return res.status(404).json({ error: 'PO not found' })
    if (po.status === 'RECEIVED') return res.status(400).json({ error: 'Cannot delete received PO' })
    if (po.schedules.some(s => s.status === 'PAID')) return res.status(400).json({ error: 'Cannot delete PO with paid installments' })

    await prisma.assetPaymentSchedule.deleteMany({ where: { procurementId: id } })
    await prisma.assetProcurementItem.deleteMany({ where: { procurementId: id } })
    await prisma.assetProcurement.delete({ where: { id } })
    
    res.json({ message: 'PO deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete PO' })
  }
}

export const updatePO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supplierId, supplierName, paymentType, downPayment, totalInterest, items, tenorMonths } = req.body;

    const po = await prisma.assetProcurement.findUnique({ where: { id }, include: { schedules: true } });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    if (po.status === 'RECEIVED') return res.status(400).json({ error: 'Cannot edit received PO' });
    if (po.schedules.some((s: any) => s.status === 'PAID')) return res.status(400).json({ error: 'Cannot edit PO with paid installments' });

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.requestedQty * item.unitPrice), 0);

    await prisma.$transaction(async (tx) => {
      await tx.assetPaymentSchedule.deleteMany({ where: { procurementId: id } });
      await tx.assetProcurementItem.deleteMany({ where: { procurementId: id } });

      await tx.assetProcurement.update({
        where: { id },
        data: {
          supplierId,
          supplierName,
          paymentType,
          totalAmount,
          downPayment: downPayment || 0,
          totalInterest: totalInterest || 0,
          paymentStatus: paymentType === 'CASH' ? 'UNPAID' : ((downPayment || 0) > 0 ? 'PARTIAL' : 'UNPAID'),
          items: {
            create: items.map((item: any) => ({
              masterProductId: item.masterProductId,
              requestedQty: item.requestedQty,
              unitPrice: item.unitPrice,
              subtotal: item.requestedQty * item.unitPrice
            }))
          }
        }
      });

      if (paymentType === 'INSTALLMENT' && tenorMonths > 0) {
        const principalTotal = totalAmount - (downPayment || 0);
        const monthlyPrincipal = principalTotal / tenorMonths;
        const monthlyInterest = (totalInterest || 0) / tenorMonths;
        
        const schedules = [];
        let currentDate = new Date();
        
        for (let i = 1; i <= tenorMonths; i++) {
          currentDate.setMonth(currentDate.getMonth() + 1);
          const periodStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          
          schedules.push({
            procurementId: id,
            monthPeriod: periodStr,
            dueDate: new Date(currentDate),
            principalAmount: monthlyPrincipal,
            interestAmount: monthlyInterest,
            totalAmount: monthlyPrincipal + monthlyInterest
          });
        }
        
        await tx.assetPaymentSchedule.createMany({ data: schedules });
      }
    });

    res.json({ message: 'PO updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update PO' });
  }
}
