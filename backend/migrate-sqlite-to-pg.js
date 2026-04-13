const { Client } = require('pg');
const SQLite = require('better-sqlite3');
const crypto = require('crypto');

const pgConfig = {
    host: '127.0.0.1',
    port: 5435,
    database: 'tuyensinh_db',
    user: 'tuyensinh',
    password: 'tuyensinh_password'
};

const sqlitePath = 'd:\\Github\\tuyensinh\\backend\\.tmp\\data.db';

function formatTS(ts) {
    if (!ts) return new Date().toISOString();
    if (typeof ts === 'number') return new Date(ts).toISOString();
    return ts;
}

async function migrate() {
    console.log('Starting CLEAN migration with proper timestamps...');
    
    const db = new SQLite(sqlitePath);
    const pgClient = new Client(pgConfig);

    try {
        await pgClient.connect();
        console.log('Connected to PostgreSQL');

        console.log('Truncating tables...');
        const tablesToTruncate = [
            'registrations_education_level_lnk',
            'registrations_campus_lnk',
            'occupations_education_level_lnk',
            'occupations_campus_lnk',
            'registrations',
            'occupations',
            'education_levels',
            'campuses',
            'admin_users_roles_lnk'
        ];
        for (const table of tablesToTruncate) {
            await pgClient.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        }
        await pgClient.query('DELETE FROM admin_users'); // Clean admin users too
        console.log('Tables truncated.');

        const now = new Date().toISOString();
        const generateDocId = () => crypto.randomBytes(12).toString('hex');

        // 1. Migrate admin_users
        console.log('\n--- Migrating admin_users ---');
        const adminUsers = db.prepare('SELECT * FROM admin_users').all();
        for (const user of adminUsers) {
            console.log(`Inserting admin user: ${user.email}`);
            await pgClient.query(
                `INSERT INTO admin_users (firstname, lastname, email, password, registration_token, reset_password_token, is_active, blocked, prefered_language, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [user.firstname, user.lastname, user.email, user.password, user.registration_token, user.reset_password_token, user.is_active, user.blocked, user.prefered_language, formatTS(user.created_at), formatTS(user.updated_at)]
            );
            await pgClient.query(
                'INSERT INTO admin_users_roles_lnk (user_id, role_id) VALUES ((SELECT id FROM admin_users WHERE email = $1), 1)',
                [user.email]
            );
        }

        // 2. Migrate campuses
        console.log('\n--- Migrating campuses ---');
        const campuses = db.prepare('SELECT * FROM campuses').all();
        for (const campus of campuses) {
            console.log(`Inserting campus: ${campus.name}`);
            const docId = generateDocId();
            await pgClient.query(
                `INSERT INTO campuses (document_id, name, code, address, created_at, updated_at, published_at, locale) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [docId, campus.name, campus.code, campus.address, formatTS(campus.created_at), formatTS(campus.updated_at), now, 'en']
            );
        }

        // 3. Migrate education_levels
        console.log('\n--- Migrating education_levels ---');
        const levels = db.prepare('SELECT * FROM education_levels').all();
        for (const level of levels) {
            console.log(`Inserting education level: ${level.name}`);
            const docId = generateDocId();
            await pgClient.query(
                `INSERT INTO education_levels (document_id, name, code, description, created_at, updated_at, published_at, locale) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [docId, level.name, level.code, level.description, formatTS(level.created_at), formatTS(level.updated_at), now, 'en']
            );
        }

        console.log('\nMigration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pgClient.end();
        db.close();
    }
}

migrate();
