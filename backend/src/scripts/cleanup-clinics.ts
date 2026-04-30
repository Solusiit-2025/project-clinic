import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING CLINIC CLEANUP ---')
  
  // Find Bekasi clinic
  const bekasi = await prisma.clinic.findFirst({
    where: { 
      OR: [
        { code: 'K002' },
        { name: { contains: 'Bekasi' } }
      ]
    }
  })

  if (bekasi) {
    console.log(`Found clinic: ${bekasi.name} (${bekasi.code}). Deleting...`)
    
    // Delete related data first if necessary (Prisma cascade handles most, 
    // but some models might not have cascade delete configured in schema)
    
    await prisma.clinic.delete({
      where: { id: bekasi.id }
    })
    
    console.log('✅ Clinic deleted successfully.')
  } else {
    console.log('❌ Bekasi clinic not found.')
  }

  // Check remaining clinics
  const clinics = await prisma.clinic.findMany()
  console.log(`Remaining clinics: ${clinics.length}`)
  clinics.forEach(c => console.log(`- ${c.name} (${c.code})`))

  console.log('--- CLEANUP COMPLETED ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
