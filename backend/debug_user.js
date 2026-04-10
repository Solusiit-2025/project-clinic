const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'rohani@clinic.com' },
    include: { doctor: true }
  });
  console.log('USER_INFO:', JSON.stringify(user, null, 2));
  process.exit(0);
}

checkUser().catch(e => {
  console.error(e);
  process.exit(1);
});
