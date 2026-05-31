/**
 * Debug script: Login ke production dan test endpoint /queues
 * Usage: node debug-prod-queues.js <username> <password>
 */
const https = require('https');

const BASE = 'yasfina-app.com';
const CLINIC_ID = '46176c91-1355-4fb9-acfe-1a753e296fd5';

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'password';

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('PRODUCTION QUEUE DEBUG TOOL');
  console.log('='.repeat(60));

  // Step 1: Login
  console.log(`\n[1] Login sebagai: ${username}`);
  const loginBody = JSON.stringify({ email: username, password });
  const loginRes = await httpsRequest({
    hostname: BASE,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody)
    }
  }, loginBody);

  console.log('Login status:', loginRes.status);
  if (loginRes.status !== 200) {
    console.error('❌ Login gagal:', loginRes.body);
    return;
  }

  // Extract cookie
  const setCookie = loginRes.headers['set-cookie'] || [];
  const authCookie = setCookie.find(c => c.includes('auth_token')) || '';
  const cookieValue = authCookie.split(';')[0];
  console.log('✅ Login berhasil. Cookie:', cookieValue ? cookieValue.substring(0, 40) + '...' : 'TIDAK ADA COOKIE!');

  if (!cookieValue) {
    console.error('❌ Tidak ada auth_token cookie. Cek login response.');
    console.log('Response body:', loginRes.body);
    return;
  }

  // Step 2: Test GET /queues
  console.log(`\n[2] Fetch queues untuk clinicId: ${CLINIC_ID}`);
  const queuesRes = await httpsRequest({
    hostname: BASE,
    path: `/api/transactions/queues?clinicId=${CLINIC_ID}`,
    method: 'GET',
    headers: {
      'Cookie': cookieValue,
      'x-clinic-id': CLINIC_ID
    }
  });

  console.log('Queues status:', queuesRes.status);
  if (queuesRes.status === 500) {
    console.error('❌ ERROR 500!');
    console.error('Error message:', queuesRes.body?.message || queuesRes.body);
    console.log('\n→ Ini adalah error message dari server. Cek pm2 logs untuk detail lengkap.');
  } else if (queuesRes.status === 200) {
    const queues = queuesRes.body;
    const count = Array.isArray(queues) ? queues.length : queues?.data?.length || 0;
    console.log(`✅ Berhasil! Jumlah antrian hari ini: ${count}`);
    if (count > 0) {
      const sample = Array.isArray(queues) ? queues[0] : queues.data[0];
      console.log('Contoh data:', JSON.stringify({
        queueNo: sample.queueNo,
        queueDate: sample.queueDate,
        patientName: sample.patient?.name,
        status: sample.status
      }, null, 2));
    } else {
      console.log('⚠️  Tidak ada antrian. Kemungkinan filter tanggal tidak cocok.');
      console.log('Data lengkap:', JSON.stringify(queues, null, 2).substring(0, 500));
    }
  } else {
    console.log('Response:', queuesRes.body);
  }

  // Step 3: Cek tanggal server
  console.log('\n[3] Cek endpoint health');
  const healthRes = await httpsRequest({
    hostname: BASE,
    path: '/api/health',
    method: 'GET',
  });
  console.log('Health:', healthRes.body);
}

main().catch(console.error);
