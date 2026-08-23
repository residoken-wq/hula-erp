const { Pool } = require('pg');

const pool = new Pool({
  user: 'hula_user',
  host: 'localhost',
  database: 'hula_db',
  password: 'hula_password',
  port: 5432,
});

async function main() {
  const res = await pool.query("SELECT id, code, status, sales_order_id, created_at FROM sales_deliveries WHERE code = 'PXK-230826-9248'");
  console.log('Delivery:', res.rows);
  
  if (res.rows.length > 0) {
    const deliveryId = res.rows[0].id;
    const itemsRes = await pool.query("SELECT * FROM sales_delivery_items WHERE delivery_id = $1", [deliveryId]);
    console.log('Items:', itemsRes.rows);
  }
  pool.end();
}

main().catch(console.error);
