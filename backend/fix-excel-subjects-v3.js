const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update headers - using the actual state I saw in previous view_file
// Search for SUBJECTS.map(s => `Điểm ${s}`),
content = content.replace(/SUBJECTS.map\(s => `Điểm \${s}`\),/g, '...SUBJECTS.map(s => `Điểm ${s}`),');

// 2. Update rows - using the actual state I saw
// return [\s+idx + 1,[\s\S]+?s\.deliveryAddressDetails\s+,\s+avg\s+];
const rowsMatch = /return \[\s+idx \+ 1[\s\S]+?s\.deliveryAddressDetails\s+,\s+avg\s+\];/g;
const rowsReplace = `return [
          idx + 1,
          s.submissionDate ? new Date(s.submissionDate).toLocaleDateString('vi-VN') : '',
          s.status,
          s.fullName,
          s.gender,
          s.dob ? new Date(s.dob).toLocaleDateString('vi-VN') : '',
          s.pob,
          s.ethnicity,
          \`'\${s.idNumber}\`,
          s.issueDate ? new Date(s.issueDate).toLocaleDateString('vi-VN') : '',
          s.issuePlace,
          \`'\${s.phone}\`,
          s.email,
          s.addressDetails,
          s.district,
          s.province,
          s.parentName,
          \`'\${s.parentPhone}\`,
          s.campus,
          s.educationLevel,
          s.choice1Major,
          s.choice1Specialty,
          s.choice2Major || '',
          s.choice2Specialty || '',
          s.gradSchool,
          s.gradYear,
          s.diplomaNumber,
          s.recipient,
          s.deliveryAddress,
          s.deliveryAddressDetails,
          ...SUBJECTS.map(sub => grades[sub] || '0'),
          avg
        ];`;

content = content.replace(rowsMatch, rowsReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed subjects columns formatting.');
