/**
 * seed-inventory-system-accounts.ts
 * ===================================
 * Seed System Account keys yang dibutuhkan oleh InventoryLedgerService.
 *
 * Keys yang di-seed:
 *   INVENTORY_MEDICINE  → 1-1301 (Persediaan Obat-obatan)
 *   INVENTORY_ALKES     → 1-1302 (Persediaan Alat Kesehatan)
 *   INVENTORY_SKINCARE  → 1-1303 (Persediaan Produk Skin Care)
 *   ACCOUNTS_PAYABLE    → 2-1101 (Hutang Dagang)
 *   COGS                → 5-1101 (HPP Obat-obatan)
 *   RETAINED_EARNINGS   → 3-2001 (Laba Ditahan)
 *   OWNER_CAPITAL       → 3-1001 (Modal Disetor Pemilik)
 *
 * Cara pakai:
 *   npx ts-node scripts/seed-inventory-system-accounts.ts
 *   npx ts-node scripts/seed-inventory-system-accounts.ts --clinicId=<id>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const INVENTORY_SYSTEM_ACCOUNTS = [
  {
    key: 'INVENTORY_MEDICINE',
    name: 'Persediaan Obat-obatan',
    coaCode: '1-1301',
    description: 'Akun persediaan untuk obat-obatan (digunakan oleh InventoryLedgerService)',
  },
  {
    key: 'INVENTORY_ALKES',
    name: 'Persediaan Alat Kesehatan',
    coaCode: '1-1302',
    description: 'Akun persediaan untuk alat kesehatan',
  },
  {
    key: 'INVENTORY_SKINCARE',
    name: 'Persediaan Produk Skin Care',
    coaCode: '1-1303',
    description: 'Akun persediaan untuk produk skin care',
  },
  {
    key: 'ACCOUNTS_PAYABLE',
    name: 'Hutang Dagang (Supplier)',
    coaCode: '2-1101',
    description: 'Hutang ke supplier saat penerimaan barang',
  },
  {
    key: 'COGS',
    name: 'HPP Obat-obatan',
    coaCode: '5-1101',
    description: 'Harga Pokok Penjualan saat stok keluar/terjual',
  },
  {
    key: 'RETAINED_EARNINGS',
    name: 'Laba Ditahan',
    coaCode: '3-2001',
    description: 'Akun ekuitas untuk penyesuaian stok positif',
  },
  {
    key: 'OWNER_CAPITAL',
    name: 'Modal Disetor Pemilik',
    coaCode: '3-1001',
    description: 'Akun modal untuk saldo awal persediaan Go-Live',
  },
]

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2)
  const clinicIdArg = args.find((a) => a.startsWith('--clinicId='))
  const specificClinicId = clinicIdArg ? clinicIdArg.split('=')[1] : null

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║     Seed Inventory System Accounts (GL Mapping)      ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  // Tentukan klinik yang akan di-seed
  let clinicIds: string[] = []
  if (specificClinicId) {
    clinicIds = [specificClinicId]
    console.log(`🏥 Target Klinik: ${specificClinicId}`)
  } else {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    })
    clinicIds = clinics.map((c) => c.id)
    console.log(`🏥 Target: Semua klinik aktif (${clinics.length} klinik)`)
    clinics.forEach((c) => console.log(`   - ${c.code}: ${c.name}`))
  }

  console.log()

  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const clinicId of clinicIds) {
    console.log(`\n📋 Processing Clinic: ${clinicId}`)

    for (const account of INVENTORY_SYSTEM_ACCOUNTS) {
      try {
        // Cari COA yang sesuai (clinic-specific dulu, lalu global)
        const coa = await prisma.chartOfAccount.findFirst({
          where: {
            code: account.coaCode,
            OR: [{ clinicId }, { clinicId: null }],
          },
          orderBy: { clinicId: 'desc' }, // clinic-specific lebih prioritas
        })

        if (!coa) {
          console.log(`   ⚠️  [${account.key}] COA ${account.coaCode} tidak ditemukan — SKIP`)
          totalErrors++
          continue
        }

        // Upsert SystemAccount
        const existing = await prisma.systemAccount.findFirst({
          where: { key: account.key, clinicId },
        })

        if (existing) {
          // Update jika COA berubah
          if (existing.coaId !== coa.id) {
            await prisma.systemAccount.update({
              where: { id: existing.id },
              data: { coaId: coa.id, name: account.name },
            })
            console.log(`   🔄 [${account.key}] Updated → ${account.coaCode} (${coa.name})`)
            totalCreated++
          } else {
            console.log(`   ✅ [${account.key}] Sudah ada → ${account.coaCode}`)
            totalSkipped++
          }
        } else {
          await prisma.systemAccount.create({
            data: {
              key: account.key,
              name: account.name,
              coaId: coa.id,
              clinicId,
            },
          })
          console.log(`   ✨ [${account.key}] Dibuat → ${account.coaCode} (${coa.name})`)
          totalCreated++
        }
      } catch (err) {
        console.error(`   ❌ [${account.key}] Error: ${(err as Error).message}`)
        totalErrors++
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║                    HASIL SEEDING                     ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`✨ Dibuat/Updated : ${totalCreated}`)
  console.log(`✅ Sudah Ada      : ${totalSkipped}`)
  console.log(`❌ Error          : ${totalErrors}`)

  if (totalErrors > 0) {
    console.log('\n💡 Tips: Jalankan seed-coa-pro.ts terlebih dahulu untuk memastikan COA tersedia.')
    console.log('   npx ts-node scripts/seed-coa-pro.ts')
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
