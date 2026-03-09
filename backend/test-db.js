
const { Client } = require('pg');

async function checkDb() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5432,
        database: 'tuyensinh',
        user: 'postgres',
        password: '123456',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.stack);
    }
}

checkDb();
