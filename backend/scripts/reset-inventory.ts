import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING INVENTORY DATA RESET ---')
  
  try {
    // Note: Delete in order to avoid FK violations
    console.log('🗑️ Deleting Products (Inventory)...')
    await prisma.product.deleteMany({})
    
    console.log('🗑️ Deleting Product Masters...')
    await prisma.productMaster.deleteMany({})
    
    console.log('🗑️ Deleting Product Categories...')
    await prisma.productCategory.deleteMany({})
    
    console.log('✅ Inventory data reset successfully.')
  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
