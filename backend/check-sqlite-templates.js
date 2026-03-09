
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(dbPath);
try {
    const data = db.prepare("SELECT * FROM admission_templates").all();
    console.log('SQLite Admission Templates:', JSON.stringify(data, null, 2));
} catch (e) {
    console.log('Table not found or error');
} finally {
    db.close();
}
