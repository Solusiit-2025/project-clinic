const jwt = require('jsonwebtoken');
const http = require('http');

const jwtSecret = '7e720046bd2431f73721bf2d34472baf787f0acdca8a57fd935d97a4e0a5344f54fd13eac9994dd18e18110cda232e4661f074a69ab01a67910957b30f84628a';
const token = jwt.sign({ id: 'b8b9d4c7-96d4-43d9-b816-7788b10c583c' }, jwtSecret, { expiresIn: '1d' });

const options = {
  hostname: 'localhost',
  port: 5006,
  path: '/api/transactions/queues?clinicId=46176c91-1355-4fb9-acfe-1a753e296fd5',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-clinic-id': '46176c91-1355-4fb9-acfe-1a753e296fd5'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 500) {
      console.log('ERROR JSON:', data);
    } else {
      console.log('Data length:', data.length);
      console.log('Sample:', data.substring(0, 300));
    }
  });
});
req.on('error', console.error);
req.end();
