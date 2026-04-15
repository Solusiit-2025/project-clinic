import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'

/**
 * Get all invoices with filtering (Paginated)
 */
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate, page: pageParam } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const where: any = {
      ...(!isAdminView ? { clinicId: currentClinicId } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(search ? {
        OR: [
          { invoiceNo: { contains: String(search), mode: 'insensitive' } },
          { patient: { name: { contains: String(search), mode: 'insensitive' } } },
          { patient: { medicalRecordNo: { contains: String(search), mode: 'insensitive' } } },
        ]
      } : {}),
      ...(startDate || endDate ? {
        invoiceDate: {
          ...(startDate ? { gte: new Date(String(startDate)) } : {}),
          ...(endDate ? { lte: new Date(String(endDate)) } : {}),
        }
      } : {}),
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, medicalRecordNo: true, phone: true } },
          items: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ])

    if (pageParam) {
      const result: PaginatedResult<any> = {
        data: invoices,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
      return res.json(result)
    }

    res.json(invoices)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Process payment for an invoice
 */
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, paymentMethod, notes, transactionRef } = req.body
    
    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Data pembayaran tidak lengkap' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const count = await tx.payment.count()
      const paymentNo = `PAY-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(3, '0')}`

      const payment = await tx.payment.create({
        data: {
          paymentNo,
          invoiceId,
          amount: parseFloat(amount),
          paymentMethod,
          transactionRef,
          notes,
          paymentDate: new Date()
        }
      })

      // 2. Update Invoice Status
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      })

      if (!invoice) throw new Error('Invoice tidak ditemukan')

      const totalPaid = (invoice.amountPaid || 0) + parseFloat(amount)
      const newStatus = totalPaid >= invoice.total ? 'paid' : 'partial'

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          status: newStatus
        }
      })

      return { payment, invoice: updatedInvoice }
    })

    res.status(201).json(result)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Get financial summary for dashboard
 */
export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        const currentClinicId = (req as any).clinicId
        const isAdminView = (req as any).isAdminView

        const today = new Date()
        today.setHours(0,0,0,0)

        console.log('[Finance] getFinancialSummary filters:', { 
          currentClinicId, 
          isAdminView,
          today: today.toISOString()
        })

        const [revenueToday, totalUnpaid] = await Promise.all([
            prisma.payment.aggregate({
                where: {
                    paymentDate: { gte: today },
                    invoice: !isAdminView ? { clinicId: currentClinicId } : {}
                },
                _sum: { amount: true }
            }),
            prisma.invoice.aggregate({
                where: {
                    status: { not: 'paid' },
                    ...(!isAdminView ? { clinicId: currentClinicId } : {})
                },
                _sum: { total: true }
            })
        ])

        console.log('[Finance] Summary raw totals:', {
          revenueToday: revenueToday._sum.amount,
          totalUnpaid: totalUnpaid._sum.total
        })

        res.json({
            todayRevenue: revenueToday._sum.amount || 0,
            pendingRevenue: totalUnpaid._sum.total || 0
        })
    } catch (e) {
        res.status(500).json({ message: (e as Error).message })
    }
}
