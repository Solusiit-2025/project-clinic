const axios = require('axios')

async function main() {
  try {
    const res = await axios.get('http://localhost:5000/api/lab/orders?status=pending')
    console.log('Orders from API:', JSON.stringify(res.data, null, 2))
  } catch (e) {
    console.error('Error fetching orders:', e.message)
  }
}

main()
