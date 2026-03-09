
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(dbPath);
try {
    const data = db.prepare("SELECT name FROM education_levels").all();
    console.log('SQLite Education Levels:', data);
} catch (e) {
    console.log(e);
} finally {
    db.close();
}
