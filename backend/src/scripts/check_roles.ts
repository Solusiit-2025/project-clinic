import { prisma } from '../lib/prisma';

async function main() {
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  console.log('Unique Roles in Database:', JSON.stringify(roles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
