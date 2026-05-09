const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:kWOUUMbaTYzurQDkXYEnmCpnYyTlGNKD@hopper.proxy.rlwy.net:29017/railway?schema=public",
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log(res.rows.map(r => r.table_name));
  await client.end();
}

run().catch(console.error);
