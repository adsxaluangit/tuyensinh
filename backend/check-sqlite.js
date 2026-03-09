
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(dbPath);

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('SQLite Tables:', tables.map(t => t.name));

    const checkTables = ['campuses', 'education_levels', 'occupations', 'registrations'];
    for (const table of checkTables) {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            console.log(`SQLite ${table}: ${count} rows`);
        } catch (e) {
            console.log(`SQLite ${table}: Table not found or error`);
        }
    }
} catch (err) {
    console.error(err);
} finally {
    db.close();
}
