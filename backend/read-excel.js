
const XLSX = require('xlsx');
const path = require('path');

try {
    const workbook = XLSX.readFile(path.join(__dirname, '..', 'Mau_cau_hinh_hoc_phi.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log('Excel Data Sample (first 3 rows):');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
    console.log('Total rows:', data.length);
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
