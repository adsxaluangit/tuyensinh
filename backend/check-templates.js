
const { Client } = require('pg');

async function checkAdmissionTemplates() {
    const client = new Client({
        host: '127.0.0.1', port: 5432, database: 'tuyensinh', user: 'postgres', password: '123456',
    });
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM admission_templates');
        console.log('Admission Templates:', JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (err) {
        console.error(err);
    }
}
checkAdmissionTemplates();
