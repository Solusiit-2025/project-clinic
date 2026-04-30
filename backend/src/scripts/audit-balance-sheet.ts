import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- AUDITING BALANCE SHEET DATA ---')
  
  const coas = await prisma.chartOfAccount.findMany()
  
  let totalAssets = 0
  let totalLiabilities = 0
  let totalEquity = 0

  coas.forEach(coa => {
    // Current Balance = openingBalance + currentBalance (depending on your logic)
    // For this audit, let's look at openingBalance first
    const balance = (coa.openingBalance || 0) + (coa.currentBalance || 0)
    
    if (coa.category === 'ASSET') totalAssets += balance
    else if (coa.category === 'LIABILITY') totalLiabilities += balance
    else if (coa.category === 'EQUITY') totalEquity += balance
  })

  console.log(`Total Assets: ${totalAssets}`)
  console.log(`Total Liabilities: ${totalLiabilities}`)
  console.log(`Total Equity: ${totalEquity}`)
  console.log(`---`)
  console.log(`Balance Check: Assets - (Liabilities + Equity) = ${totalAssets - (totalLiabilities + totalEquity)}`)
  
  if (totalAssets === 0 && totalLiabilities === 0 && totalEquity === 0) {
    console.log('⚠️ WARNING: All balances are ZERO. This means either the VPS backup has no balances or they were not restored.')
  } else if (totalAssets !== (totalLiabilities + totalEquity)) {
    console.log('❌ ERROR: Balance Sheet is NOT BALANCED!')
  } else {
    console.log('✅ SUCCESS: Balance Sheet is BALANCED.')
  }

  console.log('--- AUDIT COMPLETED ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
