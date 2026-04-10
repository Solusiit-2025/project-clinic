import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: {
      clinics: {
        include: { clinic: true }
      }
    }
  })

  console.log('--- USERS AND CLINICS ---')
  users.forEach(u => {
    console.log(`User: ${u.username} (${u.name}) | Role: ${u.role}`)
    u.clinics.forEach(uc => {
      console.log(`  - Clinic: ${uc.clinic.name} | ID: ${uc.clinicId} | Main: ${uc.clinic.isMain}`)
    })
  })

  const invoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { invoiceNo: true, clinicId: true, total: true, status: true }
  })
  
  console.log('\n--- LATEST INVOICES ---')
  invoices.forEach(inv => {
    console.log(`Inv: ${inv.invoiceNo} | ClinicID: ${inv.clinicId} | Total: ${inv.total} | Status: ${inv.status}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
