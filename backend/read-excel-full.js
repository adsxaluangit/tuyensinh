
const XLSX = require('xlsx');
const path = require('path');
const workbook = XLSX.readFile(path.join(__dirname, '..', 'Mau_cau_hinh_hoc_phi.xlsx'));
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
console.log('Available columns:', Object.keys(data[0]));
console.log('Sample with fee:', data.find(d => d['Học phí'] !== undefined || d['Amount'] !== undefined));
