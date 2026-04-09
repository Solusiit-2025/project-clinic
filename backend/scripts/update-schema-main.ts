import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- UPDATING CLINIC SCHEMA (SQL DIRECT) ---')
  
  try {
    // Add column via raw query to bypass prisma generate/push locks
    await prisma.$executeRawUnsafe('ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "isMain" BOOLEAN DEFAULT false')
    console.log('✓ Column "isMain" added successfully (or already exists)')
    
    // Set K001 as main
    const result = await prisma.clinic.updateMany({
      where: { code: 'K001' },
      data: { isMain: true }
    })
    console.log(`✓ Set ${result.count} clinic(s) as Main Branch (Pusat)`)
    
  } catch (err) {
    console.error('Failed to update schema:', err)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
