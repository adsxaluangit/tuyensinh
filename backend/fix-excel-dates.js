const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add formatDate helper if not present, but for now I'll just use it inline in the script's replacement logic
const formatDateFunc = `  const formatDateValue = (date: any) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return \`\${day}/\${month}/\${year}\`;
    } catch {
      return '';
    }
  };`;

// Insert the helper after isAdmin definition
if (!content.includes('const formatDateValue')) {
    content = content.replace("const isAdmin = user?.role === 'Quản trị viên';", `const isAdmin = user?.role === 'Quản trị viên';\n  ${formatDateFunc}`);
}

// 2. Replace the calling logic in handleExportExcel
// Search for .toLocaleDateString('vi-VN')
content = content.replace(/\.toLocaleDateString\('vi-VN'\)/g, ''); // Clear the calls first to avoid double formatting if I was to replace
// Wait, better to just replace the whole patterns

content = content.replace(/s\.submissionDate \? new Date\(s\.submissionDate\)\.toLocaleDateString\('vi-VN'\) : ''/g, 'formatDateValue(s.submissionDate)');
content = content.replace(/s\.dob \? new Date\(s\.dob\)\.toLocaleDateString\('vi-VN'\) : ''/g, 'formatDateValue(s.dob)');
content = content.replace(/s\.issueDate \? new Date\(s\.issueDate\)\.toLocaleDateString\('vi-VN'\) : ''/g, 'formatDateValue(s.issueDate)');

fs.writeFileSync(path, content, 'utf8');
console.log('Synchronized campus names and updated roles.');
