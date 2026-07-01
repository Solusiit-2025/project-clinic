import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, subMonths, subYears } from 'date-fns'

export const getExecutiveSummary = async (req: Request, res: Response) => {
  try {
    const clinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const { getJakartaDateString } = require('../utils/date')
    const jakartaTodayStr = getJakartaDateString()

    const today = new Date(`${jakartaTodayStr}T00:00:00+07:00`)
    const todayEnd = new Date(`${jakartaTodayStr}T23:59:59+07:00`)

    const clinicFilter = isAdminView ? {} : (clinicId ? { clinicId } : {})
    const branchFilter = isAdminView ? {} : (clinicId ? { branchId: clinicId } : {})

    // ── Period Helpers ───────────────────────────────────────────────────
    const thisMonthStart = startOfMonth(today)
    const thisMonthEnd = endOfMonth(today)
    const lastMonthStart = startOfMonth(subMonths(today, 1))
    const lastMonthEnd = endOfMonth(subMonths(today, 1))
    const thisYearStart = startOfYear(today)
    const lastYearStart = startOfYear(subYears(today, 1))
    const lastYearEnd = endOfMonth(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()))

    // ─────────────────────────────────────────────────────────────────────
    // 1. NET PROFIT & PROFITABILITY (Revenue, Expense, Margin)
    // ─────────────────────────────────────────────────────────────────────
    const [thisMonthRev, thisMonthExp, lastMonthRev, lastMonthExp, thisYearRev, thisYearExp, lastYearRev, lastYearExp] =
      await Promise.all([
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { date: { gte: thisMonthStart, lte: thisMonthEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { date: { gte: thisMonthStart, lte: thisMonthEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { date: { gte: lastMonthStart, lte: lastMonthEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { date: { gte: lastMonthStart, lte: lastMonthEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { date: { gte: thisYearStart, lte: todayEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { date: { gte: thisYearStart, lte: todayEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { date: { gte: lastYearStart, lte: lastYearEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { date: { gte: lastYearStart, lte: lastYearEnd }, ...clinicFilter } },
        }),
      ])

    const rev_m = (thisMonthRev._sum.credit || 0) - (thisMonthRev._sum.debit || 0)
    const exp_m = (thisMonthExp._sum.debit || 0) - (thisMonthExp._sum.credit || 0)
    const profit_m = rev_m - exp_m
    const margin_m = rev_m > 0 ? (profit_m / rev_m) * 100 : 0

    const rev_lm = (lastMonthRev._sum.credit || 0) - (lastMonthRev._sum.debit || 0)
    const exp_lm = (lastMonthExp._sum.debit || 0) - (lastMonthExp._sum.credit || 0)
    const profit_lm = rev_lm - exp_lm

    const rev_y = (thisYearRev._sum.credit || 0) - (thisYearRev._sum.debit || 0)
    const exp_y = (thisYearExp._sum.debit || 0) - (thisYearExp._sum.credit || 0)
    const profit_y = rev_y - exp_y
    const margin_y = rev_y > 0 ? (profit_y / rev_y) * 100 : 0

    const rev_ly = (lastYearRev._sum.credit || 0) - (lastYearRev._sum.debit || 0)
    const exp_ly = (lastYearExp._sum.debit || 0) - (lastYearExp._sum.credit || 0)
    const profit_ly = rev_ly - exp_ly

    const mom_revenue = rev_lm > 0 ? ((rev_m - rev_lm) / rev_lm) * 100 : null
    const mom_profit = profit_lm !== 0 ? ((profit_m - profit_lm) / Math.abs(profit_lm)) * 100 : null
    const yoy_revenue = rev_ly > 0 ? ((rev_y - rev_ly) / rev_ly) * 100 : null
    const yoy_profit = profit_ly !== 0 ? ((profit_y - profit_ly) / Math.abs(profit_ly)) * 100 : null

    // ─────────────────────────────────────────────────────────────────────
    // 2. CASH & BANK BALANCES (Real-time)
    // ─────────────────────────────────────────────────────────────────────
    // Bank model has: bankName, accountNumber, accountHolder, coaId, clinicId
    // Balance is tracked via COA/JournalEntry (no direct balance field on Bank)
    // We calculate bank balance from JournalDetails for each bank's COA
    const banks = await prisma.bank.findMany({
      where: isAdminView ? { isActive: true } : (clinicId ? { clinicId, isActive: true } : { isActive: true }),
      select: { id: true, bankName: true, accountNumber: true, accountHolder: true, coaId: true, clinic: { select: { name: true, code: true } } },
    })

    // Calculate balance for each bank from JournalDetails via COA
    const banksWithBalance = []
    for (const bank of banks) {
      const coaBalance = await prisma.journalDetail.aggregate({
        _sum: { debit: true, credit: true },
        where: { coaId: bank.coaId },
      })
      // For asset accounts (bank), balance = debit - credit
      const balance = (coaBalance._sum.debit || 0) - (coaBalance._sum.credit || 0)
      banksWithBalance.push({ ...bank, balance })
    }
    banksWithBalance.sort((a, b) => b.balance - a.balance)
    const totalCashBank = banksWithBalance.reduce((sum, b) => sum + b.balance, 0)

    // ─────────────────────────────────────────────────────────────────────
    // 3. AGING PIUTANG — ALL UNPAID INVOICES (B2B + Reguler)
    // ─────────────────────────────────────────────────────────────────────
    // CorporateInvoice: for top-debtor names only
    const unpaidCorporateInvoices = await prisma.corporateInvoice.findMany({
      where: {
        status: { in: ['unpaid', 'partial'] },
        ...(clinicId && !isAdminView ? { clinicId } : {}),
      },
      include: {
        corporatePartner: { select: { name: true } },
        clinic: { select: { name: true, code: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    })

    // All unpaid/partial Invoice records — split B2B vs regular
    const unpaidAllInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['unpaid', 'partial'] },
        ...(clinicId && !isAdminView ? { clinicId } : {}),
      },
      select: {
        id: true,
        invoiceDate: true,
        total: true,
        amountPaid: true,
        corporateInvoiceId: true,
        patient: { select: { name: true } },
        corporateInvoice: { select: { corporatePartner: { select: { name: true } } } },
      },
      orderBy: { invoiceDate: 'asc' },
    })

    const now = today.getTime()
    const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 }
    const agingCount  = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 }
    const agingDetails: Record<string, any[]> = { '0-30': [], '31-60': [], '61-90': [], '>90': [] }

    let totalReceivableB2B = 0  // Invoice linked to CorporateInvoice
    let totalReceivableReg = 0  // Regular patient invoice
    let totalReceivableRegCount = 0

    unpaidAllInvoices.forEach((inv) => {
      const outstanding = (inv.total || 0) - (inv.amountPaid || 0)
      if (outstanding <= 0) return

      const days = Math.floor((now - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))
      const safeDays = Math.max(0, days) // guard against future dates

      const detailItem = {
        id: inv.id,
        invoiceDate: inv.invoiceDate,
        total: inv.total,
        amountPaid: inv.amountPaid,
        outstanding,
        days: safeDays,
        type: inv.corporateInvoiceId ? 'B2B/Asuransi' : 'Reguler',
        name: inv.corporateInvoice?.corporatePartner?.name || inv.patient?.name || 'Unknown',
      }

      // Accumulate into bucket regardless of B2B or regular
      if (safeDays <= 30)       { agingBuckets['0-30']  += outstanding; agingCount['0-30']++; agingDetails['0-30'].push(detailItem) }
      else if (safeDays <= 60)  { agingBuckets['31-60'] += outstanding; agingCount['31-60']++; agingDetails['31-60'].push(detailItem) }
      else if (safeDays <= 90)  { agingBuckets['61-90'] += outstanding; agingCount['61-90']++; agingDetails['61-90'].push(detailItem) }
      else                      { agingBuckets['>90']   += outstanding; agingCount['>90']++; agingDetails['>90'].push(detailItem) }

      if (inv.corporateInvoiceId) {
        totalReceivableB2B += outstanding
      } else {
        totalReceivableReg += outstanding
        totalReceivableRegCount++
      }
    })

    // Also add CorporateInvoice that might not have linked Invoice records
    let totalReceivableCorp = 0
    const corpOnlyInvoices: typeof unpaidCorporateInvoices = []
    unpaidCorporateInvoices.forEach((inv) => {
      const outstanding = (inv.total || 0) - (inv.amountPaid || 0)
      if (outstanding <= 0) return
      // Only add to bucket if not already counted via Invoice model
      // (CorporateInvoice entries without linked Invoice records)
      totalReceivableCorp += outstanding
      corpOnlyInvoices.push(inv)
    })

    const totalReceivable = totalReceivableB2B + totalReceivableReg + totalReceivableCorp
    const totalB2B = totalReceivableB2B + totalReceivableCorp

    // ─────────────────────────────────────────────────────────────────────
    // 4. DOCTOR FINANCIAL PERFORMANCE
    // ─────────────────────────────────────────────────────────────────────
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, specialization: true },
    })

    const doctorPerf = []
    for (const doc of doctors.slice(0, 15)) {
      const [regCount, commissions] = await Promise.all([
        prisma.registration.count({
          where: {
            doctorId: doc.id,
            registrationDate: { gte: thisMonthStart, lte: thisMonthEnd },
            ...(clinicId && !isAdminView ? { clinicId } : {}),
          },
        }),
        prisma.doctorCommission.aggregate({
          _sum: { amount: true },
          where: { doctorId: doc.id, date: { gte: thisMonthStart, lte: thisMonthEnd } },
        }),
      ])
      const commissionTotal = commissions._sum?.amount || 0

      // Estimate revenue from invoices where doctor is linked (via registration)
      const invoiceRevAgg = await prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: 'paid',
          registration: { doctorId: doc.id, registrationDate: { gte: thisMonthStart, lte: thisMonthEnd } },
        },
      })
      const docRevenue = invoiceRevAgg._sum.total || 0
      const netContribution = docRevenue - commissionTotal
      const commissionRatio = docRevenue > 0 ? (commissionTotal / docRevenue) * 100 : 0

      if (regCount > 0 || docRevenue > 0) {
        doctorPerf.push({
          id: doc.id,
          name: doc.name,
          specialization: doc.specialization,
          patients: regCount,
          revenue: Math.round(docRevenue),
          commission: Math.round(commissionTotal),
          netContribution: Math.round(netContribution),
          commissionRatio: Math.round(commissionRatio * 10) / 10,
          arpv: regCount > 0 ? Math.round(docRevenue / regCount) : 0,
        })
      }
    }
    doctorPerf.sort((a, b) => b.revenue - a.revenue)

    // ─────────────────────────────────────────────────────────────────────
    // 5. INVENTORY FINANCIAL VALUE
    // ─────────────────────────────────────────────────────────────────────
    const inventoryValue = await prisma.inventoryStock.findMany({
      where: { ...(clinicId && !isAdminView ? { branchId: clinicId } : {}), onHandQty: { gt: 0 } },
      include: {
        product: { select: { productName: true, productCode: true, productType: true, purchasePrice: true } },
        branch: { select: { name: true, code: true } },
      },
      take: 500,
    })

    let totalInventoryValue = 0
    let deadStockValue = 0
    let deadStockCount = 0
    const categoryBreakdown: Record<string, { qty: number; value: number }> = {}

    inventoryValue.forEach((stock) => {
      const unitCost = stock.unitCost || 0 // unitCost is on InventoryStock directly
      const value = stock.onHandQty * unitCost
      totalInventoryValue += value

      const cat = stock.product.productType || 'Lainnya'
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { qty: 0, value: 0 }
      categoryBreakdown[cat].qty += stock.onHandQty
      categoryBreakdown[cat].value += value

      if (stock.onHandQty > 100 && value > 500000) {
        deadStockValue += value
        deadStockCount++
      }
    })

    // Top 10 by value
    const top10Products = inventoryValue
      .map((s) => ({
        name: s.product.productName,
        code: s.product.productCode,
        qty: s.onHandQty,
        value: Math.round(s.onHandQty * (s.unitCost || 0)),
        branch: s.branch.code,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Expired stock value — InventoryBatch has purchasePrice directly
    const expiredBatches = await prisma.inventoryBatch.findMany({
      where: { expiryDate: { lte: today }, currentQty: { gt: 0 }, ...(clinicId && !isAdminView ? { branchId: clinicId } : {}) },
      select: { currentQty: true, purchasePrice: true },
    })
    const expiredValue = expiredBatches.reduce(
      (sum, b) => sum + b.currentQty * (b.purchasePrice || 0), 0
    )

    // ─────────────────────────────────────────────────────────────────────
    // 6. KPI BUSINESS METRICS
    // ─────────────────────────────────────────────────────────────────────
    const [thisMonthPatients, lastMonthPatients, totalPatients, returnPatients, thisMonthAppointments, missedAppointments] =
      await Promise.all([
        prisma.registration.count({
          where: { registrationDate: { gte: thisMonthStart, lte: thisMonthEnd }, ...(clinicId && !isAdminView ? { clinicId } : {}) },
        }),
        prisma.registration.count({
          where: { registrationDate: { gte: lastMonthStart, lte: lastMonthEnd }, ...(clinicId && !isAdminView ? { clinicId } : {}) },
        }),
        prisma.patient.count(),
        // Return patients: those with more than 1 visit this month
        prisma.registration.groupBy({
          by: ['patientId'],
          where: { registrationDate: { gte: thisMonthStart, lte: thisMonthEnd }, ...(clinicId && !isAdminView ? { clinicId } : {}) },
          having: { patientId: { _count: { gt: 1 } } },
        }),
        prisma.registration.count({
          where: {
            visitType: 'appointment',
            registrationDate: { gte: thisMonthStart, lte: thisMonthEnd },
            ...(clinicId && !isAdminView ? { clinicId } : {}),
          },
        }),
        prisma.registration.count({
          where: {
            visitType: 'appointment',
            status: 'cancelled',
            registrationDate: { gte: thisMonthStart, lte: thisMonthEnd },
            ...(clinicId && !isAdminView ? { clinicId } : {}),
          },
        }),
      ])

    const arpv = thisMonthPatients > 0 ? Math.round(rev_m / thisMonthPatients) : 0
    const costPerPatient = thisMonthPatients > 0 ? Math.round(exp_m / thisMonthPatients) : 0
    const retentionRate = thisMonthPatients > 0 ? Math.round((returnPatients.length / thisMonthPatients) * 100) : 0
    const noShowRate = thisMonthAppointments > 0 ? Math.round((missedAppointments / thisMonthAppointments) * 100) : 0
    const momPatients = lastMonthPatients > 0 ? ((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100 : null

    // ─────────────────────────────────────────────────────────────────────
    // 7. MoM & YoY COMPARISON — 12-month trend
    // ─────────────────────────────────────────────────────────────────────
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(today, i))
      const mEnd = endOfMonth(subMonths(today, i))
      const [rAgg, eAgg, pCount] = await Promise.all([
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { date: { gte: mStart, lte: mEnd }, ...clinicFilter } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { date: { gte: mStart, lte: mEnd }, ...clinicFilter } },
        }),
        prisma.registration.count({
          where: { registrationDate: { gte: mStart, lte: mEnd }, ...(clinicId && !isAdminView ? { clinicId } : {}) },
        }),
      ])
      const r = (rAgg._sum.credit || 0) - (rAgg._sum.debit || 0)
      const e = (eAgg._sum.debit || 0) - (eAgg._sum.credit || 0)
      monthlyTrend.push({
        label: new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(mStart),
        revenue: Math.round(r),
        expense: Math.round(e),
        profit: Math.round(r - e),
        patients: pCount,
        margin: r > 0 ? Math.round(((r - e) / r) * 100) : 0,
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // 8. BRANCH PERFORMANCE RANKING
    // ─────────────────────────────────────────────────────────────────────
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true, code: true, isMain: true },
    })

    const branchRanking = []
    for (const c of clinics) {
      const [brRev, brExp, brPatients, brStock] = await Promise.all([
        prisma.journalDetail.aggregate({
          _sum: { credit: true, debit: true },
          where: { coa: { category: 'REVENUE' }, journalEntry: { clinicId: c.id, date: { gte: thisMonthStart, lte: thisMonthEnd } } },
        }),
        prisma.journalDetail.aggregate({
          _sum: { debit: true, credit: true },
          where: { coa: { category: 'EXPENSE' }, journalEntry: { clinicId: c.id, date: { gte: thisMonthStart, lte: thisMonthEnd } } },
        }),
        prisma.registration.count({
          where: { clinicId: c.id, registrationDate: { gte: thisMonthStart, lte: thisMonthEnd } },
        }),
        prisma.inventoryStock.aggregate({
          _sum: { onHandQty: true },
          where: { branchId: c.id },
        }),
      ])
      const r = (brRev._sum.credit || 0) - (brRev._sum.debit || 0)
      const e = (brExp._sum.debit || 0) - (brExp._sum.credit || 0)
      const profit = r - e
      branchRanking.push({
        id: c.id,
        name: c.name,
        code: c.code,
        isMain: c.isMain,
        revenue: Math.round(r),
        expense: Math.round(e),
        profit: Math.round(profit),
        margin: r > 0 ? Math.round((profit / r) * 100) : 0,
        patients: brPatients,
        arpv: brPatients > 0 ? Math.round(r / brPatients) : 0,
        stock: Math.round(brStock._sum.onHandQty || 0),
        efficiency: brPatients > 0 ? Math.round(e / brPatients) : 0,
      })
    }
    branchRanking.sort((a, b) => b.revenue - a.revenue)

    // ─────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────
    res.json({
      // 1. Profitability
      profitability: {
        thisMonth: { revenue: Math.round(rev_m), expense: Math.round(exp_m), profit: Math.round(profit_m), margin: Math.round(margin_m * 10) / 10 },
        lastMonth: { revenue: Math.round(rev_lm), expense: Math.round(exp_lm), profit: Math.round(profit_lm) },
        thisYear: { revenue: Math.round(rev_y), expense: Math.round(exp_y), profit: Math.round(profit_y), margin: Math.round(margin_y * 10) / 10 },
        lastYear: { revenue: Math.round(rev_ly), expense: Math.round(exp_ly), profit: Math.round(profit_ly) },
        mom: { revenue: mom_revenue !== null ? Math.round(mom_revenue * 10) / 10 : null, profit: mom_profit !== null ? Math.round(mom_profit * 10) / 10 : null },
        yoy: { revenue: yoy_revenue !== null ? Math.round(yoy_revenue * 10) / 10 : null, profit: yoy_profit !== null ? Math.round(yoy_profit * 10) / 10 : null },
      },

      // 2. Cash & Bank
      cashBank: {
        total: Math.round(totalCashBank),
        accounts: banksWithBalance.map((b) => ({
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountName: b.accountHolder,
          balance: b.balance || 0,
          branch: b.clinic?.name || '-',
          branchCode: b.clinic?.code || '-',
        })),
        burnRate: exp_m > 0 ? Math.round(exp_m / 30) : 0, // daily burn rate
        runway: exp_m > 0 ? Math.round(totalCashBank / (exp_m / 30)) : 0, // days
      },

      // 3. Aging Receivable
      aging: {
        totalReceivable: Math.round(totalReceivable),
        unpaidRegular: Math.round(totalReceivableReg),
        unpaidRegularCount: totalReceivableRegCount,
        buckets: [
          { label: '0-30 hari', value: Math.round(agingBuckets['0-30']), count: agingCount['0-30'], pct: totalReceivable > 0 ? Math.round((agingBuckets['0-30'] / totalReceivable) * 100) : 0, color: 'emerald', details: agingDetails['0-30'] },
          { label: '31-60 hari', value: Math.round(agingBuckets['31-60']), count: agingCount['31-60'], pct: totalReceivable > 0 ? Math.round((agingBuckets['31-60'] / totalReceivable) * 100) : 0, color: 'amber', details: agingDetails['31-60'] },
          { label: '61-90 hari', value: Math.round(agingBuckets['61-90']), count: agingCount['61-90'], pct: totalReceivable > 0 ? Math.round((agingBuckets['61-90'] / totalReceivable) * 100) : 0, color: 'orange', details: agingDetails['61-90'] },
          { label: '>90 hari', value: Math.round(agingBuckets['>90']), count: agingCount['>90'], pct: totalReceivable > 0 ? Math.round((agingBuckets['>90'] / totalReceivable) * 100) : 0, color: 'rose', details: agingDetails['>90'] },
        ],
        topDebtors: unpaidCorporateInvoices.slice(0, 5).map((inv) => ({
          partner: inv.corporatePartner.name,
          type: 'Corporate',
          amount: Math.round((inv.total || 0) - (inv.amountPaid || 0)),
          days: Math.floor((now - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)),
          branch: inv.clinic?.code || '-',
        })),
      },

      // 4. Doctor Performance
      doctorPerformance: {
        data: doctorPerf,
        period: `${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(thisMonthStart)}`,
      },

      // 5. Inventory Value
      inventoryFinancial: {
        totalValue: Math.round(totalInventoryValue),
        expiredValue: Math.round(expiredValue),
        deadStockValue: Math.round(deadStockValue),
        deadStockCount,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([cat, d]) => ({
          category: cat, qty: d.qty, value: Math.round(d.value),
        })).sort((a, b) => b.value - a.value),
        top10: top10Products,
      },

      // 6. KPI Business
      kpi: {
        arpv,
        costPerPatient,
        grossMargin: Math.round(margin_m * 10) / 10,
        retentionRate,
        noShowRate,
        thisMonthPatients,
        lastMonthPatients,
        momPatients: momPatients !== null ? Math.round(momPatients * 10) / 10 : null,
        totalPatients,
      },

      // 7. Monthly Trend (MoM/YoY)
      monthlyTrend,
      comparison: {
        mom: { revenue: mom_revenue, profit: mom_profit },
        yoy: { revenue: yoy_revenue, profit: yoy_profit },
      },

      // 8. Branch Ranking
      branchRanking,

      // Meta
      generatedAt: new Date().toISOString(),
      period: {
        thisMonth: { start: thisMonthStart.toISOString(), end: thisMonthEnd.toISOString() },
        lastMonth: { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() },
      },
    })
  } catch (e) {
    console.error('[ExecutiveSummary] Error:', e)
    res.status(500).json({ message: (e as Error).message })
  }
}
