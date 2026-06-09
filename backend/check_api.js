const http = require('http');

http.get('http://localhost:3000/api/inventory/procurement', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Status code:', res.statusCode);
      if (parsed.length > 0) {
        console.log('First procurement items:', JSON.stringify(parsed[0].items, null, 2));
      } else {
        console.log('No procurements found');
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
