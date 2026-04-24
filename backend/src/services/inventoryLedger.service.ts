/**
 * InventoryLedgerService
 * =====================
 * Menghubungkan transaksi stok fisik ke General Ledger (GL) menggunakan COA yang sudah ditentukan.
 *
 * Accounting Rules:
 *  - Stok Masuk (Procurement GRN):
 *      Debit  1-1301/1302/1303 (Persediaan sesuai kategori)
 *      Kredit 2-1101            (Hutang Dagang)
 *
 *  - Stok Keluar / Penjualan (Dispensing):
 *      Debit  5-1101            (HPP Obat-obatan)
 *      Kredit 1-1301/1302/1303  (Persediaan sesuai kategori)
 *
 *  - Penyesuaian Positif (ADJUSTMENT +):
 *      Debit  1-1301/1302/1303  (Persediaan)
 *      Kredit 3-2001            (Laba Ditahan / Equity)
 *
 *  - Penyesuaian Negatif (ADJUSTMENT -):
 *      Debit  5-1101            (HPP / Beban)
 *      Kredit 1-1301/1302/1303  (Persediaan)
 *
 *  - Transfer Keluar (TRANSFER OUT):
 *      Debit  1-1301/1302/1303 (Persediaan Cabang Tujuan — dicatat di cabang tujuan)
 *      Kredit 1-1301/1302/1303 (Persediaan Cabang Asal)
 *      → Dicatat sebagai dua jurnal terpisah per cabang.
 *
 *  - Saldo Awal Go-Live (Opening Balance):
 *      Debit  1-1301/1302/1303  (Persediaan)
 *      Kredit 3-1001            (Modal Disetor / Equity)
 *
 * Timezone: Semua tanggal jurnal dikompensasi UTC+7 (WIB).
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

// ─── Constants ────────────────────────────────────────────────────────────────

/** UTC offset untuk WIB (UTC+7) dalam milidetik */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * Konversi timestamp UTC ke tanggal WIB (jam 00:00:00 WIB).
 * Mencegah transaksi subuh (00:00–06:59 UTC) masuk ke tanggal sebelumnya di buku besar.
 */
function toWIBDate(utcDate: Date): Date {
  const wibMs = utcDate.getTime() + WIB_OFFSET_MS
  const wib = new Date(wibMs)
  // Kembalikan sebagai UTC midnight agar Prisma menyimpan dengan benar
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MutationType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'OPENING_BALANCE'

export interface SyncResult {
  journalEntryId: string
  referenceNo: string
  description: string
  totalDebit: number
  totalCredit: number
  skipped?: boolean
  skipReason?: string
}

// ─── COA Resolution Helpers ───────────────────────────────────────────────────

/**
 * Resolusi akun COA dari SystemAccount atau fallback ke kode COA langsung.
 * Urutan prioritas: SystemAccount (clinic-specific) → SystemAccount (global) → COA by code
 */
async function resolveAccount(
  tx: Prisma.TransactionClient,
  key: string,
  fallbackCode: string,
  clinicId: string
): Promise<{ id: string; code: string; name: string }> {
  // 1. Cari di SystemAccount (clinic-specific dulu, lalu global)
  const sysAccount = await tx.systemAccount.findFirst({
    where: {
      key,
      OR: [{ clinicId }, { clinicId: null }],
    },
    include: { coa: true },
    orderBy: { clinicId: 'desc' }, // clinic-specific lebih prioritas
  })

  if (sysAccount?.coa) {
    return { id: sysAccount.coa.id, code: sysAccount.coa.code, name: sysAccount.coa.name }
  }

  // 2. Fallback ke kode COA langsung
  const coa = await tx.chartOfAccount.findFirst({
    where: {
      code: fallbackCode,
      OR: [{ clinicId }, { clinicId: null }],
    },
  })

  if (!coa) {
    throw new Error(
      `Akun COA tidak ditemukan: key="${key}", fallback="${fallbackCode}". ` +
      `Pastikan System Accounts sudah dikonfigurasi atau COA dengan kode ${fallbackCode} tersedia.`
    )
  }

  return { id: coa.id, code: coa.code, name: coa.name }
}

/**
 * Tentukan akun Persediaan (1-1301/1302/1303) berdasarkan kategori produk.
 * Mapping: MEDICINE/OBAT → 1-1301, ALKES → 1-1302, SKINCARE → 1-1303
 *
 * Key priority (tiered fallback):
 *   INVENTORY_MEDICINE / INVENTORY_ALKES / INVENTORY_SKINCARE
 *   → INVENTORY_ACCOUNT  (key lama yang sudah ada di DB)
 *   → COA by code (1-1301 / 1-1302 / 1-1303)
 */
async function resolveInventoryAccount(
  tx: Prisma.TransactionClient,
  productId: string,
  clinicId: string
): Promise<{ id: string; code: string; name: string }> {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: {
      productName: true,
      masterProduct: {
        select: {
          productCategory: {
            select: { categoryName: true }
          }
        }
      }
    },
  })

  const categoryRaw = (
    product?.masterProduct?.productCategory?.categoryName || ''
  ).toLowerCase()

  // Mapping kategori → kode COA + system key spesifik
  let coaCode = '1-1301' // Default: Persediaan Obat-obatan
  let specificKey = 'INVENTORY_MEDICINE'

  if (
    categoryRaw.includes('alkes') ||
    categoryRaw.includes('medical') ||
    categoryRaw.includes('kesehatan') ||
    categoryRaw.includes('equipment')
  ) {
    coaCode = '1-1302'
    specificKey = 'INVENTORY_ALKES'
  } else if (
    categoryRaw.includes('skincare') ||
    categoryRaw.includes('skin') ||
    categoryRaw.includes('kosmetik') ||
    categoryRaw.includes('kecantikan')
  ) {
    coaCode = '1-1303'
    specificKey = 'INVENTORY_SKINCARE'
  }

  // Tier 1: coba key spesifik per kategori (INVENTORY_MEDICINE, dll.)
  const specificSysAcc = await tx.systemAccount.findFirst({
    where: {
      key: specificKey,
      OR: [{ clinicId }, { clinicId: null }],
    },
    include: { coa: true },
    orderBy: { clinicId: 'desc' },
  })
  if (specificSysAcc?.coa) {
    return { id: specificSysAcc.coa.id, code: specificSysAcc.coa.code, name: specificSysAcc.coa.name }
  }

  // Tier 2: fallback ke INVENTORY_ACCOUNT (key lama yang sudah ada di DB)
  const genericSysAcc = await tx.systemAccount.findFirst({
    where: {
      key: 'INVENTORY_ACCOUNT',
      OR: [{ clinicId }, { clinicId: null }],
    },
    include: { coa: true },
    orderBy: { clinicId: 'desc' },
  })
  if (genericSysAcc?.coa) {
    return { id: genericSysAcc.coa.id, code: genericSysAcc.coa.code, name: genericSysAcc.coa.name }
  }

  // Tier 3: fallback langsung ke kode COA
  const coa = await tx.chartOfAccount.findFirst({
    where: {
      code: coaCode,
      OR: [{ clinicId }, { clinicId: null }],
    },
  })
  if (!coa) {
    throw new Error(
      `Akun Persediaan tidak ditemukan: key="${specificKey}", fallback="${coaCode}". ` +
      `Pastikan COA ${coaCode} tersedia atau petakan INVENTORY_ACCOUNT di System Accounts.`
    )
  }
  return { id: coa.id, code: coa.code, name: coa.name }
}

// ─── Core Sync Function ───────────────────────────────────────────────────────

/**
 * syncInventoryToLedger
 * ─────────────────────
 * Fungsi utama yang menghubungkan satu transaksi stok ke General Ledger.
 * Berjalan dalam satu transaksi database (Atomicity via Prisma.$transaction).
 *
 * @param mutationId  - ID dari InventoryMutation yang akan disinkronkan
 * @param options     - Opsi tambahan (override tanggal untuk retroaktif, dll.)
 */
export async function syncInventoryToLedger(
  mutationId: string,
  options: {
    /** Override tanggal jurnal (untuk retroaktif). Default: tanggal mutasi. */
    overrideDate?: Date
    /** Jika true, skip jika jurnal sudah ada (idempotent). Default: true. */
    idempotent?: boolean
    /** Gunakan transaksi Prisma yang sudah ada (untuk nested calls). */
    tx?: Prisma.TransactionClient
  } = {}
): Promise<SyncResult> {
  const { overrideDate, idempotent = true } = options

  const runner = async (tx: Prisma.TransactionClient): Promise<SyncResult> => {
    // ── 1. Fetch Mutation ──────────────────────────────────────────────────
    const mutation = await tx.inventoryMutation.findUnique({
      where: { id: mutationId },
      include: {
        product: {
          select: {
            productName: true,
            purchasePrice: true,
            masterProduct: {
              select: {
                productCategory: {
                  select: { categoryName: true }
                }
              }
            },
          },
        },
        batch: {
          select: { purchasePrice: true, batchNumber: true },
        },
      },
    })

    if (!mutation) {
      throw new Error(`InventoryMutation tidak ditemukan: ${mutationId}`)
    }

    // ── 2. Idempotency Check ───────────────────────────────────────────────
    const referenceNo = `INV-MUT-${mutationId}`
    if (idempotent) {
      const existing = await tx.journalEntry.findFirst({
        where: { referenceNo, entryType: 'SYSTEM' },
      })
      if (existing) {
        return {
          journalEntryId: existing.id,
          referenceNo,
          description: existing.description,
          totalDebit: 0,
          totalCredit: 0,
          skipped: true,
          skipReason: 'Jurnal sudah ada (idempotent skip)',
        }
      }
    }

    // ── 3. Hitung Nilai Transaksi ──────────────────────────────────────────
    // Prioritas harga: batch.purchasePrice → product.purchasePrice → 0
    const unitCost =
      mutation.batch?.purchasePrice ??
      mutation.product?.purchasePrice ??
      0

    const totalValue = Math.abs(mutation.quantity) * unitCost

    if (totalValue <= 0) {
      return {
        journalEntryId: '',
        referenceNo,
        description: `Mutasi ${mutation.type} - nilai 0, dilewati`,
        totalDebit: 0,
        totalCredit: 0,
        skipped: true,
        skipReason: `Nilai transaksi = 0 (unitCost=${unitCost}, qty=${mutation.quantity})`,
      }
    }

    // ── 4. Tentukan Tanggal Jurnal (UTC+7 Correction) ─────────────────────
    const journalDate = toWIBDate(overrideDate ?? mutation.createdAt)

    // ── 5. Resolve COA Accounts ───────────────────────────────────────────
    const clinicId = mutation.branchId
    const inventoryAccount = await resolveInventoryAccount(tx, mutation.productId, clinicId)

    // ── 6. Buat Jurnal Berdasarkan Tipe Mutasi ────────────────────────────
    let debitCoaId: string
    let creditCoaId: string
    let description: string

    const mutType = mutation.type as MutationType
    const productName = mutation.product?.productName ?? 'Produk'
    const batchInfo = mutation.batch?.batchNumber ? ` [Batch: ${mutation.batch.batchNumber}]` : ''

    switch (mutType) {
      // ── Stok Masuk (Pembelian / GRN) ──────────────────────────────────
      case 'IN': {
        const apAccount = await resolveAccount(tx, 'ACCOUNTS_PAYABLE', '2-1101', clinicId)
        debitCoaId = inventoryAccount.id   // Debit: Persediaan
        creditCoaId = apAccount.id          // Kredit: Hutang Dagang
        description = `Stok Masuk: ${productName}${batchInfo} (${mutation.referenceType ?? 'IN'} #${mutation.referenceId ?? mutationId})`
        break
      }

      // ── Stok Keluar (Penjualan / Dispensing) ──────────────────────────
      case 'OUT': {
        const cogsAccount = await resolveAccount(tx, 'COGS', '5-1101', clinicId)
        debitCoaId = cogsAccount.id         // Debit: HPP Obat-obatan
        creditCoaId = inventoryAccount.id   // Kredit: Persediaan
        description = `HPP Stok Keluar: ${productName}${batchInfo} (${mutation.referenceType ?? 'OUT'} #${mutation.referenceId ?? mutationId})`
        break
      }

      // ── Penyesuaian Stok ──────────────────────────────────────────────
      case 'ADJUSTMENT': {
        if (mutation.quantity >= 0) {
          // Penyesuaian positif: stok bertambah → Debit Persediaan, Kredit Ekuitas
          const equityAccount = await resolveAccount(tx, 'RETAINED_EARNINGS', '3-2001', clinicId)
          debitCoaId = inventoryAccount.id   // Debit: Persediaan
          creditCoaId = equityAccount.id     // Kredit: Laba Ditahan
          description = `Penyesuaian Stok (+): ${productName}${batchInfo} qty=${mutation.quantity}`
        } else {
          // Penyesuaian negatif: stok berkurang → Debit HPP, Kredit Persediaan
          const cogsAccount = await resolveAccount(tx, 'COGS', '5-1101', clinicId)
          debitCoaId = cogsAccount.id        // Debit: HPP / Beban
          creditCoaId = inventoryAccount.id  // Kredit: Persediaan
          description = `Penyesuaian Stok (-): ${productName}${batchInfo} qty=${mutation.quantity}`
        }
        break
      }

      // ── Transfer Antar Cabang (Stok Keluar dari cabang ini) ───────────
      case 'TRANSFER': {
        // Untuk transfer, kita catat pengurangan di cabang asal.
        // Cabang tujuan akan dicatat saat mutation IN diterima.
        const equityAccount = await resolveAccount(tx, 'RETAINED_EARNINGS', '3-2001', clinicId)
        if (mutation.quantity < 0) {
          // Transfer keluar: Kredit Persediaan, Debit akun sementara (Ekuitas sebagai clearing)
          debitCoaId = equityAccount.id      // Debit: Clearing (Ekuitas)
          creditCoaId = inventoryAccount.id  // Kredit: Persediaan
          description = `Transfer Stok Keluar: ${productName}${batchInfo} ke cabang lain`
        } else {
          // Transfer masuk: Debit Persediaan, Kredit Clearing
          debitCoaId = inventoryAccount.id   // Debit: Persediaan
          creditCoaId = equityAccount.id     // Kredit: Clearing
          description = `Transfer Stok Masuk: ${productName}${batchInfo} dari cabang lain`
        }
        break
      }

      // ── Return ke Supplier ────────────────────────────────────────────
      case 'RETURN': {
        const apAccount = await resolveAccount(tx, 'ACCOUNTS_PAYABLE', '2-1101', clinicId)
        // Return: Kredit Persediaan, Debit Hutang Dagang (mengurangi hutang)
        debitCoaId = apAccount.id            // Debit: Hutang Dagang (berkurang)
        creditCoaId = inventoryAccount.id    // Kredit: Persediaan (berkurang)
        description = `Return Stok ke Supplier: ${productName}${batchInfo}`
        break
      }

      // ── Saldo Awal Go-Live ────────────────────────────────────────────
      case 'OPENING_BALANCE': {
        const capitalAccount = await resolveAccount(tx, 'OWNER_CAPITAL', '3-1001', clinicId)
        debitCoaId = inventoryAccount.id     // Debit: Persediaan
        creditCoaId = capitalAccount.id      // Kredit: Modal Disetor
        description = `Saldo Awal Persediaan (Go-Live): ${productName}${batchInfo}`
        break
      }

      default:
        return {
          journalEntryId: '',
          referenceNo,
          description: `Tipe mutasi tidak dikenali: ${mutation.type}`,
          totalDebit: 0,
          totalCredit: 0,
          skipped: true,
          skipReason: `Tipe mutasi "${mutation.type}" tidak memiliki aturan akuntansi`,
        }
    }

    // ── 7. Buat Journal Entry (Atomic) ────────────────────────────────────
    const journal = await tx.journalEntry.create({
      data: {
        date: journalDate,
        description,
        referenceNo,
        entryType: 'SYSTEM',
        clinicId,
        details: {
          create: [
            {
              coaId: debitCoaId,
              debit: totalValue,
              credit: 0,
              description: `${description} — Debit`,
            },
            {
              coaId: creditCoaId,
              debit: 0,
              credit: totalValue,
              description: `${description} — Kredit`,
            },
          ],
        },
      },
    })

    console.log(
      `[InventoryLedger] Jurnal dibuat: ${journal.id} | ${description} | Nilai: ${totalValue.toLocaleString('id-ID')}`
    )

    return {
      journalEntryId: journal.id,
      referenceNo,
      description,
      totalDebit: totalValue,
      totalCredit: totalValue,
    }
  }

  // Gunakan transaksi yang sudah ada atau buat baru
  if (options.tx) {
    return runner(options.tx)
  }
  return prisma.$transaction(runner)
}

// ─── Batch Sync (untuk retroaktif) ───────────────────────────────────────────

export interface RetroactiveSyncOptions {
  /** Filter berdasarkan cabang */
  branchId?: string
  /** Filter tipe mutasi (default: semua kecuali RESERVE/UNRESERVE) */
  types?: MutationType[]
  /** Tanggal mulai (WIB) */
  fromDate?: Date
  /** Tanggal akhir (WIB) */
  toDate?: Date
  /** Jumlah maksimal mutasi yang diproses per batch */
  batchSize?: number
  /** Callback progress */
  onProgress?: (processed: number, total: number, current: string) => void
}

export interface RetroactiveSyncResult {
  total: number
  synced: number
  skipped: number
  errors: Array<{ mutationId: string; error: string }>
}

/**
 * syncAllInventoryToLedger
 * ────────────────────────
 * Sinkronisasi retroaktif: menarik semua mutasi stok lama dan membuat jurnal GL.
 * Aman dijalankan berulang kali (idempotent).
 *
 * Gunakan untuk:
 * 1. Go-Live: sinkronisasi semua transaksi sebelum sistem akuntansi aktif
 * 2. Perbaikan: re-sync jika ada jurnal yang hilang
 */
export async function syncAllInventoryToLedger(
  options: RetroactiveSyncOptions = {}
): Promise<RetroactiveSyncResult> {
  const {
    branchId,
    types = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'],
    fromDate,
    toDate,
    batchSize = 100,
    onProgress,
  } = options

  // Build where clause
  const where: Prisma.InventoryMutationWhereInput = {
    type: { in: types },
  }
  if (branchId) where.branchId = branchId
  if (fromDate || toDate) {
    where.createdAt = {}
    // Kompensasi UTC+7: konversi tanggal WIB ke UTC untuk query
    if (fromDate) {
      where.createdAt.gte = new Date(fromDate.getTime() - WIB_OFFSET_MS)
    }
    if (toDate) {
      // Akhir hari WIB = 23:59:59 WIB = 16:59:59 UTC hari yang sama
      const endOfDayWIB = new Date(toDate)
      endOfDayWIB.setHours(23, 59, 59, 999)
      where.createdAt.lte = new Date(endOfDayWIB.getTime() - WIB_OFFSET_MS)
    }
  }

  const total = await prisma.inventoryMutation.count({ where })
  const result: RetroactiveSyncResult = { total, synced: 0, skipped: 0, errors: [] }

  console.log(`[RetroactiveSync] Memulai sinkronisasi ${total} mutasi stok...`)

  let skip = 0
  while (skip < total) {
    const mutations = await prisma.inventoryMutation.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: batchSize,
      skip,
      select: { id: true, createdAt: true, type: true, productId: true },
    })

    for (const mut of mutations) {
      try {
        const syncResult = await syncInventoryToLedger(mut.id, { idempotent: true })

        if (syncResult.skipped) {
          result.skipped++
        } else {
          result.synced++
        }

        onProgress?.(result.synced + result.skipped + result.errors.length, total, mut.id)
      } catch (err) {
        const errorMsg = (err as Error).message
        result.errors.push({ mutationId: mut.id, error: errorMsg })
        console.error(`[RetroactiveSync] Error pada mutasi ${mut.id}: ${errorMsg}`)
      }
    }

    skip += batchSize
  }

  console.log(
    `[RetroactiveSync] Selesai. Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
  )

  return result
}

/**
 * syncOpeningBalances
 * ───────────────────
 * Hitung nilai persediaan saat ini (berdasarkan harga beli rata-rata per batch)
 * dan buat jurnal saldo awal Go-Live.
 *
 * Selisih saldo awal diarahkan ke akun Ekuitas (3-1001 Modal Disetor).
 *
 * @param clinicId    - ID klinik
 * @param goLiveDate  - Tanggal Go-Live (WIB)
 */
export async function syncOpeningBalances(
  clinicId: string,
  goLiveDate: Date
): Promise<{ journalsCreated: number; totalValue: number }> {
  const journalDate = toWIBDate(goLiveDate)

  // Ambil semua stok aktif dengan harga beli dari batch
  const stocks = await prisma.inventoryStock.findMany({
    where: { branchId: clinicId, onHandQty: { gt: 0 } },
    include: {
      product: {
        select: {
          id: true,
          productName: true,
          purchasePrice: true,
          masterProduct: {
            select: {
              productCategory: {
                select: { categoryName: true }
              }
            }
          },
        },
      },
      batch: {
        select: { purchasePrice: true, batchNumber: true },
      },
    },
  })

  if (stocks.length === 0) {
    console.log(`[OpeningBalance] Tidak ada stok aktif di klinik ${clinicId}`)
    return { journalsCreated: 0, totalValue: 0 }
  }

  let journalsCreated = 0
  let totalValue = 0

  // Kelompokkan per produk untuk membuat satu jurnal per produk
  const productMap = new Map<
    string,
    { productId: string; productName: string; categoryName: string; totalValue: number }
  >()

  for (const stock of stocks) {
    const unitCost = stock.batch?.purchasePrice ?? stock.product?.purchasePrice ?? 0
    const value = stock.onHandQty * unitCost

    if (value <= 0) continue

    const existing = productMap.get(stock.productId)
    if (existing) {
      existing.totalValue += value
    } else {
      productMap.set(stock.productId, {
        productId: stock.productId,
        productName: stock.product?.productName ?? 'Produk',
        categoryName: stock.product?.masterProduct?.productCategory?.categoryName || '',
        totalValue: value,
      })
    }
  }

  // Buat jurnal saldo awal per produk
  for (const [productId, data] of productMap) {
    const referenceNo = `OPENING-${clinicId}-${productId}`

    // Idempotency check
    const existing = await prisma.journalEntry.findFirst({
      where: { referenceNo, entryType: 'SYSTEM' },
    })
    if (existing) {
      journalsCreated++ // Hitung sebagai sudah ada
      totalValue += data.totalValue
      continue
    }

    await prisma.$transaction(async (tx) => {
      const inventoryAccount = await resolveInventoryAccount(tx, productId, clinicId)
      const capitalAccount = await resolveAccount(tx, 'OWNER_CAPITAL', '3-1001', clinicId)

      await tx.journalEntry.create({
        data: {
          date: journalDate,
          description: `Saldo Awal Persediaan Go-Live: ${data.productName}`,
          referenceNo,
          entryType: 'SYSTEM',
          clinicId,
          details: {
            create: [
              {
                coaId: inventoryAccount.id,
                debit: data.totalValue,
                credit: 0,
                description: `Saldo Awal: ${data.productName} (${inventoryAccount.code})`,
              },
              {
                coaId: capitalAccount.id,
                debit: 0,
                credit: data.totalValue,
                description: `Modal Awal Persediaan Go-Live`,
              },
            ],
          },
        },
      })
    })

    journalsCreated++
    totalValue += data.totalValue
    console.log(
      `[OpeningBalance] Jurnal dibuat: ${data.productName} = Rp ${data.totalValue.toLocaleString('id-ID')}`
    )
  }

  console.log(
    `[OpeningBalance] Selesai. ${journalsCreated} jurnal, Total: Rp ${totalValue.toLocaleString('id-ID')}`
  )

  return { journalsCreated, totalValue }
}
