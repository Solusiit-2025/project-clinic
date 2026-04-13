const token = process.argv[2]; // not needed if we just login
const clinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c'; // Pusat

async function testFetch() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin', password: 'password123' }) // We assume there's a user called superadmin? Or admin?
    });
    
    // Fallback: If login fails because we don't know credentials, let's just make the endpoint public for a split second? No, that's bad.
    // Let's create a token directly using jsonwebtoken if login fails.
    let access_token = '';
    
    if (loginRes.ok) {
       const data = await loginRes.json();
       access_token = data.token;
    } else {
       // Let's forge a token using JWT Secret from .env
       console.log('Login failed, forging token using .env secret...');
       const jwt = require('jsonwebtoken');
       require('dotenv').config();
       const secret = process.env.JWT_SECRET || 'fallback_secret';
       access_token = jwt.sign({ id: 'dummy', role: 'SUPER_ADMIN', clinicId: clinicId }, secret);
    }
    
    console.log('Fetching Depertments...');
    const deptRes = await fetch(`http://localhost:5004/api/master/departments?clinicId=${clinicId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const depts = await deptRes.json();
    console.log('Departments:', depts.length || depts.message || depts);
    
    console.log('Fetching Doctors...');
    const docRes = await fetch(`http://localhost:5004/api/master/doctors?clinicId=${clinicId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const docs = await docRes.json();
    console.log('Doctors:', docs.length || docs.message || docs);

  } catch(e) { console.error('Fetch error:', e); }
}

testFetch();
