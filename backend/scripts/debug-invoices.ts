import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const regCount = await prisma.registration.count()
  const invCount = await prisma.invoice.count()
  const latestInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { patient: { select: { name: true } } }
  })

  console.log('Total Registrations:', regCount)
  console.log('Total Invoices:', invCount)
  
  const regServices = await prisma.service.findMany({
    where: { serviceName: { contains: 'Pendaftaran', mode: 'insensitive' } }
  })
  console.log('\nRegistration Services found:', regServices.length)
  regServices.forEach(s => console.log(`- ${s.serviceCode} | ${s.serviceName} | Clinic: ${s.clinicId}`))

  const clinics = await prisma.clinic.findMany()
  console.log('\nAll Clinics:')
  clinics.forEach(c => console.log(`- ${c.name} | ID: ${c.id}`))

  console.log('\nLatest 5 Invoices:')
  latestInvoices.forEach(inv => {
    console.log(`- ${inv.invoiceNo} | ${inv.patient.name} | ClinicID: ${inv.clinicId} | Status: ${inv.status}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
