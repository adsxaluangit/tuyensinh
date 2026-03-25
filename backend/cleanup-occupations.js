const { Client } = require('pg');

const client = new Client({
  user: 'tuyensinh',
  host: 'localhost',
  database: 'tuyensinh_db',
  password: 'tuyensinh_password',
  port: 5435,
});

async function clearAllOccupationData() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    console.log('Clearing all occupation data and relations...');
    // TRUNCATE with CASCADE will also clear occupations_campus_lnk and occupations_education_level_lnk
    await client.query('TRUNCATE TABLE occupations RESTART IDENTITY CASCADE;');
    
    console.log('Cleanup successful. All occupations and their relations have been removed.');

    const res = await client.query('SELECT COUNT(*) FROM occupations;');
    console.log(`Current record count in occupations: ${res.rows[0].count}`);

  } catch (err) {
    console.error('Error during cleanup:', err.stack);
  } finally {
    await client.end();
  }
}

clearAllOccupationData();
