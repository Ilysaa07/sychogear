const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres.rricgoecnvbtarpdtrls:Akmalzikri123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'orders'
  `);
  console.log('Columns in orders table:', res.rows.map(r => r.column_name));
  await client.end();
}

check().catch(console.error);
