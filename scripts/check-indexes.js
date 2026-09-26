const { Client } = require('pg');

async function getIndexes() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'hula_user',
    password: 'hula_password',
    database: 'hula_db',
  });
  await client.connect();
  const res = await client.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename LIKE 'chatbot_%' 
    ORDER BY tablename, indexname;
  `);
  await client.end();
  return res.rows;
}

getIndexes()
  .then((rows) => {
    console.log(`Total chatbot indexes: ${rows.length}`);
    for (const r of rows) {
      console.log(`[${r.tablename}] ${r.indexname} -> ${r.indexdef}`);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
