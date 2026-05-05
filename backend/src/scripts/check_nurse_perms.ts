import { prisma } from '../lib/prisma';

async function main() {
  const nursePerms = await prisma.rolePermission.findMany({
    where: { role: 'NURSE' }
  });
  console.log('Nurse Permissions:', JSON.stringify(nursePerms, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
