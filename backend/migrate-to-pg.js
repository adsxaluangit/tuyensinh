const SQLite = require('better-sqlite3');
const { Client } = require('pg');

async function migrate() {
    const db = new SQLite('.tmp/data.db');
    const pg = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await pg.connect();
        console.log('Connected to PostgreSQL');

        const tables = [
            'admin_roles',
            'admin_users',
            'admin_users_roles_lnk',
            'up_roles',
            'up_users',
            'up_users_role_lnk',
            'campuses',
            'education_levels',
            'occupations',
            'occupations_campus_lnk',
            'occupations_education_level_lnk',
            'registrations',
            'registrations_campus_lnk',
            'registrations_education_level_lnk'
        ];

        for (const table of tables) {
            console.log(`Migrating table: ${table}...`);
            
            // Get columns
            const columnsInfo = db.prepare(`PRAGMA table_info(${table})`).all();
            const columns = columnsInfo.map(c => c.name);
            
            if (columns.length === 0) {
                console.log(`Table ${table} not found in SQLite, skipping.`);
                continue;
            }

            // Get data
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            console.log(`Found ${rows.length} rows in ${table}`);

            if (rows.length === 0) continue;

            // Clear PG table (optional, but safer for a clean migration)
            // await pg.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

            // Insert into PG
            for (const row of rows) {
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const vals = columns.map(c => {
                    let val = row[c];
                    // Convert Strapi timestamps to Date objects
                    if (['created_at', 'updated_at', 'published_at'].includes(c) && typeof val === 'number') {
                        return new Date(val);
                    }
                    return val;
                });
                const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
                try {
                    await pg.query(query, vals);
                } catch (err) {
                    console.error(`Error inserting into ${table}:`, err.message);
                }
            }
        }

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        db.close();
        await pg.end();
    }
}

migrate();
