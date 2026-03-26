const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update headers to include all subjects
const headersSearch = /'Điểm trung bình'\n\s+\];/g;
const subjectsHeaders = "SUBJECTS.map(s => `Điểm ${s}`),\n        'Điểm trung bình'\n      ];";
content = content.replace(headersSearch, subjectsHeaders);

// 2. Update rows to include subject scores
// We need to inject the subject grades into the return array
const rowsSearch = /return \[([\s\S]+?s\.deliveryAddressDetails),\s+avg\s+\];/g;
const rowsReplace = `return [$1,
          ...SUBJECTS.map(sub => grades[sub] || '0'),
          avg
        ];`;

content = content.replace(rowsSearch, rowsReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Added individual subject columns to Excel export.');
