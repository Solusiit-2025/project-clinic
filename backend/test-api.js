const http = require('http');

const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // from the logs
const token = '1'; // Actually it's blocked by authMiddleware? Let's check if authMiddleware is active for doctors.

async function fetchInternal() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Create a fast token for a known user if authMiddleware is strictly verifying jwt
  // We can just rely on the controller logic directly with stubbed req/res if JWT is annoying, 
  // but let's see if we can just test the local API
  
  const masterController = require('./src/controllers/master.controller');
  
  const req = {
    query: { clinicId },
    clinicId: clinicId,
    user: { role: 'ADMIN', clinics: [] }
  };
  
  const res = {
    json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (err) => console.error('Error', code, err) })
  };
  
  console.log('Testing getDepartments...');
  await masterController.getDepartments(req, res);
  
  console.log('Testing getDoctors...');
  await masterController.getDoctors(req, res);
}

fetchInternal();
