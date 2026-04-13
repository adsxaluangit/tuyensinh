const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
    const pgClient = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await pgClient.connect();
        console.log('Connected to PostgreSQL (tuyensinh_db)');

        // Load Excel
        const workbook = XLSX.readFile(path.join(__dirname, '..', 'Mau_cau_hinh_hoc_phi.xlsx'));
        const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        // 1. Map existing Campuses and Levels
        const campuses = {};
        const resC = await pgClient.query('SELECT id, name FROM campuses');
        resC.rows.forEach(r => campuses[r.name.toLowerCase().trim()] = r.id);

        const levels = {};
        const resL = await pgClient.query('SELECT id, name FROM education_levels');
        resL.rows.forEach(r => levels[r.name.toLowerCase().trim()] = r.id);

        // 2. Clear old occupation data (optional but safer for clean start)
        console.log('Cleaning up existing occupations...');
        await pgClient.query('DELETE FROM occupations_campus_lnk');
        await pgClient.query('DELETE FROM occupations_education_level_lnk');
        await pgClient.query('DELETE FROM occupations');

        console.log(`Starting migration of ${excelData.length} occupations...`);

        let count = 0;
        for (const row of excelData) {
            const name = row['Tên nghề đào tạo'];
            const code = row['Mã nghề'] ? row['Mã nghề'].toString().trim() : '';
            const campusName = row['Cơ sở'] ? row['Cơ sở'].trim() : '';
            const levelName = row['Hệ'] ? row['Hệ'].trim() : '';

            if (!name) continue;

            const docId = uuidv4();
            const resOcc = await pgClient.query(
                `INSERT INTO occupations (name, code, document_id, published_at, created_at, updated_at, locale) 
                 VALUES ($1, $2, $3, NOW(), NOW(), NOW(), 'vi') 
                 RETURNING id`,
                [name, code, docId]
            );
            const occId = resOcc.rows[0].id;

            // Link Campus
            const campusId = campuses[campusName.toLowerCase()];
            if (campusId) {
                await pgClient.query('INSERT INTO occupations_campus_lnk (occupation_id, campus_id) VALUES ($1, $2)', [occId, campusId]);
            } else if (campusName) {
                 console.warn(`Campus not found: ${campusName} for occupation ${name}`);
            }

            // Link Level
            const levelId = levels[levelName.toLowerCase()];
            if (levelId) {
                await pgClient.query('INSERT INTO occupations_education_level_lnk (occupation_id, education_level_id) VALUES ($1, $2)', [occId, levelId]);
            } else if (levelName) {
                 console.warn(`Education Level not found: ${levelName} for occupation ${name}`);
            }

            count++;
        }

        console.log(`Successfully migrated ${count} occupations!`);
        await pgClient.end();
    } catch (err) {
        console.error('Migration Error:', err);
    }
}

migrate();
