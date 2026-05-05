const http = require('http');

http.get('http://localhost:5000/api/lab/orders?status=pending', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Body:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Body (raw):', data);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
