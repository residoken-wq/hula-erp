import { Client } from 'pg';

const client = new Client({
    host: process.env.DB_HOST || 'localhost', // Default to localhost for external test, user might need to change to 'db' inside container
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'hula_user',
    password: process.env.DB_PASSWORD || 'hula_password',
    database: process.env.DB_DATABASE || 'hula_db',
});

console.log('Connecting to DB...', {
    host: client.host,
    port: client.port,
    user: client.user,
    database: client.database
});

client.connect()
    .then(() => {
        console.log('✅ Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('❌ Connection failed!', err);
        process.exit(1);
    });
