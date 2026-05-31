const https = require('https');
const http = require('http');

async function testApi() {
  const loginData = JSON.stringify({ email: 'superadmin@clinic.com', password: 'password123' }); // guessing password
  
  const options = {
    hostname: 'yasfina-app.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Login Status:', res.statusCode);
      if (res.statusCode === 200) {
        const cookies = res.headers['set-cookie'];
        console.log('Got cookies:', cookies);
        
        // Now fetch queues
        const qOptions = {
          hostname: 'yasfina-app.com',
          port: 443,
          path: '/api/transactions/queues?clinicId=46176c91-1355-4fb9-acfe-1a753e296fd5',
          method: 'GET',
          headers: {
            'Cookie': cookies.join('; '),
            'x-clinic-id': '46176c91-1355-4fb9-acfe-1a753e296fd5'
          }
        };
        const qReq = https.request(qOptions, (qRes) => {
          let qData = '';
          qRes.on('data', chunk => qData += chunk);
          qRes.on('end', () => {
            console.log('Queues Status:', qRes.statusCode);
            console.log('Queues Data:', qData.substring(0, 300));
          });
        });
        qReq.end();
      } else {
        console.log('Login failed:', data);
      }
    });
  });
  
  req.on('error', console.error);
  req.write(loginData);
  req.end();
}

testApi();
