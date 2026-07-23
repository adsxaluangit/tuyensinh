const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function exportStudents() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5435,
        database: 'tuyensinh_db',
        user: 'tuyensinh',
        password: 'tuyensinh_password',
    });

    try {
        await client.connect();
        
        const query = `
            SELECT 
                r.id_number,
                r.full_name,
                r.dob,
                r.phone,
                r.email,
                r.gender,
                r.pob,
                c.name as campus_name,
                el.name as education_level_name,
                r.choice_1_major,
                r.choice_1_specialty,
                r.status,
                r.tuition_status,
                r.tuition_paid_amount,
                r.created_at
            FROM registrations r
            LEFT JOIN registrations_campus_lnk rc ON r.id = rc.registration_id
            LEFT JOIN campuses c ON rc.campus_id = c.id
            LEFT JOIN registrations_education_level_lnk rel ON r.id = rel.registration_id
            LEFT JOIN education_levels el ON rel.education_level_id = el.id
            ORDER BY r.created_at DESC
        `;
        
        const res = await client.query(query);
        const students = res.rows;

        const data = students.map(student => ({
            'Số CCCD': student.id_number || '',
            'Họ và tên': student.full_name || '',
            'Ngày sinh': student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '',
            'Điện thoại': student.phone || '',
            'Email': student.email || '',
            'Giới tính': student.gender || '',
            'Nơi sinh': student.pob || '',
            'Cơ sở đào tạo': student.campus_name || '',
            'Hệ đào tạo': student.education_level_name || '',
            'Ngành học NV1': student.choice_1_major || '',
            'Mã ngành NV1': student.choice_1_specialty || '',
            'Trạng thái hồ sơ': student.status || '',
            'Học phí': student.tuition_status || '',
            'Số tiền đã nộp': Number(student.tuition_paid_amount) || 0,
            'Ngày đăng ký': student.created_at ? new Date(student.created_at).toLocaleString('vi-VN') : ''
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0,5).replace(':', '');
        const backupDir = 'D:\\Github\\tuyensinh\\backup-files';
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const filePath = path.join(backupDir, `DS_HocSinh_${dateStr}_${timeStr}.xlsx`);
        
        xlsx.writeFile(wb, filePath);
        console.log(`Đã xuất thành công ${students.length} học sinh ra file: ${filePath}`);
    } catch (err) {
        console.error('Lỗi khi xuất dữ liệu:', err);
    } finally {
        await client.end();
    }
}

exportStudents();
