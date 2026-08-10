const pg = require('/home/nt.nhan@pace.edu.vn/Documents/github/hula-erp/node_modules/pg');
const client = new pg.Client({
  host: '192.168.1.206',
  port: 5432,
  user: 'hula_user',
  password: 'hula_password',
  database: 'hula_db'
});
client.connect()
  .then(async () => {
    console.log("--- Materials ---");
    const matRes = await client.query(`SELECT id, code, name FROM materials WHERE code LIKE '%VGNA_HQ%' OR name LIKE '%VGNA_HQ%' OR code LIKE '%RGNA_DU%' OR name LIKE '%RGNA_DU%';`);
    console.table(matRes.rows);
    console.log("--- Products ---");
    const prodRes = await client.query(`SELECT id, sku, name, product_type FROM products WHERE sku LIKE '%VGNA_HQ%' OR name LIKE '%VGNA_HQ%' OR sku LIKE '%RGNA_DU%' OR name LIKE '%RGNA_DU%';`);
    console.table(prodRes.rows);
  })
  .then(() => client.end())
  .catch(err => { console.error(err); client.end(); });
