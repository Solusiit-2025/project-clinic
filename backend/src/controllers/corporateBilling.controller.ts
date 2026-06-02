import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'

/**
 * Get all corporate invoices (Tagihan Bulanan)
 */
export const getCorporateInvoices = async (req: Request, res: Response) => {
  try {
    const { partnerId, status, search, page: pageParam } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const where: any = {
      ...(!isAdminView ? { clinicId: currentClinicId } : {}),
      ...(partnerId ? { partnerId: String(partnerId) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(search ? {
        OR: [
          { invoiceNo: { contains: String(search), mode: 'insensitive' } },
          { partner: { name: { contains: String(search), mode: 'insensitive' } } }
        ]
      } : {})
    }

    const [total, invoices] = await Promise.all([
      prisma.corporateInvoice.count({ where }),
      prisma.corporateInvoice.findMany({
        where,
        include: {
          corporatePartner: true,
          invoices: { 
            select: { 
              id: true, 
              invoiceNo: true, 
              invoiceDate: true,
              total: true, 
              corporateCoverageAmount: true,
              patient: {
                select: {
                  name: true,
                  medicalRecordNo: true
                }
              }
            } 
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ])

    if (pageParam) {
      const formattedData = invoices.map((inv: any) => ({
        ...inv,
        partner: inv.corporatePartner,
        patientInvoices: inv.invoices
      }))
      const result: PaginatedResult<any> = {
        data: formattedData,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
      return res.json(result)
    }

    // Map `corporatePartner` to `partner` and `invoices` to `patientInvoices` for frontend
    const formattedInvoices = invoices.map(inv => ({
      ...inv,
      partner: inv.corporatePartner,
      patientInvoices: inv.invoices
    }))

    res.json(formattedInvoices)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

export const getPendingPatientInvoices = async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const isAll = partnerId === 'all'

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'pending_corporate',
        corporateInvoiceId: null, // Belum ditagihkan
        corporateCoverageAmount: { gt: 0 },
        ...(isAll 
          ? { patient: { corporatePartnerId: { not: null } } }
          : { patient: { corporatePartnerId: String(partnerId) } }),
        ...(!isAdminView ? { clinicId: currentClinicId } : {})
      },
      include: {
        patient: { 
          select: { 
            name: true, 
            medicalRecordNo: true,
            corporatePartner: { select: { name: true, code: true } }
          } 
        }
      },
      orderBy: { invoiceDate: 'asc' }
    })

    res.json(invoices)
  } catch (e) {
    res.status(500).json({ message: (e as Error).message })
  }
}

/**
 * Generate a new Corporate Invoice from pending patient invoices
 */
export const generateCorporateInvoice = async (req: Request, res: Response) => {
  try {
    const { partnerId, dueDate, notes, invoiceIds } = req.body
    const currentClinicIdContext = (req as any).clinicId

    if (!partnerId || !invoiceIds || invoiceIds.length === 0) {
      return res.status(400).json({ message: 'Data tidak lengkap. Pilih perusahaan dan invoice yang akan ditagih.' })
    }

    const partner = await prisma.corporatePartner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) throw new Error('Perusahaan tidak ditemukan')

    const targetClinicId = partner.clinicId || currentClinicIdContext

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify pending invoices
      const pendingInvoices = await tx.invoice.findMany({
        where: {
          id: { in: invoiceIds },
          status: 'pending_corporate',
          corporateInvoiceId: null
        }
      })

      if (pendingInvoices.length !== invoiceIds.length) {
        throw new Error('Beberapa invoice tidak valid atau sudah ditagihkan sebelumnya.')
      }

      // 2. Calculate totals
      let subtotal = 0
      for (const inv of pendingInvoices) {
        subtotal += (inv.corporateCoverageAmount || 0)
      }

      // 3. Apply discounts and tax from contract
      const discount = (subtotal * (partner.contractDiscountRate || 0)) / 100
      const subtotalAfterDiscount = subtotal - discount
      const tax = (subtotalAfterDiscount * (partner.taxRate || 0)) / 100
      const total = subtotalAfterDiscount + tax

      // 4. Create Corporate Invoice
      const count = await tx.corporateInvoice.count()
      const invoiceNo = `CORP-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}-${(count + 1).toString().padStart(3, '0')}`

      const corporateInvoice = await tx.corporateInvoice.create({
        data: {
          invoiceNo,
          corporatePartnerId: partnerId,
          clinicId: targetClinicId,
          invoiceDate: new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
          subtotal,
          discount,
          tax,
          total,
          amountPaid: 0,
          status: 'unpaid',
          notes
        }
      })

      // 5. Link patient invoices
      await tx.invoice.updateMany({
        where: { id: { in: invoiceIds } },
        data: { corporateInvoiceId: corporateInvoice.id }
      })

      // Note: We don't change patient invoice status here. It remains 'pending_corporate' until the corporate pays.

      return corporateInvoice
    })

    res.status(201).json({ message: 'Tagihan Perusahaan berhasil dibuat', data: result })
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}

/**
 * Process payment for a corporate invoice
 */
export const processCorporatePayment = async (req: Request, res: Response) => {
  try {
    const { corporateInvoiceId, amount, paymentMethod, transactionRef, bankId, notes } = req.body
    const amountToPay = parseFloat(amount)

    if (!corporateInvoiceId || !paymentMethod || amountToPay <= 0) {
      return res.status(400).json({ message: 'Data pembayaran tidak lengkap atau nominal harus lebih besar dari 0' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get corporate invoice
      const cInv = await tx.corporateInvoice.findUnique({
        where: { id: corporateInvoiceId },
        include: { payments: true, invoices: true }
      })

      if (!cInv) throw new Error('Corporate Invoice tidak ditemukan')
      if (cInv.status === 'paid') throw new Error('Invoice ini sudah LUNAS')

      // 2. Validate amount
      const totalPaidSoFar = cInv.payments.reduce((sum, p) => sum + p.amount, 0)
      const remainingBalance = cInv.total - totalPaidSoFar

      if (amountToPay > remainingBalance + 0.01) {
        throw new Error(`Kelebihan Bayar: Jumlah (Rp ${amountToPay}) melebihi sisa (Rp ${remainingBalance})`)
      }

      // 3. Create payment
      const count = await tx.corporatePayment.count()
      const paymentNo = `CPAY-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}-${(count + 1).toString().padStart(3, '0')}`

      const payment = await tx.corporatePayment.create({
        data: {
          paymentNo,
          corporateInvoiceId,
          amount: amountToPay,
          paymentMethod,
          transactionRef,
          bankId,
          notes,
          paymentDate: new Date()
        }
      })

      // 4. Update status
      const updatedTotalPaid = totalPaidSoFar + amountToPay
      const newStatus = updatedTotalPaid >= cInv.total - 0.01 ? 'paid' : 'partial'

      const updatedCInv = await tx.corporateInvoice.update({
        where: { id: corporateInvoiceId },
        data: {
          amountPaid: updatedTotalPaid,
          status: newStatus
        }
      })

      // 5. If fully paid, mark all linked patient invoices as 'paid'
      if (newStatus === 'paid') {
        await tx.invoice.updateMany({
          where: { corporateInvoiceId },
          data: { status: 'paid' } // The corporate covered their part, so the patient invoice is now completely paid
        })
      }

      return { payment, invoice: updatedCInv }
    })

    res.status(201).json({ message: 'Pembayaran berhasil diproses', data: result })
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}

/**
 * Reset payments for a corporate invoice before posting
 */
export const resetCorporatePayment = async (req: Request, res: Response) => {
  try {
    const { corporateInvoiceId } = req.body

    if (!corporateInvoiceId) {
      return res.status(400).json({ message: 'ID Invoice Perusahaan diperlukan' })
    }

    const result = await prisma.$transaction(async (tx) => {
      const cInv = await tx.corporateInvoice.findUnique({
        where: { id: corporateInvoiceId }
      })

      if (!cInv) throw new Error('Corporate Invoice tidak ditemukan')
      if (cInv.isPosted) throw new Error('Pembayaran tidak bisa diubah karena sudah diposting ke Jurnal')
      if (cInv.amountPaid <= 0) throw new Error('Belum ada pembayaran untuk di-reset')

      // 1. Delete all payments
      await tx.corporatePayment.deleteMany({
        where: { corporateInvoiceId }
      })

      // 2. Reset Corporate Invoice
      const updatedCInv = await tx.corporateInvoice.update({
        where: { id: corporateInvoiceId },
        data: {
          amountPaid: 0,
          status: 'unpaid'
        }
      })

      // 3. Revert linked patient invoices to 'pending_corporate'
      await tx.invoice.updateMany({
        where: { corporateInvoiceId },
        data: { status: 'pending_corporate' }
      })

      return updatedCInv
    })

    res.json({ message: 'Pembayaran berhasil dibatalkan', data: result })
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}

/**
 * Post a corporate invoice payment to General Ledger
 */
export const postCorporateInvoice = async (req: Request, res: Response) => {
  try {
    const { corporateInvoiceId } = req.body
    const currentClinicId = (req as any).clinicId

    if (!corporateInvoiceId) {
      return res.status(400).json({ message: 'ID Invoice Perusahaan diperlukan' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Corporate Invoice
      const cInv = await tx.corporateInvoice.findUnique({
        where: { id: corporateInvoiceId },
        include: {
          payments: {
            include: { bank: true }
          },
          corporatePartner: true
        }
      })

      if (!cInv) throw new Error('Corporate Invoice tidak ditemukan')
      if (cInv.isPosted) throw new Error('Invoice ini sudah diposting ke Jurnal')
      if (cInv.amountPaid <= 0) throw new Error('Belum ada pembayaran yang masuk untuk diposting')

      const targetClinicId = cInv.clinicId || currentClinicId

      // 2. Resolve System Accounts
      const sysAccountKeys = ['CASH_ACCOUNT', 'BANK_ACCOUNT', 'ACCOUNTS_RECEIVABLE_B2B']
      const sysAccounts = await tx.systemAccount.findMany({
        where: { key: { in: sysAccountKeys }, OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
        include: { coa: true },
        orderBy: { clinicId: 'desc' }
      })

      const resolveSpecificCoa = async (coa: any, clinicId: string) => {
        if (!coa || !clinicId) return coa
        const clinic = await tx.clinic.findUnique({ where: { id: clinicId }, select: { code: true } })
        if (!clinic?.code) return coa

        const baseCode = coa.code.split('-').length > 2
          ? coa.code.split('-').slice(0, 2).join('-')
          : coa.code

        const specificCode = `${baseCode}-${clinic.code}`
        const specificCoa = await tx.chartOfAccount.findFirst({
          where: { code: specificCode, OR: [{ clinicId }, { clinicId: null }] }
        })
        return specificCoa || coa
      }

      const getSysAcc = async (key: string) => {
        const sys = sysAccounts.find(s => s.key === key)
        if (!sys?.coa) return null
        return await resolveSpecificCoa(sys.coa, targetClinicId)
      }

      const getCoaByCode = async (code: string) => {
        const coa = await tx.chartOfAccount.findFirst({
          where: { code, OR: [{ clinicId: targetClinicId }, { clinicId: null }] }
        })
        return await resolveSpecificCoa(coa, targetClinicId)
      }

      // 3. Define AR Account (Credit)
      const arAccount = await getSysAcc('ACCOUNTS_RECEIVABLE_B2B') || await getCoaByCode('1-1202')
      if (!arAccount) throw new Error('Akun Piutang B2B (ACCOUNTS_RECEIVABLE_B2B) tidak tersedia.')

      // 4. Generate Journals per Payment
      const journals = []
      for (const payment of cInv.payments) {
        // Define Bank/Cash Account (Debit)
        let bankAccount = null
        if (payment.bankId) {
          const bankData = await tx.bank.findUnique({ where: { id: payment.bankId }, include: { coa: true } })
          if (bankData?.coaId) bankAccount = await resolveSpecificCoa(bankData.coa, targetClinicId)
        }
        if (!bankAccount) {
          bankAccount = payment.paymentMethod === 'cash'
            ? await getSysAcc('CASH_ACCOUNT') || await getCoaByCode('1-1101')
            : await getSysAcc('BANK_ACCOUNT') || await getCoaByCode('1-1102')
        }
        if (!bankAccount) throw new Error(`Akun Kas/Bank tidak tersedia untuk metode ${payment.paymentMethod}.`)

        const journal = await tx.journalEntry.create({
          data: {
            date: payment.paymentDate,
            description: `Pelunasan Piutang B2B - Inv #${cInv.invoiceNo}`,
            referenceNo: payment.paymentNo,
            entryType: 'SYSTEM',
            clinicId: targetClinicId,
            details: {
              create: [
                { coaId: bankAccount.id, debit: payment.amount, credit: 0 },
                { coaId: arAccount.id, debit: 0, credit: payment.amount }
              ]
            }
          }
        })
        journals.push(journal)
      }

      // 5. Update Corporate Invoice
      const updatedCInv = await tx.corporateInvoice.update({
        where: { id: corporateInvoiceId },
        data: {
          isPosted: true,
          postedAt: new Date()
        }
      })

      return { updatedCInv, journals }
    })

    res.status(201).json({ message: 'Posting pelunasan Corporate B2B berhasil', data: result })
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}



