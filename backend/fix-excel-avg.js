const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update headers
const oldHeaders = `      const headers = [
        'STT', 'Ngày đăng ký', 'Trạng thái',
        'Họ và tên', 'Giới tính', 'Ngày sinh', 'Nơi sinh', 'Dân tộc',
        'Số CCCD', 'Ngày cấp', 'Nơi cấp',
        'Số điện thoại', 'Email',
        'Địa chỉ chi tiết', 'Xã/Phường/Thị trấn', 'Tỉnh/Thành phố',
        'Họ tên phụ huynh', 'SĐT phụ huynh',
        'Cơ sở đăng ký', 'Hệ đào tạo',
        'Nguyện vọng 1', 'Mã nghề NV1',
        'Nguyện vọng 2', 'Mã nghề NV2',
        'Trường THPT/TC/CĐ', 'Năm tốt nghiệp', 'Xếp loại tốt nghiệp',
        'Người nhận giấy báo', 'Địa chỉ nhận giấy báo', 'Chi tiết nới nhận'
      ];`;

const newHeaders = `      const headers = [
        'STT', 'Ngày đăng ký', 'Trạng thái',
        'Họ và tên', 'Giới tính', 'Ngày sinh', 'Nơi sinh', 'Dân tộc',
        'Số CCCD', 'Ngày cấp', 'Nơi cấp',
        'Số điện thoại', 'Email',
        'Địa chỉ chi tiết', 'Xã/Phường/Thị trấn', 'Tỉnh/Thành phố',
        'Họ tên phụ huynh', 'SĐT phụ huynh',
        'Cơ sở đăng ký', 'Hệ đào tạo',
        'Nguyện vọng 1', 'Mã nghề NV1',
        'Nguyện vọng 2', 'Mã nghề NV2',
        'Trường THPT/TC/CĐ', 'Năm tốt nghiệp', 'Xếp loại tốt nghiệp',
        'Người nhận giấy báo', 'Địa chỉ nhận giấy báo', 'Chi tiết nới nhận',
        'Điểm trung bình'
      ];`;

// 2. Update rows
const oldRows = `      const rows = allData.map((s: any, idx: number) => [
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
        s.deliveryAddressDetails
      ]);`;

const newRows = `      const rows = allData.map((s: any, idx: number) => {
        const grades = s.grades || {};
        const sum = SUBJECTS.reduce((acc, sub) => acc + (parseFloat(grades[sub]) || 0), 0);
        const avg = (sum / SUBJECTS.length).toFixed(2);

        return [
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
          avg
        ];
      });`;

// Simple string replace might fail if there are minor diffs. Let's use something more robust.
// But the strings I copied from view_file should be exact.
if (content.indexOf(oldHeaders) !== -1) {
    console.log('Found headers');
    content = content.replace(oldHeaders, newHeaders);
} else {
    console.warn('Could not find oldHeaders');
}

if (content.indexOf(oldRows) !== -1) {
    console.log('Found rows');
    content = content.replace(oldRows, newRows);
} else {
    console.warn('Could not find oldRows');
}

fs.writeFileSync(path, content, 'utf8');
console.log('File updated');
