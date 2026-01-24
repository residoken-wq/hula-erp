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
        console.log('Connected to DB');

        const username = 'thuhang';

        // 1. Find User
        const userRes = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userRes.rows.length === 0) {
            console.error(`User ${username} not found!`);
            return;
        }
        const user = userRes.rows[0];
        console.log(`User found: ${user.username} (ID: ${user.id}, Group ID: ${user.group_id})`);

        if (!user.group_id) {
            console.error(`User ${username} has no group assigned!`);
            return;
        }

        const groupId = user.group_id;

        // 2. Check Permission
        const permRes = await client.query(
            'SELECT * FROM group_permissions WHERE group_id = $1 AND module_code = $2',
            [groupId, 'CMS']
        );

        if (permRes.rows.length > 0) {
            console.log('CMS Permission already exists for this group.');
            const perm = permRes.rows[0];
            if (!perm.can_view) {
                console.log('Updating can_view to true...');
                await client.query(
                    'UPDATE group_permissions SET can_view = true WHERE id = $1',
                    [perm.id]
                );
                console.log('Updated.');
            }
        } else {
            console.log('CMS Permission not found. Creating...');
            await client.query(
                `INSERT INTO group_permissions 
                (module_code, can_view, can_create, can_update, can_delete, view_cost_price, group_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['CMS', true, true, true, true, false, groupId]
            );
            console.log('Created CMS permission.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
