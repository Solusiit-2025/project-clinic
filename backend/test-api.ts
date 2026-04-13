import { getDepartments, getDoctors } from './src/controllers/master.controller';

const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c';

async function fetchInternal() {
  const req = {
    query: { clinicId, allClinics: 'false' },
    clinicId: clinicId,
    user: { role: 'ADMIN', clinics: [] }
  } as any;
  
  const res = {
    json: (data: any) => console.log('Response Items length:', data.length, data.map((d: any) => d.name)),
    status: (code: number) => ({ json: (err: any) => console.error('Error', code, err) })
  } as any;
  
  console.log('Testing getDepartments...');
  await getDepartments(req, res);
  
  console.log('Testing getDoctors...');
  await getDoctors(req, res);
}

fetchInternal().then(() => process.exit(0));
