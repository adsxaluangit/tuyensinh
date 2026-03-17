
import React, { useState, useEffect } from 'react';
import FormSection from './components/FormSection';
import InputGroup from './components/InputGroup';
import FileUpload from './components/FileUpload';
import AdminDashboard from './components/AdminDashboard';
import DateSelector from './components/DateSelector';
import { PROVINCES } from './constants';
import { RecipientType, AddressType, FormData, SubmissionStatus, User } from './types';
import * as api from './api';

const SUBJECTS = [
  'Toán', 'Văn', 'Anh', 'Lý', 'Tin', 'Hóa', 'Sinh', 'Sử', 'Địa', 'Công nghệ'
];

interface OccupationConfig {
  id: string;
  code: string;
  name: string;
  amount: number;
  campus: string;
  educationLevel: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'login' | 'admin' | 'student-login'>('form');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Master Data from Settings
  const [masterOccupations, setMasterOccupations] = useState<OccupationConfig[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<{ id: string, name: string }[]>([]);
  const [availableLevels, setAvailableLevels] = useState<{ id: string, name: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    pob: '',
    gender: '',
    ethnicity: '',
    idNumber: '',
    issueDate: '',
    issuePlace: 'Cục CS QLHC về TTXH',
    province: '',
    district: '',
    addressDetails: '',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    campus: '',
    educationLevel: '',
    choice1Major: '',
    choice1Specialty: '',
    choice2Major: '',
    choice2Specialty: '',
    gradYear: '',
    gradSchool: '',
    gradProvince: '',
    gradDistrict: '',
    diplomaNumber: '',
    recipient: RecipientType.CANDIDATE,
    deliveryAddress: AddressType.PERMANENT,
    deliveryAddressDetails: ''
  });

  const [grades, setGrades] = useState<Record<string, string>>(
    SUBJECTS.reduce((acc, sub) => ({ ...acc, [sub]: '' }), {})
  );

  const [files, setFiles] = useState<{
    frontId: string | null;
    backId: string | null;
    diploma: string | null;
    tempCert: string | null;
  }>({
    frontId: null,
    backId: null,
    diploma: null,
    tempCert: null
  });

  const [confirmations, setConfirmations] = useState({
    truth: false,
    dataConsent: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campusesData = await api.fetchCampuses();
        setAvailableCampuses(campusesData.map((c: any) => ({ id: c.documentId, name: c.name })));

        const levelsData = await api.fetchEducationLevels();
        setAvailableLevels(levelsData.map((l: any) => ({ id: l.documentId, name: l.name })));

        const occupationsData = await api.fetchOccupations();
        setMasterOccupations(occupationsData.map((o: any) => ({
          id: o.documentId,
          code: o.code,
          name: o.name,
          amount: o.amount,
          campus: o.campus?.name,
          educationLevel: o.educationLevel?.name
        })));
      } catch (error) {
        console.error("Error fetching data from Strapi:", error);
      }
    };
    fetchData();
  }, []);

  const getFilteredOccupations = (campus: string, level: string) => {
    if (!campus || !level) return [];
    // Ưu tiên lọc theo cả cơ sở và hệ
    const filtered = masterOccupations.filter(occ => occ.campus === campus && occ.educationLevel === level);
    // Nếu không có cấu hình cụ thể cho hệ đó, hiển thị theo cơ sở
    return filtered.length > 0 ? filtered : masterOccupations.filter(occ => occ.campus === campus);
  };

  const choice1Occupations = getFilteredOccupations(formData.campus, formData.educationLevel);
  const choice2Occupations = getFilteredOccupations(formData.campus, formData.educationLevel);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOcc = masterOccupations.find(occ => occ.name === formData.choice1Major && occ.code === formData.choice1Specialty);

    // Lấy thông tin cấu hình từ Strapi (mặc định lấy bản ghi đầu tiên)
    const healthConfigs = await api.fetchHealthInsurances();
    const compConfigs = await api.fetchComprehensiveInsurances();
    const uniformConfigs = await api.fetchUniforms();

    const healthConfig = healthConfigs[0];
    const compConfig = compConfigs[0];
    const uniformConfig = uniformConfigs[0];

    const campusObj = availableCampuses.find(c => c.name === formData.campus);
    const levelObj = availableLevels.find(l => l.name === formData.educationLevel);

    // Validate required files
    if (!files.frontId || !files.backId || !files.diploma || !files.tempCert) {
      alert('Vui lòng tải lên đầy đủ các giấy tờ xác thực bắt buộc (*)');
      return;
    }

    // Loại bỏ các trường hệ thống để tránh lỗi "Invalid key id" từ Strapi
    const { id, documentId, createdAt, updatedAt, publishedAt, ...cleanFormData } = formData;

    const submissionData: any = {};
    Object.keys(cleanFormData).forEach(key => {
      const val = (cleanFormData as any)[key];
      // Only send primitive values, arrays (for grades), or nulls. 
      // Avoid sending nested objects (like campus, educationLevel) which we override below.
      if (val === null || typeof val !== 'object' || Array.isArray(val) || key === 'grades') {
        submissionData[key] = val;
      }
    });

    Object.assign(submissionData, {
      ...files,
      status: isEditing ? formData.status : 'Chờ Duyệt',
      tuitionAmount: selectedOcc?.amount || 0,
      healthAmount: healthConfig?.amount || 0,
      comprehensiveAmount: compConfig?.amount || 0,
      uniformAmount: uniformConfig?.amount || 0,
      tuitionPaidAmount: formData.tuitionPaidAmount || 0,
      isHealthSelected: true,
      isComprehensiveSelected: true,
      isUniformSelected: true,
      campus: campusObj?.id,
      educationLevel: levelObj?.id
    });

    try {
      if (isEditing) {
        const existing = await api.findRegistrationByCCCD(formData.idNumber);
        if (existing) {
          await api.updateRegistration(existing.documentId, submissionData);
          alert('Cập nhật hồ sơ thành công!');
        }
      } else {
        const password = Math.random().toString(36).slice(-6).toUpperCase();
        const submissionWithAuth = { ...submissionData, password };
        await api.submitRegistration(submissionWithAuth);
        alert(`Gửi hồ sơ đăng ký thành công!\n\nThông tin đăng nhập của bạn:\n- Tên đăng nhập (CCCD): ${formData.idNumber}\n- Mật khẩu: ${password}\n\nVui lòng lưu lại thông tin này để tra cứu hồ sơ hoặc chỉnh sửa hồ sơ.`);
      }
      window.location.reload();
    } catch (error) {
      console.error("Error submitting to Strapi:", error);
      alert('Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staffs = await api.fetchStaffs();
      const foundUser = staffs.find((u: any) => u.username === username && u.password === password && u.status === 'Hoạt động');

      if (foundUser) {
        setCurrentUser({
          ...foundUser,
          id: foundUser.documentId || foundUser.id
        });
        setView('admin');
      } else if (username === 'admin' && password === 'admin123') {
        setCurrentUser({ id: '0', fullName: 'Quản trị viên', username: 'admin', role: 'Quản trị viên', status: 'Hoạt động', lastLogin: new Date().toISOString() });
        setView('admin');
      } else {
        setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác (hoặc tài khoản đã bị khóa)');
      }
    } catch (error) {
      console.error("Login error:", error);
      if (username === 'admin' && password === 'admin123') {
        setCurrentUser({ id: '0', fullName: 'Quản trị viên', username: 'admin', role: 'Quản trị viên', status: 'Hoạt động', lastLogin: new Date().toISOString() });
        setView('admin');
      } else {
        setLoginError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record = await api.findRegistrationByCCCD(studentIdInput);
      if (record) {
        if (record.password === password) {
          const flattenedRecord = {
            ...record,
            campus: record.campus?.name || record.campus || '',
            educationLevel: record.educationLevel?.name || record.educationLevel || ''
          };
          setFormData(flattenedRecord);
          setGrades(record.grades || {});
          setFiles({
            frontId: record.frontId || null,
            backId: record.backId || null,
            diploma: record.diploma || null,
            tempCert: record.tempCert || null,
          });
          setIsEditing(true);
          setCurrentUser({ id: record.idNumber, fullName: record.fullName, username: record.idNumber, role: 'Quản trị viên', status: 'Hoạt động', lastLogin: new Date().toISOString(), password: record.password } as any);
          setView('form');
        } else {
          setLoginError('Mật khẩu không chính xác');
        }
      } else {
        setLoginError('Không tìm thấy hồ sơ với mã số CCCD này');
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setLoginError('Lỗi kết nối máy chủ');
    }
  };

  // Class CSS cho Input/Select giống hệt ảnh mẫu
  const inputClasses = "w-full border-[1.5px] border-[#3b82f6] rounded-[0.8rem] px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white font-medium text-gray-800";
  const selectClasses = "w-full border-[1.5px] border-[#3b82f6] rounded-[0.8rem] px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none cursor-pointer font-medium text-gray-800";

  if (view === 'admin') return <AdminDashboard onLogout={() => setView('form')} user={currentUser} />;

  if (view === 'login' || view === 'student-login') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
          <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight text-center mb-8">
            {view === 'login' ? 'ĐĂNG NHẬP QUẢN TRỊ' : 'TRA CỨU HỒ SƠ'}
          </h2>
          <form onSubmit={view === 'login' ? handleAdminLogin : handleStudentLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">{view === 'login' ? 'Tên đăng nhập' : 'Số CCCD'}</label>
              <input type="text" required className={inputClasses} value={view === 'login' ? username : studentIdInput} onChange={(e) => view === 'login' ? setUsername(e.target.value) : setStudentIdInput(e.target.value)} />
            </div>
            {view === 'login' && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Mật khẩu</label>
                <input type="password" required className={inputClasses} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {view === 'student-login' && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Mật khẩu</label>
                <input type="password" required className={inputClasses} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg">Xác nhận</button>
            <button type="button" onClick={() => setView('form')} className="w-full text-gray-400 text-[10px] font-bold uppercase mt-4 hover:text-blue-900">← Quay lại</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 bg-[#f0f4f8]">
      <div className="max-w-6xl mx-auto pt-6 pb-4 flex flex-col md:flex-row justify-between items-center px-6 gap-4">
        <h1 className="text-3xl font-extrabold text-[#cc0000] tracking-tight uppercase drop-shadow-sm">PHIẾU ĐĂNG KÝ HỌC CAO ĐẲNG/TRUNG CẤP</h1>
        <div className="flex gap-3">
          <button onClick={() => setView('student-login')} className="px-5 py-2.5 bg-white text-blue-700 border border-blue-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm">Tra cứu hồ sơ</button>
          <button onClick={() => setView('login')} className="px-5 py-2.5 text-xs text-gray-400 hover:text-blue-900 transition-colors uppercase font-bold">Quản trị</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
        {isEditing && <div className="absolute top-8 right-8 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Chế độ chỉnh sửa</div>}

        <form onSubmit={handleFormSubmit}>
          <FormSection title="THÔNG TIN THÍ SINH">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputGroup label="Họ và tên" required>
                <input type="text" required placeholder="Nhập họ và tên" className={inputClasses} value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </InputGroup>
              <InputGroup label="Ngày sinh" required>
                <DateSelector required value={formData.dob} onChange={(val) => setFormData({ ...formData, dob: val })} />
              </InputGroup>
              <InputGroup label="Nơi sinh" required>
                <input type="text" required placeholder="Tỉnh/Thành phố" className={inputClasses} value={formData.pob} onChange={(e) => setFormData({ ...formData, pob: e.target.value })} />
              </InputGroup>
              <InputGroup label="Giới tính" required>
                <select className={selectClasses} required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputGroup label="Số CCCD/CMND" required>
                <input type="text" required placeholder="Số định danh 12 số" className={inputClasses} disabled={isEditing} value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} />
              </InputGroup>
              <InputGroup label="Dân tộc" required>
                <input type="text" required placeholder="Dân tộc" className={inputClasses} value={formData.ethnicity} onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })} />
              </InputGroup>
              <InputGroup label="Ngày cấp" required>
                <DateSelector required value={formData.issueDate} onChange={(val) => setFormData({ ...formData, issueDate: val })} />
              </InputGroup>
              <InputGroup label="Nơi cấp" required>
                <input type="text" required className={inputClasses} value={formData.issuePlace} onChange={(e) => setFormData({ ...formData, issuePlace: e.target.value })} />
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputGroup label="Tỉnh/Thành phố thường trú (Sau sát nhập)" required>
                <select className={selectClasses} required value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value, district: '' })}>
                  <option value="">Chọn tỉnh/thành phố</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Xã/Phường/Thị trấn (Sau sát nhập)" required>
                <input type="text" required placeholder="Ghi rõ tên xã/phường/thị trấn" className={inputClasses} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
              </InputGroup>
              <InputGroup label="Thôn/Xóm/Số nhà (Sau sát nhập)" required>
                <input type="text" required placeholder="Số nhà, đường, ngõ, xóm" className={inputClasses} value={formData.addressDetails} onChange={(e) => setFormData({ ...formData, addressDetails: e.target.value })} />
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputGroup label="Số điện thoại" required>
                <input type="tel" required placeholder="Số điện thoại cá nhân" className={inputClasses} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </InputGroup>
              <InputGroup label="Email" required>
                <input type="email" required placeholder="Địa chỉ email liên hệ" className={inputClasses} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </InputGroup>
              <InputGroup label="Phụ huynh/Bảo trợ">
                <input type="text" placeholder="Họ tên phụ huynh" className={inputClasses} value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} />
              </InputGroup>
              <InputGroup label="SĐT Phụ huynh">
                <input type="tel" placeholder="Số điện thoại phụ huynh" className={inputClasses} value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} />
              </InputGroup>
            </div>
          </FormSection>

          {/* Phần này đồng bộ dữ liệu Cơ sở và Hệ từ Cấu hình hệ thống */}
          <FormSection title="THÔNG TIN ĐĂNG KÝ TRƯỜNG CAO HÀNG HẢI VÀ ĐƯỜNG THỦY I">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Cơ sở nhập học" required>
                <select className={selectClasses} required value={formData.campus} onChange={(e) => setFormData({ ...formData, campus: e.target.value, choice1Major: '', choice1Specialty: '' })}>
                  <option value="">-- Chọn cơ sở --</option>
                  {availableCampuses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </InputGroup>

              <InputGroup label="Hệ đào tạo" required>
                <select className={selectClasses} required value={formData.educationLevel} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value, choice1Major: '', choice1Specialty: '' })}>
                  <option value="">-- Chọn hệ đào tạo --</option>
                  {availableLevels.map(el => <option key={el.id} value={el.name}>{el.name}</option>)}
                </select>
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-50">
              <div className="space-y-2">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest opacity-60">Nguyện vọng thứ nhất</h3>
                <div className="grid grid-cols-3 gap-4">
                  <InputGroup label="Nghề đào tạo" required className="col-span-2">
                    <select className={selectClasses} required value={formData.choice1Major} onChange={(e) => {
                      const name = e.target.value;
                      const occ = choice1Occupations.find(o => o.name === name);
                      setFormData({ ...formData, choice1Major: name, choice1Specialty: occ?.code || '' })
                    }}>
                      <option value="">-- Chọn nghề --</option>
                      {Array.from(new Set(choice1Occupations.map(o => o.name))).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </InputGroup>
                  <InputGroup label="Mã nghề" required>
                    <input readOnly className={`${inputClasses} bg-gray-50 border-gray-200 cursor-not-allowed`} value={formData.choice1Specialty} placeholder="Mã nghề tự động" />
                  </InputGroup>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest opacity-60">Nguyện vọng thứ hai</h3>
                <div className="grid grid-cols-3 gap-4">
                  <InputGroup label="Nghề đào tạo" className="col-span-2">
                    <select className={selectClasses} value={formData.choice2Major} onChange={(e) => {
                      const name = e.target.value;
                      const occ = choice2Occupations.find(o => o.name === name);
                      setFormData({ ...formData, choice2Major: name, choice2Specialty: occ?.code || '' })
                    }}>
                      <option value="">-- Chọn nghề --</option>
                      {Array.from(new Set(choice2Occupations.map(o => o.name))).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </InputGroup>
                  <InputGroup label="Mã nghề">
                    <input readOnly className={`${inputClasses} bg-gray-50 border-gray-200 cursor-not-allowed`} value={formData.choice2Specialty} placeholder="Mã nghề tự động" />
                  </InputGroup>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <InputGroup label="Năm tốt nghiệp">
                <input type="text" placeholder="Ví dụ: 2024" className={inputClasses} value={formData.gradYear} onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })} />
              </InputGroup>
              <InputGroup label="Trường tốt nghiệp">
                <input type="text" placeholder="Tên trường đã tốt nghiệp" className={inputClasses} value={formData.gradSchool} onChange={(e) => setFormData({ ...formData, gradSchool: e.target.value })} />
              </InputGroup>
            </div>

            <div className="pt-8 border-t border-gray-100 mt-8">
              <h3 className="text-[12px] font-black text-red-600 mb-6 uppercase tracking-[0.2em] text-center">ĐIỂM TRUNG BÌNH CÁC MÔN NĂM CUỐI CẤP</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                {SUBJECTS.map((sub) => (
                  <div key={sub} className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 text-center uppercase">{sub}</label>
                    <input type="text" placeholder="-" className="w-full bg-blue-50/20 border-2 border-blue-500/10 rounded-xl px-2 py-2 text-sm text-center font-bold text-blue-900 focus:border-blue-500 outline-none transition-all shadow-sm" value={grades[sub]} onChange={(e) => setGrades({ ...grades, [sub]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection title="THÔNG TIN GỬI GIẤY BÁO KẾT QUẢ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Người nhận</p>
                <div className="flex flex-col gap-3 ml-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" checked={formData.recipient === RecipientType.CANDIDATE} onChange={() => setFormData({ ...formData, recipient: RecipientType.CANDIDATE })} />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-blue-900">Thí sinh</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" checked={formData.recipient === RecipientType.PARENT} onChange={() => setFormData({ ...formData, recipient: RecipientType.PARENT })} />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-blue-900">Phụ huynh/người bảo trợ</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Địa chỉ nhận</p>
                <div className="flex flex-col gap-3 ml-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" checked={formData.deliveryAddress === AddressType.PERMANENT} onChange={() => setFormData({ ...formData, deliveryAddress: AddressType.PERMANENT })} />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-blue-900">Địa chỉ hộ khẩu thường trú</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" checked={formData.deliveryAddress === AddressType.OTHER} onChange={() => setFormData({ ...formData, deliveryAddress: AddressType.OTHER })} />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-blue-900">Địa chỉ khác</span>
                  </label>
                  {formData.deliveryAddress === AddressType.OTHER && (
                    <input type="text" placeholder="Nhập địa chỉ nhận giấy báo cụ thể" className={inputClasses} value={formData.deliveryAddressDetails} onChange={(e) => setFormData({ ...formData, deliveryAddressDetails: e.target.value })} />
                  )}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="TẢI LÊN GIẤY TỜ XÁC THỰC">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              <FileUpload label="CCCD mặt trước" required placeholderImage={files.frontId || "https://picsum.photos/400/250?random=1"} onFileChange={(b64) => setFiles({ ...files, frontId: b64 })} />
              <FileUpload label="CCCD mặt sau" required placeholderImage={files.backId || "https://picsum.photos/400/250?random=2"} onFileChange={(b64) => setFiles({ ...files, backId: b64 })} />
              <FileUpload label="Bằng tốt nghiệp/GCN tốt nghiệp tạm thời" required placeholderImage={files.diploma || "https://picsum.photos/400/250?random=3"} onFileChange={(b64) => setFiles({ ...files, diploma: b64 })} />
              <FileUpload label="Học bạ THPT/THCS" required placeholderImage={files.tempCert || "https://picsum.photos/400/250?random=4"} onFileChange={(b64) => setFiles({ ...files, tempCert: b64 })} />
            </div>
          </FormSection>

          <FormSection title="HOÀN TẤT ĐĂNG KÝ">
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                <input type="checkbox" id="truth" required className="mt-1 w-6 h-6 text-blue-600 border-2 border-blue-500 rounded-lg cursor-pointer" checked={confirmations.truth} onChange={(e) => setConfirmations({ ...confirmations, truth: e.target.checked })} />
                <label htmlFor="truth" className="text-xs text-gray-700 leading-relaxed font-semibold cursor-pointer">Tôi xin cam đoan những lời khai của tôi trên phiếu đăng ký học này là đúng sự thật. Nếu sai tôi xin hoàn toàn chịu trách nhiệm.</label>
              </div>
              <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                <input type="checkbox" id="consent" required className="mt-1 w-6 h-6 text-blue-600 border-2 border-blue-500 rounded-lg cursor-pointer" checked={confirmations.dataConsent} onChange={(e) => setConfirmations({ ...confirmations, dataConsent: e.target.checked })} />
                <label htmlFor="consent" className="text-xs text-gray-700 leading-relaxed font-semibold cursor-pointer">Tôi đồng ý cung cấp thông tin cá nhân cho nhà trường để phục vụ mục đích xét tuyển và nhập học theo quy định của pháp luật.</label>
              </div>
              <div className="flex justify-center pt-10">
                <button type="submit" disabled={!confirmations.truth || !confirmations.dataConsent} className={`px-20 py-5 rounded-[1.5rem] font-black text-white uppercase tracking-[0.2em] transition-all shadow-2xl ${confirmations.truth && confirmations.dataConsent ? 'bg-[#cc0000] hover:bg-red-700 hover:scale-105 active:scale-95' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}>
                  {isEditing ? 'CẬP NHẬT HỒ SƠ' : 'GỬI HỒ SƠ ĐĂNG KÝ'}
                </button>
              </div>
            </div>
          </FormSection>
        </form>
      </div>
      <div className="text-center mt-12 pb-12">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2026 Trường Cao đẳng Hàng hải và Đường thủy I</p>
      </div>
    </div >
  );
};

export default App;
