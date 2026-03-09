
const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function sync() {
    const pgClient = new Client({
        host: '127.0.0.1', port: 5432, database: 'tuyensinh', user: 'postgres', password: '123456',
    });

    try {
        await pgClient.connect();
        console.log('Connected to PostgreSQL');

        // Load Excel
        const workbook = XLSX.readFile(path.join(__dirname, '..', 'Mau_cau_hinh_hoc_phi.xlsx'));
        const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        // 1. Get/Create Campuses & Education Levels
        const campuses = {}; // name -> id
        const resC = await pgClient.query('SELECT id, name FROM campuses');
        resC.rows.forEach(r => campuses[r.name] = r.id);

        const levels = {}; // name -> id
        const resL = await pgClient.query('SELECT id, name FROM education_levels');
        resL.rows.forEach(r => levels[r.name] = r.id);

        // 2. Clear old occupation relations and occupations
        await pgClient.query('DELETE FROM occupations_campus_lnk');
        await pgClient.query('DELETE FROM occupations_education_level_lnk');
        await pgClient.query('DELETE FROM occupations');

        console.log('Cleared old data. Importing 91 occupations...');

        // 3. Insert Occupations
        for (const row of excelData) {
            const name = row['Tên nghề đào tạo'] || 'Chưa xác định';
            const code = row['Mã nghề'] ? row['Mã nghề'].toString() : '';
            const campusName = row['Cơ sở'];
            const levelName = row['Hệ'];

            // Ensure campus exists
            if (campusName && !campuses[campusName]) {
                const docId = uuidv4();
                const res = await pgClient.query('INSERT INTO campuses (name, document_id, published_at, created_at, updated_at) VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id', [campusName, docId]);
                campuses[campusName] = res.rows[0].id;
            }

            // Ensure level exists
            if (levelName && !levels[levelName]) {
                const docId = uuidv4();
                const res = await pgClient.query('INSERT INTO education_levels (name, document_id, published_at, created_at, updated_at) VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id', [levelName, docId]);
                levels[levelName] = res.rows[0].id;
            }

            // Insert Occupation
            const occDocId = uuidv4();
            const resOcc = await pgClient.query(
                'INSERT INTO occupations (name, code, document_id, published_at, created_at, updated_at, amount) VALUES ($1, $2, $3, NOW(), NOW(), NOW(), 0) RETURNING id',
                [name, code, occDocId]
            );
            const occId = resOcc.rows[0].id;

            // Create Links
            if (campusName) {
                await pgClient.query('INSERT INTO occupations_campus_lnk (occupation_id, campus_id) VALUES ($1, $2)', [occId, campuses[campusName]]);
            }
            if (levelName) {
                await pgClient.query('INSERT INTO occupations_education_level_lnk (occupation_id, education_level_id) VALUES ($1, $2)', [occId, levels[levelName]]);
            }
        }

        console.log('SUCCESS: Synced 91 occupations to PostgreSQL (pgAdmin 4)');
        await pgClient.end();
    } catch (err) {
        console.error('Sync Error:', err);
    }
}

sync();
