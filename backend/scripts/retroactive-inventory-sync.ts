/**
 * retroactive-inventory-sync.ts
 * ==============================
 * Skrip standalone untuk sinkronisasi retroaktif transaksi stok ke General Ledger.
 *
 * Cara pakai:
 *   npx ts-node scripts/retroactive-inventory-sync.ts
 *   npx ts-node scripts/retroactive-inventory-sync.ts --branchId=<id>
 *   npx ts-node scripts/retroactive-inventory-sync.ts --fromDate=2026-01-01 --toDate=2026-04-24
 *   npx ts-node scripts/retroactive-inventory-sync.ts --opening-balance --goLiveDate=2026-01-01
 *
 * Flags:
 *   --branchId=<id>       Filter per cabang (opsional, default: semua cabang)
 *   --fromDate=YYYY-MM-DD Tanggal mulai (WIB)
 *   --toDate=YYYY-MM-DD   Tanggal akhir (WIB)
 *   --types=IN,OUT        Filter tipe mutasi (default: IN,OUT,ADJUSTMENT,TRANSFER,RETURN)
 *   --batchSize=100       Jumlah mutasi per batch (default: 100)
 *   --opening-balance     Mode saldo awal Go-Live
 *   --goLiveDate=YYYY-MM-DD Tanggal Go-Live (wajib jika --opening-balance)
 *   --dry-run             Hanya tampilkan statistik tanpa membuat jurnal
 */

import { PrismaClient } from '@prisma/client'
import {
  syncAllInventoryToLedger,
  syncOpeningBalances,
  MutationType,
} from '../src/services/inventoryLedger.service'

const prisma = new PrismaClient()

// ─── Parse CLI Arguments ──────────────────────────────────────────────────────

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {}
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      args[key] = value !== undefined ? value : true
    }
  })
  return args
}

// ─── Dry Run: Tampilkan statistik tanpa membuat jurnal ───────────────────────

async function dryRun(branchId?: string, fromDate?: Date, toDate?: Date) {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

  const where: any = {
    type: { in: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'] },
  }
  if (branchId) where.branchId = branchId
  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) where.createdAt.gte = new Date(fromDate.getTime() - WIB_OFFSET_MS)
    if (toDate) {
      const end = new Date(toDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = new Date(end.getTime() - WIB_OFFSET_MS)
    }
  }

  const total = await prisma.inventoryMutation.count({ where })
  const mutations = await prisma.inventoryMutation.findMany({
    where,
    select: { id: true },
  })

  const referenceNos = mutations.map((m) => `INV-MUT-${m.id}`)
  const alreadySynced = await prisma.journalEntry.count({
    where: { referenceNo: { in: referenceNos }, entryType: 'SYSTEM' },
  })

  // Breakdown per tipe
  const breakdown = await prisma.inventoryMutation.groupBy({
    by: ['type'],
    where,
    _count: { id: true },
    _sum: { quantity: true },
  })

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║         DRY RUN — Retroactive Inventory Sync         ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`\n📊 Total Mutasi    : ${total}`)
  console.log(`✅ Sudah Di-sync   : ${alreadySynced}`)
  console.log(`⏳ Belum Di-sync   : ${total - alreadySynced}`)
  console.log('\n📋 Breakdown per Tipe:')
  breakdown.forEach((b) => {
    console.log(`   ${b.type.padEnd(12)} : ${b._count.id} mutasi`)
  })
  console.log('\n⚠️  Mode DRY RUN — tidak ada jurnal yang dibuat.')
  console.log('   Hapus flag --dry-run untuk menjalankan sinkronisasi.\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  const branchId = args['branchId'] as string | undefined
  const fromDate = args['fromDate'] ? new Date(args['fromDate'] as string) : undefined
  const toDate = args['toDate'] ? new Date(args['toDate'] as string) : undefined
  const typesRaw = args['types'] as string | undefined
  const types = typesRaw
    ? (typesRaw.split(',') as MutationType[])
    : (['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'] as MutationType[])
  const batchSize = args['batchSize'] ? parseInt(args['batchSize'] as string) : 100
  const isDryRun = args['dry-run'] === true
  const isOpeningBalance = args['opening-balance'] === true
  const goLiveDateRaw = args['goLiveDate'] as string | undefined

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║       Retroactive Inventory → GL Sync Script         ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`\n🏥 Branch ID  : ${branchId ?? 'Semua Cabang'}`)
  console.log(`📅 From Date  : ${fromDate?.toLocaleDateString('id-ID') ?? 'Semua'}`)
  console.log(`📅 To Date    : ${toDate?.toLocaleDateString('id-ID') ?? 'Semua'}`)
  console.log(`🔄 Types      : ${types.join(', ')}`)
  console.log(`📦 Batch Size : ${batchSize}`)
  console.log(`🔍 Mode       : ${isDryRun ? 'DRY RUN' : isOpeningBalance ? 'OPENING BALANCE' : 'SYNC'}`)

  // ── Mode: Opening Balance ──────────────────────────────────────────────────
  if (isOpeningBalance) {
    if (!branchId) {
      console.error('\n❌ Error: --branchId diperlukan untuk mode --opening-balance')
      process.exit(1)
    }
    if (!goLiveDateRaw) {
      console.error('\n❌ Error: --goLiveDate diperlukan untuk mode --opening-balance')
      console.error('   Contoh: --goLiveDate=2026-01-01')
      process.exit(1)
    }

    const goLiveDate = new Date(goLiveDateRaw)
    console.log(`\n🚀 Membuat jurnal saldo awal Go-Live: ${goLiveDate.toLocaleDateString('id-ID')}`)

    const result = await syncOpeningBalances(branchId, goLiveDate)

    console.log('\n╔══════════════════════════════════════════════════════╗')
    console.log('║                  HASIL OPENING BALANCE               ║')
    console.log('╚══════════════════════════════════════════════════════╝')
    console.log(`✅ Jurnal Dibuat : ${result.journalsCreated}`)
    console.log(`💰 Total Nilai   : Rp ${result.totalValue.toLocaleString('id-ID')}`)
    return
  }

  // ── Mode: Dry Run ──────────────────────────────────────────────────────────
  if (isDryRun) {
    await dryRun(branchId, fromDate, toDate)
    return
  }

  // ── Mode: Retroactive Sync ─────────────────────────────────────────────────
  console.log('\n🚀 Memulai sinkronisasi retroaktif...\n')

  const startTime = Date.now()
  let lastProgressLog = 0

  const result = await syncAllInventoryToLedger({
    branchId,
    types,
    fromDate,
    toDate,
    batchSize,
    onProgress: (processed, total, currentId) => {
      const pct = Math.round((processed / total) * 100)
      // Log setiap 10% atau setiap 50 item
      if (pct >= lastProgressLog + 10 || processed % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        process.stdout.write(`\r   Progress: ${processed}/${total} (${pct}%) — ${elapsed}s`)
        lastProgressLog = pct
      }
    },
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n\n╔══════════════════════════════════════════════════════╗')
  console.log('║              HASIL RETROACTIVE SYNC                  ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`✅ Berhasil Di-sync : ${result.synced}`)
  console.log(`⏭️  Dilewati (sudah ada): ${result.skipped}`)
  console.log(`❌ Error            : ${result.errors.length}`)
  console.log(`⏱️  Waktu            : ${elapsed}s`)

  if (result.errors.length > 0) {
    console.log('\n⚠️  Detail Error (maks 10):')
    result.errors.slice(0, 10).forEach((e, i) => {
      console.log(`   ${i + 1}. Mutation ${e.mutationId}: ${e.error}`)
    })
  }

  if (result.errors.length > 0) {
    console.log('\n💡 Tips: Periksa System Accounts di /master/system-accounts')
    console.log('   Pastikan key berikut sudah dipetakan:')
    console.log('   - INVENTORY_MEDICINE → 1-1301')
    console.log('   - INVENTORY_ALKES    → 1-1302')
    console.log('   - INVENTORY_SKINCARE → 1-1303')
    console.log('   - ACCOUNTS_PAYABLE   → 2-1101')
    console.log('   - COGS               → 5-1101')
    console.log('   - RETAINED_EARNINGS  → 3-2001')
    console.log('   - OWNER_CAPITAL      → 3-1001')
  }

  console.log()
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
