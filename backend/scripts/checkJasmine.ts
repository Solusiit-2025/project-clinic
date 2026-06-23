import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const patient = await prisma.patient.findUnique({
    where: { medicalRecordNo: 'RM-2026-020676' },
    include: {
      treatmentPlans: {
        include: {
          workOrders: {
            include: {
              invoiceItems: true
            }
          }
        }
      }
    }
  })

  console.log(JSON.stringify(patient, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
