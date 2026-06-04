const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.labResultDetail.findMany().then(console.log).finally(()=>prisma.$disconnect());
