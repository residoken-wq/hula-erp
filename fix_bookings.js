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
        
        // 1. Find all PFOs that have GoodsIssues (PXK NPL) confirmed
        const res = await client.query(`
            SELECT DISTINCT p.id, p.sales_order_id 
            FROM production_fulfillment_orders p
            JOIN goods_issues gi ON gi.pfo_id = p.id
            WHERE gi.status = 'CONFIRMED' OR gi.status = 'DELIVERED'
        `);
        
        console.log(`Found ${res.rows.length} PFOs with confirmed GoodsIssues.`);
        
        for (const row of res.rows) {
            // Update PFO to IN_PRODUCTION if it's not already or beyond
            await client.query(`
                UPDATE production_fulfillment_orders 
                SET status = 'IN_PRODUCTION' 
                WHERE id = $1 AND status IN ('DRAFT', 'PENDING_APPROVAL', 'WAITING_VENDOR', 'MATERIAL_PREP')
            `, [row.id]);
            
            // Auto-confirm bookings
            if (row.sales_order_id) {
                const updateRes = await client.query(`
                    UPDATE sales_order_items
                    SET booking_status = 'CONFIRMED'
                    WHERE order_id = $1 AND booking_status = 'TEMPORARY'
                `, [row.sales_order_id]);
                console.log(`PFO ${row.id}: Confirmed ${updateRes.rowCount} bookings for SO ${row.sales_order_id}.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
