const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
    // Source: edumaster_db
    const sourceClient = new Client({
        host: '127.0.0.1',
        port: 5432,
        database: 'edumaster',
        user: 'postgres',
        password: '123456', // Updated with correct password
    });

    // Target: tuyensinh_db
    const targetClient = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await sourceClient.connect();
        await targetClient.connect();
        console.log('Connected to both databases');

        // 1. Fetch Students from source
        const resSrc = await sourceClient.query('SELECT * FROM students');
        console.log(`Found ${resSrc.rows.length} students to migrate.`);

        // 2. Map Campuses and Levels in target
        const campuses = {};
        const resC = await targetClient.query('SELECT id, name FROM campuses');
        resC.rows.forEach(r => campuses[r.name.toLowerCase().trim()] = r.id);

        const levels = {};
        const resL = await targetClient.query('SELECT id, name FROM education_levels');
        resL.rows.forEach(r => levels[r.name.toLowerCase().trim()] = r.id);

        // 3. Migrate each student
        let count = 0;
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle day,month,year format like "20,10,1986" or "20/10/1986"
            const parts = dateStr.split(/[,\/]/);
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
            return dateStr; // fallback
        };

        for (const student of resSrc.rows) {
            const docId = uuidv4();
            
            const fullName = student.full_name;
            const dob = parseDate(student.dob);
            const phone = student.phone;
            const address = student.address;
            const gender = student.gender;
            const ethnicity = student.ethnicity;
            const pob = student.pob;
            const idNumber = student.id_number;

            const resTarget = await targetClient.query(
                `INSERT INTO registrations 
                 (full_name, dob, phone, address_details, gender, ethnicity, pob, id_number, 
                  status, tuition_status, document_id, published_at, created_at, updated_at, locale) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW(), 'vi') 
                 RETURNING id`,
                [
                    fullName, dob, phone, address, gender, ethnicity, pob, idNumber,
                    'Mới', 'Chưa nộp', docId
                ]
            );
            
            const regId = resTarget.rows[0].id;
            
            // Link to a default campus (Hải Phòng) if none specified
            const defaultCampusId = campuses['hải phòng'];
            if (defaultCampusId) {
                await targetClient.query('INSERT INTO registrations_campus_lnk (registration_id, campus_id) VALUES ($1, $2)', [regId, defaultCampusId]);
            }

            count++;
        }

        console.log(`Successfully migrated ${count} registrations!`);
        
        await sourceClient.end();
        await targetClient.end();
    } catch (err) {
        console.error('Migration Error:', err);
    }
}

migrate();
