const fs = require('fs');
const path = 'd:/Github/tuyensinh/fontend/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startTag = '  const handleExportExcel = async () => {';
// The end matches the end of the try-catch block usually.
// I'll try to find the whole function block.

const newFunction = `  const handleExportExcel = async () => {
    if (totalCount === 0) return alert('Không có dữ liệu!');
    setIsLoading(true);

    try {
      const response = await api.fetchAllRegistrations({
        page: 1,
        pageSize: 10000,
        searchTerm,
        campus: filterCampus,
        level: filterLevel,
        major: filterMajor
      });

      const allData = response.data.map((r: any) => ({
        ...r,
        id: r.idNumber,
        campus: r.campus?.name || r.campus,
        educationLevel: r.educationLevel?.name || r.educationLevel
      })).filter((s: any) => {
        if (user?.role !== 'Quản trị viên' && user?.role !== 'Kế toán') {
          if (!user?.campus || s.campus !== user.campus) return false;
        }
        return true;
      });

      const headers = [
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
        ...SUBJECTS.map(s => \`Điểm \${s}\`),
        'Điểm trung bình'
      ];

      const rows = allData.map((s: any, idx: number) => {
        const grades = s.grades || {};
        const sum = SUBJECTS.reduce((acc, sub) => acc + (parseFloat(grades[sub]) || 0), 0);
        const avg = (sum / SUBJECTS.length).toFixed(2);

        return [
          idx + 1,
          formatDateValue(s.submissionDate),
          s.status,
          s.fullName,
          s.gender,
          formatDateValue(s.dob),
          s.pob,
          s.ethnicity,
          \`'\${s.idNumber}\`,
          formatDateValue(s.issueDate),
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
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([
        [\`TỔNG SỐ HỒ SƠ TỔNG HỢP TRÊN HỆ THỐNG: \${allData.length}\`],
        [],
        headers,
        ...rows
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachTuyenSinh");
      XLSX.writeFile(wb, \`Danh_sach_tuyen_sinh_toan_he_thong_\${Date.now()}.xlsx\`);
    } catch (error) {
      console.error("Lỗi xuất excel:", error);
      alert("Đã xảy ra lỗi khi tải dữ liệu xuất Excel.");
    } finally {
      setIsLoading(false);
    }
  };`;

// Regex to find from the start of the function to the end of the finally block or similar
const functionRegex = /const handleExportExcel = async \(\) => \{[\s\S]+?setIsLoading\(false\);[\s\S]+?\};/;
if (functionRegex.test(content)) {
    content = content.replace(functionRegex, newFunction);
    console.log('Fixed handleExportExcel successfully.');
} else {
    console.error('Could not find the broken function to fix.');
}

fs.writeFileSync(path, content, 'utf8');
