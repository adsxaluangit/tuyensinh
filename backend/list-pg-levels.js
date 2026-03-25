
const { Client } = require('pg');
async function checkLevels() {
    const pgClient = new Client({
        host: '127.0.0.1', port: 5435, database: 'tuyensinh_db', user: 'tuyensinh', password: 'tuyensinh_password',
    });
    try {
        await pgClient.connect();
        const res = await pgClient.query('SELECT name FROM education_levels');
        console.log('Postgres Levels:', res.rows);
        await pgClient.end();
    } catch (err) { console.error(err); }
}
checkLevels();
