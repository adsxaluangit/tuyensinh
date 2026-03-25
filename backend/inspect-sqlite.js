const SQLite = require('better-sqlite3');
const db = new SQLite('d:/Github/tuyensinh/backend/.tmp/data.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));

for (const table of tables) {
    if (table.name.startsWith('sqlite_')) continue;
    const count = db.prepare(`SELECT count(*) as count FROM "${table.name}"`).get();
    console.log(`${table.name}: ${count.count} rows`);
}
db.close();
