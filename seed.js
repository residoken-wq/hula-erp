const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'parsed_questions.json'), 'utf8'));

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USERNAME || 'hula_user',
        password: process.env.DB_PASSWORD || 'hula_password',
        database: process.env.DB_DATABASE || 'hula_db',
    });

    await client.connect();

    console.log('Connected to DB. Seeding ' + data.length + ' questions...');

    for (const q of data) {
        await client.query(
            `INSERT INTO review_questions (content, category, type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
            [q.content, q.category, q.type]
        );
    }

    console.log('Done!');
    await client.end();
}

seed().catch(console.error);
