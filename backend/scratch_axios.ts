import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('http://localhost:5004/api/inventory/products', {
      params: { branchId: 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c', search: '' }
    });
    console.log(`Status: ${res.status}`);
    console.log(`Data count: ${res.data.length}`);
    if (res.data.length > 0) {
       console.log('First Item:', res.data[0].productName);
    }
  } catch (err: any) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

main();
