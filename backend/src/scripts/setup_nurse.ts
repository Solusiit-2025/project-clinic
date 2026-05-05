import { prisma } from '../lib/prisma';

async function main() {
  // 1. Update the 'nurse' user to the new NURSE role
  const updatedUser = await prisma.user.update({
    where: { username: 'nurse' },
    data: { role: 'NURSE' as any }
  });
  console.log('Updated User Role:', updatedUser.username, updatedUser.role);

  // 2. Define modules for Nurse
  const nurseModules = [
    'MEDICAL_SERVICES',
    'LABORATORY',
    'REGISTRATION_QUEUE'
  ];

  for (const mod of nurseModules) {
    await prisma.rolePermission.upsert({
      where: {
        role_module: {
          role: 'NURSE' as any,
          module: mod
        }
      },
      update: { canAccess: true },
      create: {
        role: 'NURSE' as any,
        module: mod,
        canAccess: true
      }
    });
    console.log(`Permission Granted: NURSE -> ${mod}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
