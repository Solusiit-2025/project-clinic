
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const lastService = await prisma.service.findFirst({
    orderBy: { serviceCode: 'desc' }
  })
  console.log('Last Service Code:', lastService?.serviceCode)
}
main().finally(() => prisma.$disconnect())
