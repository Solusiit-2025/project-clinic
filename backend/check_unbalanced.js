const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function check() { 
  const entries = await prisma.journalEntry.findMany({ include: { details: true } }); 
  let unbalanced = []; 
  for (let e of entries) { 
    let debit = e.details.reduce((a, b) => a + Number(b.debit), 0); 
    let credit = e.details.reduce((a, b) => a + Number(b.credit), 0); 
    if (Math.abs(debit - credit) > 0.01) { 
      unbalanced.push({ id: e.id, ref: e.referenceNo, debit, credit, desc: e.description }); 
    } 
  } 
  console.log(JSON.stringify(unbalanced, null, 2)); 
} 
check().catch(console.error).finally(() => prisma.$disconnect());
