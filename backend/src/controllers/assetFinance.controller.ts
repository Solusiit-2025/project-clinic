/**
 * Asset Finance Controller
 * ========================
 * Mengelola operasi keuangan aset tetap:
 *
 * A. Penyusutan (Depreciation):
 *    Debit  6-1501 Beban Penyusutan Aset Tetap
 *    Kredit 1-2102 Akumulasi Penyusutan Alat Medis
 *
 * B. Penghapusan Aset (Disposal):
 *    Debit  1-2102 Akumulasi Penyusutan (total yg sudah dicatat)
 *    Debit  6-xxxx Rugi Pelepasan Aset (jika nilai buku > 0)
 *    Kredit 1-2101 Peralatan Medis (harga beli)
 *
 * C. Asset Register (Daftar Aset + Nilai Buku)
 *
 * D. Sync Opening Balance (untuk aset yang sudah ada sebelum sistem)
 */

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveCoa(key: string, fallbackCode: string, clinicId: string) {
  const sys = await prisma.systemAccount.findFirst({
    where: { key, OR: [{ clinicId }, { clinicId: null }] },
    include: { coa: true },
    orderBy: { clinicId: 'desc' },
  })
  if (sys?.coa) return sys.coa

  const coa = await prisma.chartOfAccount.findFirst({
    where: { code: fallbackCode, OR: [{ clinicId }, { clinicId: null }] },
  })
  if (!coa) throw new Error(`COA tidak ditemukan: key="${key}", fallback="${fallbackCode}"`)
  return coa
}

/**
 * Hitung penyusutan per bulan dengan multiple methods
 * 1. Straight-Line Method: (Harga Beli - Nilai Sisa) / (Umur Ekonomis × 12)
 * 2. Declining Balance Method: Nilai Buku × Rate / 12
 */
function calcMonthlyDepreciation(asset: {
  purchasePrice: number
  salvageValue: number
  usefulLifeYears: number
  depreciationMethod: string // 'STRAIGHT_LINE' | 'DECLINING_BALANCE'
  totalDepreciated: number
  depreciationRate?: number // untuk declining balance (default: 0.2 = 20%)
}): number {
  if (asset.depreciationMethod === 'DECLINING_BALANCE') {
    const rate = asset.depreciationRate || 0.2 // default 20% per tahun
    const bookValue = asset.purchasePrice - asset.totalDepreciated
    const monthlyDep = bookValue * rate / 12
    
    // Pastikan tidak kurang dari nilai sisa
    const minBookValue = asset.salvageValue
    if (bookValue - monthlyDep < minBookValue) {
      return Math.max(0, bookValue - minBookValue)
    }
    return monthlyDep
  }
  
  // Default: Straight-Line Method
  const depreciableAmount = asset.purchasePrice - asset.salvageValue
  if (depreciableAmount <= 0) return 0
  return depreciableAmount / (asset.usefulLifeYears * 12)
}

// ─── 1. Catat Penyusutan Bulanan ──────────────────────────────────────────────

/**
 * POST /api/assets/:id/depreciate
 * Body: { period: "2026-04" (YYYY-MM), amount?: number (override), notes?: string }
 *
 * Mencatat beban penyusutan untuk satu aset pada periode tertentu.
 * Idempotent — tidak bisa catat dua kali untuk periode yang sama.
 */
export const depreciateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { period, amount, notes } = req.body
    const clinicId = (req as any).clinicId

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: 'period wajib diisi format YYYY-MM (contoh: 2026-04)' })
    }

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan' })
    if (asset.status === 'retired') return res.status(400).json({ message: 'Aset sudah dihapus (retired), tidak bisa disusutkan' })

    const assetClinicId = asset.clinicId || clinicId

    // Idempotency: cek apakah periode ini sudah dicatat
    const referenceNo = `DEP-${asset.assetCode}-${period}`
    const existing = await prisma.journalEntry.findFirst({
      where: { referenceNo, entryType: 'SYSTEM' }
    })
    if (existing) {
      return res.status(400).json({
        message: `Penyusutan periode ${period} untuk aset ${asset.assetCode} sudah dicatat`,
        journalEntryId: existing.id
      })
    }

    // Hitung nilai buku saat ini
    const bookValue = asset.purchasePrice - asset.totalDepreciated
    if (bookValue <= asset.salvageValue) {
      return res.status(400).json({
        message: `Nilai buku aset (Rp ${bookValue.toLocaleString('id-ID')}) sudah mencapai nilai sisa (Rp ${asset.salvageValue.toLocaleString('id-ID')}). Tidak perlu disusutkan lagi.`
      })
    }

    // Tentukan jumlah penyusutan
    const monthlyDep = calcMonthlyDepreciation({
      purchasePrice: asset.purchasePrice,
      salvageValue: asset.salvageValue,
      usefulLifeYears: asset.usefulLifeYears,
      depreciationMethod: asset.depreciationMethod,
      totalDepreciated: asset.totalDepreciated,
    })
    // Jangan melebihi nilai buku - nilai sisa
    const maxDep = bookValue - asset.salvageValue
    const depAmount = Math.min(amount ? Number(amount) : monthlyDep, maxDep)

    if (depAmount <= 0) {
      return res.status(400).json({ message: 'Jumlah penyusutan tidak valid' })
    }

    // Resolve COA
    const depExpenseCoa = await resolveCoa('DEPRECIATION_EXPENSE', '6-1501', assetClinicId)
    const accumDepCoa = asset.coaAccumDepId
      ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAccumDepId } })
      : await resolveCoa('ACCUM_DEPRECIATION', '1-2102', assetClinicId)

    if (!accumDepCoa) throw new Error('COA Akumulasi Penyusutan (1-2102) tidak ditemukan')

    // Tanggal jurnal: akhir bulan periode
    const [year, month] = period.split('-').map(Number)
    const journalDate = new Date(year, month, 0) // hari terakhir bulan

    const result = await prisma.$transaction(async (tx) => {
      // Buat jurnal penyusutan
      const journal = await tx.journalEntry.create({
        data: {
          date: journalDate,
          description: `Penyusutan ${period}: ${asset.assetName} (${asset.assetCode})`,
          referenceNo,
          entryType: 'SYSTEM',
          clinicId: assetClinicId,
          details: {
            create: [
              {
                coaId: depExpenseCoa.id,
                debit: depAmount,
                credit: 0,
                description: `Beban Penyusutan ${asset.assetName} - ${period}`,
              },
              {
                coaId: accumDepCoa.id,
                debit: 0,
                credit: depAmount,
                description: `Akumulasi Penyusutan ${asset.assetName} - ${period}`,
              },
            ],
          },
        },
      })

      // Update asset: totalDepreciated dan currentValue
      const newTotalDepreciated = asset.totalDepreciated + depAmount
      const newCurrentValue = asset.purchasePrice - newTotalDepreciated

      await tx.asset.update({
        where: { id },
        data: {
          totalDepreciated: newTotalDepreciated,
          currentValue: newCurrentValue,
        },
      })

      return { journal, depAmount, newCurrentValue, newTotalDepreciated }
    })

    res.status(201).json({
      success: true,
      message: `Penyusutan ${period} berhasil dicatat`,
      journalEntryId: result.journal.id,
      referenceNo,
      depreciationAmount: result.depAmount,
      newBookValue: result.newCurrentValue,
      totalDepreciated: result.newTotalDepreciated,
    })
  } catch (err: any) {
    console.error('[AssetFinance] depreciateAsset error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ─── 2. Penyusutan Massal (Semua Aset Aktif) ─────────────────────────────────

/**
 * POST /api/assets/depreciate-all
 * Body: { period: "2026-04", clinicId?: string }
 *
 * Catat penyusutan untuk SEMUA aset aktif dalam satu klik.
 * Cocok untuk proses akhir bulan.
 */
export const depreciateAllAssets = async (req: Request, res: Response) => {
  try {
    const { period, clinicId: bodyClinicId } = req.body
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const targetClinicId = bodyClinicId || (!isAdminView ? currentClinicId : undefined)

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: 'period wajib diisi format YYYY-MM' })
    }

    const assets = await prisma.asset.findMany({
      where: {
        status: 'active',
        ...(targetClinicId ? { clinicId: targetClinicId } : {}),
        purchasePrice: { gt: 0 },
      },
    })

    const results = { synced: 0, skipped: 0, errors: [] as string[] }

    for (const asset of assets) {
      const referenceNo = `DEP-${asset.assetCode}-${period}`
      const existing = await prisma.journalEntry.findFirst({ where: { referenceNo } })
      if (existing) { results.skipped++; continue }

      const bookValue = asset.purchasePrice - asset.totalDepreciated
      if (bookValue <= asset.salvageValue) { results.skipped++; continue }

      try {
        const assetClinicId = asset.clinicId || currentClinicId
        const depExpenseCoa = await resolveCoa('DEPRECIATION_EXPENSE', '6-1501', assetClinicId)
        const accumDepCoa = asset.coaAccumDepId
          ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAccumDepId } })
          : await resolveCoa('ACCUM_DEPRECIATION', '1-2102', assetClinicId)

        if (!accumDepCoa) throw new Error('COA Akumulasi Penyusutan tidak ditemukan')

        const monthlyDep = calcMonthlyDepreciation({
          purchasePrice: asset.purchasePrice,
          salvageValue: asset.salvageValue,
          usefulLifeYears: asset.usefulLifeYears,
          depreciationMethod: asset.depreciationMethod,
          totalDepreciated: asset.totalDepreciated,
        })
        const maxDep = bookValue - asset.salvageValue
        const depAmount = Math.min(monthlyDep, maxDep)
        if (depAmount <= 0) { results.skipped++; continue }

        const [year, month] = period.split('-').map(Number)
        const journalDate = new Date(year, month, 0)

        await prisma.$transaction(async (tx) => {
          await tx.journalEntry.create({
            data: {
              date: journalDate,
              description: `Penyusutan ${period}: ${asset.assetName} (${asset.assetCode})`,
              referenceNo,
              entryType: 'SYSTEM',
              clinicId: assetClinicId,
              details: {
                create: [
                  { coaId: depExpenseCoa.id, debit: depAmount, credit: 0, description: `Beban Penyusutan ${asset.assetName}` },
                  { coaId: accumDepCoa.id, debit: 0, credit: depAmount, description: `Akumulasi Penyusutan ${asset.assetName}` },
                ],
              },
            },
          })
          await tx.asset.update({
            where: { id: asset.id },
            data: {
              totalDepreciated: asset.totalDepreciated + depAmount,
              currentValue: asset.purchasePrice - (asset.totalDepreciated + depAmount),
            },
          })
        })
        results.synced++
      } catch (err: any) {
        results.errors.push(`${asset.assetCode}: ${err.message}`)
      }
    }

    res.json({
      success: true,
      period,
      total: assets.length,
      synced: results.synced,
      skipped: results.skipped,
      errorCount: results.errors.length,
      errors: results.errors.slice(0, 10),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 3. Penghapusan Aset (Disposal) ──────────────────────────────────────────

/**
 * POST /api/assets/:id/dispose
 * Body: { disposalDate: "2026-04-24", disposalValue?: number, notes?: string }
 *
 * Mencatat penghapusan aset dari pembukuan.
 * Jurnal:
 *   Debit  1-2102 Akumulasi Penyusutan (total yg sudah dicatat)
 *   Debit  6-xxxx Rugi Pelepasan (jika nilai buku > disposal value)
 *   Kredit 1-2101 Peralatan Medis (harga beli penuh)
 *   Kredit 1-1101 Kas (jika ada nilai jual)
 */
export const disposeAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { disposalDate, disposalValue, notes } = req.body
    const clinicId = (req as any).clinicId

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return res.status(404).json({ message: 'Aset tidak ditemukan' })
    if (asset.status === 'retired') return res.status(400).json({ message: 'Aset sudah dihapus' })

    const assetClinicId = asset.clinicId || clinicId
    const saleValue = disposalValue ? Number(disposalValue) : 0
    const bookValue = asset.purchasePrice - asset.totalDepreciated
    const gainLoss = saleValue - bookValue // positif = laba, negatif = rugi

    // Resolve COA
    const assetCoa = asset.coaAssetId
      ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAssetId } })
      : await resolveCoa('FIXED_ASSET', '1-2101', assetClinicId)

    const accumDepCoa = asset.coaAccumDepId
      ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAccumDepId } })
      : await resolveCoa('ACCUM_DEPRECIATION', '1-2102', assetClinicId)

    if (!assetCoa || !accumDepCoa) throw new Error('COA aset tidak ditemukan')

    const referenceNo = `DISP-${asset.assetCode}`
    const existing = await prisma.journalEntry.findFirst({ where: { referenceNo } })
    if (existing) return res.status(400).json({ message: 'Aset ini sudah pernah dihapus dari pembukuan' })

    const journalDate = disposalDate
      ? new Date(`${disposalDate}T00:00:00+07:00`)
      : new Date()

    const result = await prisma.$transaction(async (tx) => {
      const details: any[] = []

      // Debit: Akumulasi Penyusutan (hapus dari contra-asset)
      if (asset.totalDepreciated > 0) {
        details.push({
          coaId: accumDepCoa.id,
          debit: asset.totalDepreciated,
          credit: 0,
          description: `Hapus Akumulasi Penyusutan: ${asset.assetName}`,
        })
      }

      // Kredit: Nilai beli aset (hapus dari aset)
      details.push({
        coaId: assetCoa.id,
        debit: 0,
        credit: asset.purchasePrice,
        description: `Hapus Aset: ${asset.assetName} (${asset.assetCode})`,
      })

      // Jika ada nilai jual: Debit Kas
      if (saleValue > 0) {
        const cashCoa = await resolveCoa('CASH_ACCOUNT', '1-1101', assetClinicId)
        details.push({
          coaId: cashCoa.id,
          debit: saleValue,
          credit: 0,
          description: `Penerimaan Penjualan Aset: ${asset.assetName}`,
        })
      }

      // Rugi/Laba pelepasan
      if (gainLoss < 0) {
        // Rugi: Debit beban
        const lossAmount = Math.abs(gainLoss)
        const lossCoa = await resolveCoa('DEPRECIATION_EXPENSE', '6-1501', assetClinicId)
        details.push({
          coaId: lossCoa.id,
          debit: lossAmount,
          credit: 0,
          description: `Rugi Pelepasan Aset: ${asset.assetName}`,
        })
      } else if (gainLoss > 0) {
        // Laba: Kredit pendapatan lain-lain
        const gainCoa = await prisma.chartOfAccount.findFirst({
          where: { code: '8-1201', OR: [{ clinicId: assetClinicId }, { clinicId: null }] }
        }) || await resolveCoa('RETAINED_EARNINGS', '3-2001', assetClinicId)
        details.push({
          coaId: gainCoa.id,
          debit: 0,
          credit: gainLoss,
          description: `Laba Pelepasan Aset: ${asset.assetName}`,
        })
      }

      const journal = await tx.journalEntry.create({
        data: {
          date: journalDate,
          description: `Penghapusan Aset: ${asset.assetName} (${asset.assetCode})`,
          referenceNo,
          entryType: 'SYSTEM',
          clinicId: assetClinicId,
          details: { create: details },
        },
      })

      // Update status aset
      await tx.asset.update({
        where: { id },
        data: {
          status: 'retired',
          currentValue: 0,
          notes: `${asset.notes || ''}\n[DISPOSED ${journalDate.toISOString().split('T')[0]}] ${notes || ''}`.trim(),
        },
      })

      return { journal, bookValue, saleValue, gainLoss }
    })

    res.json({
      success: true,
      message: `Aset ${asset.assetCode} berhasil dihapus dari pembukuan`,
      journalEntryId: result.journal.id,
      bookValue: result.bookValue,
      saleValue: result.saleValue,
      gainLoss: result.gainLoss,
      gainLossLabel: result.gainLoss >= 0 ? 'Laba Pelepasan' : 'Rugi Pelepasan',
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 4. Asset Register (Daftar Aset + Nilai Buku) ────────────────────────────

/**
 * GET /api/assets/register
 * Query: { clinicId?, assetType?, status? }
 *
 * Laporan daftar aset lengkap dengan nilai buku dan info penyusutan.
 */
export const getAssetRegister = async (req: Request, res: Response) => {
  try {
    const { clinicId: queryClinicId, assetType, status } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const targetClinicId = queryClinicId
      ? String(queryClinicId)
      : !isAdminView ? currentClinicId : undefined

    const assets = await prisma.asset.findMany({
      where: {
        ...(targetClinicId ? { clinicId: targetClinicId } : {}),
        ...(assetType ? { assetType: String(assetType) } : {}),
        ...(status ? { status: String(status) } : { status: { not: 'retired' } }),
      },
      include: {
        clinic: { select: { name: true, code: true } },
        coaAsset: { select: { code: true, name: true } },
        coaAccumDep: { select: { code: true, name: true } },
      },
      orderBy: [{ assetType: 'asc' }, { assetCode: 'asc' }],
    })

    // Hitung summary per tipe
    const summary: Record<string, { count: number; totalCost: number; totalDepreciated: number; totalBookValue: number }> = {}
    let grandTotalCost = 0, grandTotalDepreciated = 0, grandTotalBookValue = 0

    const register = assets.map(a => {
      const bookValue = a.purchasePrice - a.totalDepreciated
      const monthlyDep = calcMonthlyDepreciation({
        purchasePrice: a.purchasePrice,
        salvageValue: a.salvageValue,
        usefulLifeYears: a.usefulLifeYears,
        depreciationMethod: a.depreciationMethod,
        totalDepreciated: a.totalDepreciated,
      })
      const remainingMonths = monthlyDep > 0
        ? Math.max(0, Math.ceil((bookValue - a.salvageValue) / monthlyDep))
        : 0

      if (!summary[a.assetType]) {
        summary[a.assetType] = { count: 0, totalCost: 0, totalDepreciated: 0, totalBookValue: 0 }
      }
      summary[a.assetType].count++
      summary[a.assetType].totalCost += a.purchasePrice
      summary[a.assetType].totalDepreciated += a.totalDepreciated
      summary[a.assetType].totalBookValue += bookValue

      grandTotalCost += a.purchasePrice
      grandTotalDepreciated += a.totalDepreciated
      grandTotalBookValue += bookValue

      return {
        id: a.id,
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        category: a.category,
        purchaseDate: a.purchaseDate,
        purchasePrice: a.purchasePrice,
        salvageValue: a.salvageValue,
        usefulLifeYears: a.usefulLifeYears,
        totalDepreciated: a.totalDepreciated,
        bookValue,
        monthlyDepreciation: monthlyDep,
        remainingMonths,
        depreciationPercent: a.purchasePrice > 0
          ? Math.round((a.totalDepreciated / a.purchasePrice) * 100)
          : 0,
        status: a.status,
        condition: a.condition,
        clinic: a.clinic,
        coaAsset: a.coaAsset,
        coaAccumDep: a.coaAccumDep,
      }
    })

    res.json({
      assets: register,
      summary,
      totals: {
        count: assets.length,
        grandTotalCost,
        grandTotalDepreciated,
        grandTotalBookValue,
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

// ─── 5. Sync Opening Balance Aset (untuk aset yang sudah ada) ────────────────

/**
 * POST /api/assets/sync-opening-balance
 * Body: { goLiveDate: "2026-01-01", clinicId? }
 *
 * Buat jurnal saldo awal untuk semua aset yang sudah ada sebelum sistem aktif.
 * Debit  1-2101/1-2201 Aset Tetap (harga beli)
 * Kredit 1-2102 Akumulasi Penyusutan (total yg sudah disusutkan)
 * Kredit 3-1001 Modal Disetor (selisih = nilai buku)
 */
export const syncAssetOpeningBalance = async (req: Request, res: Response) => {
  try {
    const { goLiveDate, clinicId: bodyClinicId } = req.body
    const currentClinicId = (req as any).clinicId
    const targetClinicId = bodyClinicId || currentClinicId

    if (!goLiveDate) return res.status(400).json({ message: 'goLiveDate wajib diisi' })

    const assets = await prisma.asset.findMany({
      where: { clinicId: targetClinicId, status: { not: 'retired' }, purchasePrice: { gt: 0 } },
    })

    let created = 0, skipped = 0

    for (const asset of assets) {
      const referenceNo = `ASSET-OB-${asset.assetCode}`
      const existing = await prisma.journalEntry.findFirst({ where: { referenceNo } })
      if (existing) { skipped++; continue }

      const assetClinicId = asset.clinicId || currentClinicId
      const bookValue = asset.purchasePrice - asset.totalDepreciated

      const assetCoa = asset.coaAssetId
        ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAssetId } })
        : await resolveCoa('FIXED_ASSET', '1-2101', assetClinicId).catch(() => null)

      const accumDepCoa = asset.coaAccumDepId
        ? await prisma.chartOfAccount.findUnique({ where: { id: asset.coaAccumDepId } })
        : await resolveCoa('ACCUM_DEPRECIATION', '1-2102', assetClinicId).catch(() => null)

      const capitalCoa = await resolveCoa('OWNER_CAPITAL', '3-1001', assetClinicId).catch(() => null)

      if (!assetCoa || !capitalCoa) { skipped++; continue }

      const details: any[] = [
        { coaId: assetCoa.id, debit: asset.purchasePrice, credit: 0, description: `Saldo Awal Aset: ${asset.assetName}` },
      ]

      if (accumDepCoa && asset.totalDepreciated > 0) {
        details.push({
          coaId: accumDepCoa.id, debit: 0, credit: asset.totalDepreciated,
          description: `Akumulasi Penyusutan Awal: ${asset.assetName}`,
        })
      }

      details.push({
        coaId: capitalCoa.id, debit: 0, credit: bookValue,
        description: `Modal Awal Aset: ${asset.assetName}`,
      })

      await prisma.journalEntry.create({
        data: {
          date: new Date(`${goLiveDate}T00:00:00+07:00`),
          description: `Saldo Awal Aset Go-Live: ${asset.assetName} (${asset.assetCode})`,
          referenceNo,
          entryType: 'SYSTEM',
          clinicId: assetClinicId,
          details: { create: details },
        },
      })
      created++
    }

    res.json({
      success: true,
      message: `${created} jurnal saldo awal aset dibuat`,
      created,
      skipped,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}
