import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_if_any';

async function main() {
  const patientId = '01eb037d-0572-4c7b-8cac-609df04b54ef';
  
  // Find a doctor
  const doctorUser = await prisma.user.findFirst({
    where: { role: 'DOCTOR' },
    include: { doctor: true, clinics: { include: { clinic: true } } }
  });

  if (!doctorUser) {
    console.log('No doctor found');
    return;
  }

  console.log(`Using doctor: ${doctorUser.username} (${doctorUser.id}), Doctor Profile ID: ${doctorUser.doctor?.id}`);

  const token = jwt.sign(
    { id: doctorUser.id, role: doctorUser.role, email: doctorUser.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' }
  );

  const activeClinicId = doctorUser.clinics[0]?.clinicId;
  console.log('Active Clinic ID:', activeClinicId);

  try {
    const res = await fetch(`http://127.0.0.1:5004/api/master/patients/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-clinic-id': activeClinicId || ''
      }
    });
    console.log('Response Status:', res.status);
    const text = await res.text();
    console.log('Response Data:', text);
  } catch (err: any) {
    console.error('Request failed:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
