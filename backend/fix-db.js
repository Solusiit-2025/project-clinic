const { Client } = require('pg');
require('dotenv').config();

async function addColumns() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to Production DB');
    
    await client.query('ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS "visitId" TEXT;');
    console.log('✅ Added visitId column');

    await client.query('ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS "treatmentPlanId" TEXT;');
    console.log('✅ Added treatmentPlanId column');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}
addColumns();
