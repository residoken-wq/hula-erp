const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'hula_user',
  password: 'hula_password',
  database: 'hula_db'
});
client.connect()
  .then(() => client.query(`
    SELECT m.id, m.code, m.name, m.quantity_in_stock, i.warehouse_code, i.quantity 
    FROM materials m 
    LEFT JOIN inventory_stock i ON i.item_id = m.id AND i.item_type = 'MATERIAL' 
    WHERE m.name LIKE '%Gai xé%'
  `))
  .then(res => { console.table(res.rows); client.end(); })
  .catch(err => { console.error(err); client.end(); });
