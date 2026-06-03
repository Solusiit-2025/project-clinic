const axios = require('axios');

async function check() {
  try {
    const queueId = '5f4f93d8-ba17-44fa-9f88-427e31775baa';
    const queueRes = await axios.get(`http://localhost:5006/api/transactions/queues/${queueId}`);
    const regId = queueRes.data.registrationId;
    console.log('Registration ID:', regId);
    
    if (regId) {
      const mrRes = await axios.get(`http://localhost:5006/api/transactions/medical-records/registration/${regId}`);
      console.log('Medical Record:', JSON.stringify(mrRes.data, null, 2));
    }
  } catch (err) {
    console.error(err.message);
  }
}
check();
