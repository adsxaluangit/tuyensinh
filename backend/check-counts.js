
const { Client } = require('pg');

async function checkData() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5432,
        database: 'tuyensinh',
        user: 'postgres',
        password: '123456',
    });

    try {
        await client.connect();
        const tables = ['campuses', 'education_levels', 'occupations', 'registrations'];
        for (const table of tables) {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table}: ${res.rows[0].count} rows`);
        }
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.stack);
    }
}

checkData();
