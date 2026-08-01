const { Client } = require('pg');
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'hula_user',
    password: process.env.DB_PASSWORD || 'hula_password',
    database: process.env.DB_DATABASE || 'hula_db',
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM product_routings LIMIT 10');
        console.log("Routings:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
