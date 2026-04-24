/**
 * ONE-TIME CLEANUP SCRIPT
 * Removes duplicate journal entries caused by postInvoice backfill bug.
 * 
 * The bug: postInvoice was backfilling payment journals AFTER processPayment
 * had already created them, resulting in duplicate entries per payment.
 * 
 * This script:
 * 1. Finds all journalEntry groups with duplicate referenceNo (payment refs)
 * 2. Keeps only the OLDEST entry per referenceNo (created by processPayment)
 * 3. Deletes all newer duplicates
 * 
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateJournals() {
  console.log('🔍 Scanning for duplicate journal entries...\n')

  // Find all referenceNos that have duplicate journal entries
  const allEntries = await prisma.journalEntry.findMany({
    where: { entryType: 'SYSTEM' },
    select: { id: true, referenceNo: true, createdAt: true, description: true },
    orderBy: { createdAt: 'asc' }
  })

  // Group by referenceNo
  const grouped = new Map<string, typeof allEntries>()
  for (const entry of allEntries) {
    if (!entry.referenceNo) continue
    const existing = grouped.get(entry.referenceNo) || []
    existing.push(entry)
    grouped.set(entry.referenceNo, existing)
  }

  // Find duplicates (more than 1 entry per referenceNo)
  const duplicateGroups = Array.from(grouped.entries()).filter(([, entries]) => entries.length > 1)

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate journal entries found. Database is clean!')
    return
  }

  console.log(`⚠️  Found ${duplicateGroups.length} referenceNo(s) with duplicate journal entries:\n`)

  let totalDeleted = 0

  for (const [refNo, entries] of duplicateGroups) {
    // Keep the oldest entry (index 0, already sorted by createdAt asc)
    const [keep, ...toDelete] = entries

    console.log(`📋 Ref: ${refNo}`)
    console.log(`   ✅ KEEP:   ID=${keep.id} | Created=${keep.createdAt.toISOString()} | ${keep.description}`)
    
    for (const del of toDelete) {
      console.log(`   🗑️  DELETE: ID=${del.id} | Created=${del.createdAt.toISOString()} | ${del.description}`)
    }

    // Delete duplicates (details cascade-deleted automatically)
    const deleteIds = toDelete.map(e => e.id)
    await prisma.journalEntry.deleteMany({
      where: { id: { in: deleteIds } }
    })

    totalDeleted += toDelete.length
    console.log(`   → Deleted ${toDelete.length} duplicate(s)\n`)
  }

  console.log(`\n✅ Cleanup complete. Deleted ${totalDeleted} duplicate journal entries.`)
  console.log('📊 Your General Ledger should now be clean and balanced.\n')
}

cleanupDuplicateJournals()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
