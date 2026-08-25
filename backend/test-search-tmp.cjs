const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const PORT = 5006;

async function main() {
  const doctorUser = await prisma.user.findFirst({
    where: { role: 'DOCTOR' },
    include: { doctor: true, clinics: { include: { clinic: true } } }
  });
  if (!doctorUser) { console.log('No doctor found'); return; }
  console.log('Doctor:', doctorUser.username, 'profile:', doctorUser.doctor && doctorUser.doctor.id);
  const token = jwt.sign(
    { id: doctorUser.id, role: doctorUser.role, email: doctorUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  const clinicId = doctorUser.clinics[0] && doctorUser.clinics[0].clinicId;

  const tests = [
    'search=Benny',
    'search=benny',
    'search=45f8f51c',
    '',
  ];
  for (const q of tests) {
    const url = `http://127.0.0.1:${PORT}/api/master/patients?page=1&limit=10&sort=recent${q ? '&' + q : ''}`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token, 'x-clinic-id': clinicId || '' } });
    const text = await res.text();
    let summary;
    try {
      const j = JSON.parse(text);
      const arr = j.data || j;
      summary = 'status=' + res.status + ' count=' + (Array.isArray(arr) ? arr.length : '?') + ' total=' + (j.meta && j.meta.total) + ' names=' + (Array.isArray(arr) ? arr.map(p => p.name).join('|') : text.slice(0, 120));
    } catch (e) { summary = 'status=' + res.status + ' raw=' + text.slice(0, 200); }
    console.log('Q[' + (q || '(empty)') + '] =>', summary);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
