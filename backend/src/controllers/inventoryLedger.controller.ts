/**
 * InventoryLedger Controller
 * ==========================
 * Endpoint untuk:
 *  1. POST /inventory-ledger/sync/:mutationId   — Sync satu mutasi ke GL
 *  2. POST /inventory-ledger/retroactive        — Sync retroaktif (batch)
 *  3. POST /inventory-ledger/opening-balance    — Buat jurnal saldo awal Go-Live
 *  4. GET  /inventory-ledger/status/:mutationId — Cek apakah mutasi sudah di-sync
 */

import { Request, Response } from 'express'
import {
  syncInventoryToLedger,
  syncAllInventoryToLedger,
  syncOpeningBalances,
  MutationType,
} from '../services/inventoryLedger.service'
import { prisma } from '../lib/prisma'

// ─── 1. Sync Satu Mutasi ──────────────────────────────────────────────────────

/**
 * POST /inventory-ledger/sync/:mutationId
 * Body: { overrideDate?: string (ISO) }
 *
 * Digunakan untuk:
 * - Real-time: dipanggil otomatis setelah mutasi dibuat
 * - Manual: admin trigger untuk mutasi yang belum ter-sync
 */
export const syncSingleMutation = async (req: Request, res: Response) => {
  try {
    const { mutationId } = req.params
    const { overrideDate } = req.body

    if (!mutationId) {
      return res.status(400).json({ message: 'mutationId diperlukan' })
    }

    const result = await syncInventoryToLedger(mutationId, {
      overrideDate: overrideDate ? new Date(overrideDate) : undefined,
      idempotent: true,
    })

    if (result.skipped) {
      return res.json({
        success: true,
        skipped: true,
        reason: result.skipReason,
        journalEntryId: result.journalEntryId,
      })
    }

    res.status(201).json({
      success: true,
      journalEntryId: result.journalEntryId,
      referenceNo: result.referenceNo,
      description: result.description,
      totalDebit: result.totalDebit,
      totalCredit: result.totalCredit,
    })
  } catch (err) {
    console.error('[InventoryLedger] syncSingleMutation error:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}

// ─── 2. Retroactive Sync (Batch) ─────────────────────────────────────────────

/**
 * POST /inventory-ledger/retroactive
 * Body: {
 *   branchId?: string,
 *   types?: MutationType[],
 *   fromDate?: string (ISO, WIB),
 *   toDate?: string (ISO, WIB),
 *   batchSize?: number
 * }
 *
 * Digunakan untuk sinkronisasi semua transaksi lama sebelum sistem akuntansi aktif.
 * Aman dijalankan berulang kali (idempotent).
 */
export const retroactiveSync = async (req: Request, res: Response) => {
  try {
    const { branchId, types, fromDate, toDate, batchSize } = req.body
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    // Hanya admin yang bisa sync semua cabang
    const targetBranchId = branchId || (!isAdminView ? currentClinicId : undefined)

    const result = await syncAllInventoryToLedger({
      branchId: targetBranchId,
      types: types as MutationType[] | undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      batchSize: batchSize ? parseInt(batchSize) : 100,
    })

    res.json({
      success: true,
      summary: {
        total: result.total,
        synced: result.synced,
        skipped: result.skipped,
        errorCount: result.errors.length,
      },
      errors: result.errors.slice(0, 20), // Batasi error yang dikembalikan
    })
  } catch (err) {
    console.error('[InventoryLedger] retroactiveSync error:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}

// ─── 3. Opening Balance (Go-Live) ─────────────────────────────────────────────

/**
 * POST /inventory-ledger/opening-balance
 * Body: { clinicId?: string, goLiveDate: string (ISO, WIB) }
 *
 * Hitung nilai persediaan saat ini dan buat jurnal saldo awal.
 * Selisih diarahkan ke akun Modal Disetor (3-1001).
 */
export const createOpeningBalance = async (req: Request, res: Response) => {
  try {
    const { goLiveDate } = req.body
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const targetClinicId = req.body.clinicId || (!isAdminView ? currentClinicId : null)

    if (!goLiveDate) {
      return res.status(400).json({ message: 'goLiveDate diperlukan (format ISO: 2026-01-01)' })
    }

    if (!targetClinicId) {
      return res.status(400).json({ message: 'clinicId diperlukan' })
    }

    const result = await syncOpeningBalances(targetClinicId, new Date(goLiveDate))

    res.status(201).json({
      success: true,
      journalsCreated: result.journalsCreated,
      totalValue: result.totalValue,
      message: `${result.journalsCreated} jurnal saldo awal dibuat. Total nilai: Rp ${result.totalValue.toLocaleString('id-ID')}`,
    })
  } catch (err) {
    console.error('[InventoryLedger] createOpeningBalance error:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}

// ─── 4. Cek Status Sync ───────────────────────────────────────────────────────

/**
 * GET /inventory-ledger/status/:mutationId
 *
 * Cek apakah mutasi stok sudah memiliki jurnal GL.
 */
export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const { mutationId } = req.params

    const mutation = await prisma.inventoryMutation.findUnique({
      where: { id: mutationId },
      select: {
        id: true,
        type: true,
        quantity: true,
        createdAt: true,
        product: { select: { productName: true } },
      },
    })

    if (!mutation) {
      return res.status(404).json({ message: 'Mutasi tidak ditemukan' })
    }

    const referenceNo = `INV-MUT-${mutationId}`
    const journal = await prisma.journalEntry.findFirst({
      where: { referenceNo, entryType: 'SYSTEM' },
      include: {
        details: {
          include: { coa: { select: { code: true, name: true } } },
        },
      },
    })

    res.json({
      mutationId,
      productName: mutation.product?.productName,
      type: mutation.type,
      quantity: mutation.quantity,
      mutationDate: mutation.createdAt,
      isSynced: !!journal,
      journal: journal
        ? {
            id: journal.id,
            date: journal.date,
            description: journal.description,
            details: journal.details.map((d) => ({
              account: `${d.coa.code} - ${d.coa.name}`,
              debit: d.debit,
              credit: d.credit,
            })),
          }
        : null,
    })
  } catch (err) {
    console.error('[InventoryLedger] getSyncStatus error:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}

// ─── 5. Sync Summary (Dashboard) ─────────────────────────────────────────────

/**
 * GET /inventory-ledger/summary
 * Query: { branchId?, fromDate?, toDate? }
 *
 * Ringkasan status sinkronisasi: berapa mutasi yang sudah/belum di-sync.
 */
export const getSyncSummary = async (req: Request, res: Response) => {
  try {
    const { branchId, fromDate, toDate } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView
    const targetBranchId = branchId
      ? String(branchId)
      : !isAdminView
      ? currentClinicId
      : undefined

    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
    const dateFilter: any = {}
    if (fromDate) dateFilter.gte = new Date(new Date(String(fromDate)).getTime() - WIB_OFFSET_MS)
    if (toDate) {
      const end = new Date(String(toDate))
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = new Date(end.getTime() - WIB_OFFSET_MS)
    }

    const where: any = {
      type: { in: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'] },
    }
    if (targetBranchId) where.branchId = targetBranchId
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter

    const totalMutations = await prisma.inventoryMutation.count({ where })

    // Hitung yang sudah di-sync (ada journal entry dengan referenceNo INV-MUT-{id})
    const mutations = await prisma.inventoryMutation.findMany({
      where,
      select: { id: true },
    })

    const mutationIds = mutations.map((m) => m.id)
    const referenceNos = mutationIds.map((id) => `INV-MUT-${id}`)

    const syncedCount = await prisma.journalEntry.count({
      where: {
        referenceNo: { in: referenceNos },
        entryType: 'SYSTEM',
      },
    })

    res.json({
      total: totalMutations,
      synced: syncedCount,
      unsynced: totalMutations - syncedCount,
      syncPercentage:
        totalMutations > 0 ? Math.round((syncedCount / totalMutations) * 100) : 100,
    })
  } catch (err) {
    console.error('[InventoryLedger] getSyncSummary error:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}
