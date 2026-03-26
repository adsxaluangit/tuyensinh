const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update headers
const headersSearch = /'Chi tiết nới nhận'\s+\];/g;
const headersReplace = "'Chi tiết nới nhận',\n        'Điểm trung bình'\n      ];";
content = content.replace(headersSearch, headersReplace);

// 2. Update rows
// We need to find the mapping function and inject the calculation
const rowsSearch = /const rows = allData\.map\(\(s: any, idx: number\) => \[([\s\S]+?s\.deliveryAddressDetails\s+)\]\);/g;
const rowsReplace = `const rows = allData.map((s: any, idx: number) => {
        const grades = s.grades || {};
        const sum = SUBJECTS.reduce((acc, sub) => acc + (parseFloat(grades[sub]) || 0), 0);
        const avg = (sum / SUBJECTS.length).toFixed(2);

        return [$1,
          avg
        ];
      });`;

content = content.replace(rowsSearch, rowsReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Synchronized campus names and updated roles.');
