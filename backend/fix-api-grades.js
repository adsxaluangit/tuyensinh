const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/api.ts';
let content = fs.readFileSync(path, 'utf8');

// Add 'grades' to fieldNames array
if (content.includes("'diplomaNumber',") && !content.includes("'grades',")) {
    content = content.replace("'diplomaNumber',", "'diplomaNumber', 'grades',");
    console.log('Added grades to fieldNames.');
}

fs.writeFileSync(path, content, 'utf8');
