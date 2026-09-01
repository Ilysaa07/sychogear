import { config } from 'dotenv';
config({ path: '.env.local' });
import { Client } from 'pg';

async function check() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const res = await client.query('SELECT * FROM product_variants WHERE stock < 0');
  console.log("NEGATIVE_STOCK_RESULTS:");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

check().catch(console.error).finally(() => process.exit(0));
