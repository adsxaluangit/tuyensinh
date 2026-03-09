
const { Client } = require('pg');
async function checkLevels() {
    const client = new Client({ host: '127.0.0.1', port: 5432, database: 'tuyensinh', user: 'postgres', password: '123456' });
    try {
        await client.connect();
        const res = await client.query('SELECT name FROM education_levels');
        console.log('Postgres Levels:', res.rows);
        await client.end();
    } catch (err) { console.error(err); }
}
checkLevels();
