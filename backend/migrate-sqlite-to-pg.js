const SQLite = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

async function migrate() {
    console.log('Starting migration from SQLite to PostgreSQL...');

    const db = new SQLite(path.join(__dirname, '.tmp', 'data.db'));
    const pgClient = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await pgClient.connect();
        console.log('Connected to PostgreSQL');

        // 1. Migrate admin_users
        console.log('Migrating admin_users...');
        const adminUsers = db.prepare('SELECT * FROM admin_users').all();
        for (const user of adminUsers) {
            // Check if user already exists
            const existing = await pgClient.query('SELECT id FROM admin_users WHERE email = $1', [user.email]);
            if (existing.rows.length === 0) {
                const fields = Object.keys(user).filter(k => k !== 'id');
                const values = fields.map(k => user[k]);
                const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO admin_users (${fields.join(', ')}) VALUES (${placeholders}) RETURNING id`;
                const res = await pgClient.query(query, values);
                console.log(`Migrated admin user: ${user.email} (ID: ${res.rows[0].id})`);
                
                // Migrate role link
                const roleLinks = db.prepare('SELECT * FROM admin_users_roles_lnk WHERE user_id = ?').all(user.id);
                for (const link of roleLinks) {
                    await pgClient.query('INSERT INTO admin_users_roles_lnk (user_id, role_id) VALUES ($1, $2)', [res.rows[0].id, link.role_id]);
                }
            } else {
                console.log(`Admin user ${user.email} already exists in PG.`);
            }
        }

        // 2. Migrate campuses
        console.log('Migrating campuses...');
        const campuses = db.prepare('SELECT * FROM campuses').all();
        for (const campus of campuses) {
            const existing = await pgClient.query('SELECT id FROM campuses WHERE name = $1', [campus.name]);
            if (existing.rows.length === 0) {
                const fields = Object.keys(campus).filter(k => k !== 'id');
                const values = fields.map(k => campus[k]);
                const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO campuses (${fields.join(', ')}) VALUES (${placeholders})`;
                await pgClient.query(query, values);
                console.log(`Migrated campus: ${campus.name}`);
            }
        }

        // 3. Migrate education_levels
        console.log('Migrating education_levels...');
        const levels = db.prepare('SELECT * FROM education_levels').all();
        for (const level of levels) {
            const existing = await pgClient.query('SELECT id FROM education_levels WHERE name = $1', [level.name]);
            if (existing.rows.length === 0) {
                const fields = Object.keys(level).filter(k => k !== 'id');
                const values = fields.map(k => level[k]);
                const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO education_levels (${fields.join(', ')}) VALUES (${placeholders})`;
                await pgClient.query(query, values);
                console.log(`Migrated education level: ${level.name}`);
            }
        }

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        db.close();
        await pgClient.end();
    }
}

migrate();
