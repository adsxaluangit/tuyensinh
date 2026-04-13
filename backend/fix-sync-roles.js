const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Synchronize campus select in user modal (done in Step 1500 but let's be sure or see if others remain)
// I'll search for other occurrences of CAMPUSES.map
const search1 = /{CAMPUSES\.map\(c => <option key={c} value={c}>{c}<\/option>\)}/g;
const replace1 = `{campusConfigs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}`;
content = content.replace(search1, replace1);

// 2. Define isPowerUser or similar to allow Accountants to filter by campus
// search for const isAdmin = user?.role === 'Quản trị viên';
const isAdminDef = "const isAdmin = user?.role === 'Quản trị viên';";
const isPowerUserDef = "const isAdmin = user?.role === 'Quản trị viên';\n  const isPowerUser = user?.role === 'Quản trị viên' || user?.role === 'Kế toán';";
if (!content.includes('const isPowerUser')) {
    content = content.replace(isAdminDef, isPowerUserDef);
}

// 3. Update campus filter select to allow isPowerUser to filter
// search for disabled={!isAdmin} in the submissions tab header
const campusFilterSearch = /<select disabled={!isAdmin} className={`bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-medium outline-none \${!isAdmin \? 'opacity-50 cursor-not-allowed' : ''}`}/g;
const campusFilterReplace = `<select disabled={!isPowerUser} className={\`bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-medium outline-none \${!isPowerUser ? 'opacity-50 cursor-not-allowed' : ''}\`}`;
content = content.replace(campusFilterSearch, campusFilterReplace);

// 4. Update uniqueFilterCampuses to use campusConfigs for better sync
// search for uniqueFilterCampuses definition
const ufcSearch = /const uniqueFilterCampuses = Array\.from\(new Set\(tuitionConfigs\.map\(c => c\.campus\)\)\)\.filter\(Boolean\)\.sort\(\);/g;
const ufcReplace = "const uniqueFilterCampuses = campusConfigs.map(c => c.name);";
content = content.replace(ufcSearch, ufcReplace);

// 5. Update uniqueFilterLevels and uniqueFilterMajors if needed?
// Let's use educationLevelConfigs for uniqueFilterLevels
const uflSearch = /const uniqueFilterLevels = Array\.from\(new Set\(tuitionConfigs\.map\(c => c\.educationLevel\)\)\)\.filter\(Boolean\)\.sort\(\);/g;
const uflReplace = "const uniqueFilterLevels = educationLevelConfigs.map(l => l.name);";
content = content.replace(uflSearch, uflReplace);

// 6. Fix handleTabChange to allow Accountant to access registration management
// search for if (user?.role === 'Kế toán' && tab !== 'tuition') {
const tabChangeSearch = /if \(user\?\.role === 'Kế toán' && tab !== 'tuition'\) \{/g;
const tabChangeReplace = "if (user?.role === 'Kế toán' && tab !== 'tuition' && tab !== 'submissions') {";
content = content.replace(tabChangeSearch, tabChangeReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Synchronized campus names and updated role permissions.');
