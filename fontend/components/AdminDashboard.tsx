
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FormData, RecipientType, AddressType, SubmissionStatus, User, TuitionStatus } from '../types';
import { CAMPUSES, MAJORS, SPECIALTIES, EDUCATION_LEVELS, PROVINCES } from '../constants';
import * as api from '../api';

const SUBJECTS = [
  'Toán', 'Văn', 'Anh', 'Lý', 'Tin', 'Hóa', 'Sinh', 'Sử', 'Địa', 'Công nghệ'
];

interface OccupationTuition {
  id: string;
  code: string;
  name: string;
  amount: number;
  campus: string;
  educationLevel: string;
}

interface HealthInsuranceConfig {
  id: string;
  code: string;
  amount: number;
  description: string;
}

interface ComprehensiveInsuranceConfig {
  id: string;
  code: string;
  amount: number;
  description: string;
}

interface UniformConfig {
  id: string;
  code: string;
  amount: number;
  description: string;
}

interface CampusConfig {
  id: string;
  code: string;
  name: string;
  address: string;
}

interface EducationLevelConfig {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface AdmissionTemplate {
  campus: string;
  title: string;
  basis: string;
  announcer: string;
  location: string;
  requirements: string[];
  hotline: string;
  website: string;
  footerTitle: string;
  footerName: string;
  admissionHour: string;
  admissionDay: string;
  admissionMonth: string;
  admissionYear: string;
  qrCodeImage: string | null;
}

const STATUS_PRIORITY: Record<SubmissionStatus, number> = {
  [SubmissionStatus.PENDING]: 1,
  [SubmissionStatus.RECEIVED]: 2,
  [SubmissionStatus.APPROVED]: 3,
  [SubmissionStatus.LOCKED]: 4
};

interface AdminDashboardProps {
  onLogout: () => void;
  user: User | null;
}

const HorizontalMenuButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-xs whitespace-nowrap border shrink-0 ${active ? 'bg-white text-blue-900 border-white shadow-lg' : 'text-blue-100 hover:text-white hover:bg-white/5 border-transparent'
      }`}
  >
    <div className={`${active ? 'text-blue-600' : 'text-blue-300'}`}>{icon}</div>
    {label}
  </button>
);

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${active ? 'bg-blue-900 text-white shadow-md' : 'text-gray-400 hover:text-blue-900 hover:bg-blue-50'
      }`}
  >
    {label}
  </button>
);

const ActionButton: React.FC<{ label: string; color: string; onClick: () => void }> = ({ label, color, onClick }) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
  };
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 whitespace-nowrap ${colors[color]}`}
    >
      {label}
    </button>
  );
};

const DetailItem = ({ label, value, colSpan = 1, highlight = false }: { label: string, value: string, colSpan?: number, highlight?: boolean }) => (
  <div className={`space-y-1.5 ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{label}</p>
    <p className={`font-bold leading-relaxed ${highlight ? 'text-blue-900 text-base font-black' : 'text-gray-800'}`}>{value || '--'}</p>
  </div>
);

const FilePreviewItem = ({ label, src }: { label: string, src: string | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start gap-4 w-full">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{label}</p>
        <div 
          className="w-full aspect-[4/3] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 overflow-hidden flex items-center justify-center group relative cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all"
          onClick={() => src && setIsOpen(true)}
        >
          {src ? (
            <>
              <img src={src} alt={label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-blue-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] border-2 border-white/40 px-5 py-2.5 rounded-2xl">Xem ảnh</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">Chưa tải lên</span>
            </div>
          )}
        </div>
      </div>

      {isOpen && src && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setIsOpen(false)}
        >
          <img src={src} alt={label} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            title="Đóng (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

const TuitionPaidInput: React.FC<{
  initialValue: number;
  totalRequired: number;
  onUpdate: (paid: number, status: TuitionStatus) => void;
}> = ({ initialValue, totalRequired, onUpdate }) => {
  const [localValue, setLocalValue] = useState(initialValue.toLocaleString('vi-VN'));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(rawValue) || 0;
    setLocalValue(numValue.toLocaleString('vi-VN'));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const status = numValue >= totalRequired ? TuitionStatus.PAID : (numValue > 0 ? TuitionStatus.PARTIAL : TuitionStatus.UNPAID);
      onUpdate(numValue, status);
    }, 1000);
  };

  return (
    <input
      type="text"
      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-right font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
      value={localValue}
      onChange={handleChange}
    />
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'roles' | 'tuition' | 'tuition-config' | 'admission-templates'>(
    user?.role === 'Kế toán' ? 'tuition' : 'submissions'
  );
  const [tuitionPagination, setTuitionPagination] = useState({ page: 1, pageSize: 25 });
  const [tuitionSubTab, setTuitionSubTab] = useState<'campuses' | 'education-levels' | 'majors' | 'health' | 'comprehensive' | 'uniform'>('campuses');
  const [admissionSubTab, setAdmissionSubTab] = useState<'Hải Phòng' | 'Nam Đồng' | 'Đinh Nhu' | 'Thu học phí'>('Hải Phòng');
  const [isLoading, setIsLoading] = useState(false);
  const [isTuitionLoading, setIsTuitionLoading] = useState(false);

  const [submissions, setSubmissions] = useState<FormData[]>([]);
  const [tuitionSubmissions, setTuitionSubmissions] = useState<FormData[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [tuitionConfigs, setTuitionConfigs] = useState<OccupationTuition[]>([]);
  const [healthConfigs, setHealthConfigs] = useState<HealthInsuranceConfig[]>([]);
  const [comprehensiveConfigs, setComprehensiveConfigs] = useState<ComprehensiveInsuranceConfig[]>([]);
  const [uniformConfigs, setUniformConfigs] = useState<UniformConfig[]>([]);
  const [campusConfigs, setCampusConfigs] = useState<CampusConfig[]>([]);
  const [educationLevelConfigs, setEducationLevelConfigs] = useState<EducationLevelConfig[]>([]);

  const defaultRequirements = [
    "Giấy triệu tập trúng tuyển (02 bản photo);",
    "Học bạ THPT (02 bản photo có công chứng);",
    "Bằng tốt nghiệp THPT hoặc Giấy chứng nhận tốt nghiệp THPT tạm thời (02 bản photo có công chứng);",
    "Căn cước điện tử (02 bản chụp màn hình phần căn cước điện tử từ app VneID);",
    "Giấy giới thiệu di chuyển nghĩa vụ quân sự (đối với Nam sinh viên);",
    "Các giấy tờ xác nhận đối tượng ưu tiên (nếu có);"
  ];

  const hpDefaultBasis = 'Căn cứ Quy chế tuyển sinh trình độ Cao đẳng, Trung cấp và Kết quả xét tuyển trình độ Cao đẳng của Trường Cao đẳng Hàng hải và Đường thủy I.';
  const hpDefaultAnnouncer = 'HIÊU TRƯỞNG TRƯỜNG CAO ĐẲNG HÀNG HẢI VÀ ĐƯỜNG THỦY I';
  const hpDefaultHotline = '0981.344.488- 0987.493.486';
  const hpDefaultWebsite = 'cdhh.edu.vn/ mic1.edu.vn';
  const hpDefaultFooterTitle = 'KT.HIÊU TRƯỞNG\nPHÓ HIỆU TRƯỞNG';
  const hpDefaultFooterName = 'Đỗ Hồng Hải';

  const [admissionTemplates, setAdmissionTemplates] = useState<Record<string, AdmissionTemplate>>({
    'Hải Phòng': {
      campus: 'Hải Phòng',
      title: 'GIẤY TRIỆU TẬP TRÚNG TUYỂN',
      basis: hpDefaultBasis,
      announcer: hpDefaultAnnouncer,
      location: 'Khu B; Trường Cao đẳng Hàng hải và Đường thủy I, số 425 Phương Khê, đường Trường Chinh, phường Kiến An, TP Hải Phòng.',
      requirements: [...defaultRequirements],
      hotline: hpDefaultHotline,
      website: hpDefaultWebsite,
      footerTitle: hpDefaultFooterTitle,
      footerName: hpDefaultFooterName,
      admissionHour: '08', admissionDay: '15', admissionMonth: '09', admissionYear: '2024',
      qrCodeImage: null
    },
    'Nam Đồng': {
      campus: 'Nam Đồng',
      title: 'GIẤY TRIỆU TẬP TRÚNG TUYỂN',
      basis: hpDefaultBasis,
      announcer: hpDefaultAnnouncer,
      location: 'Cơ sở Nam Đồng; Trường Cao đẳng Hàng hải và Đường thủy I, xã Nam Đồng, TP Hải Dương, tỉnh Hải Dương.',
      requirements: [...defaultRequirements],
      hotline: hpDefaultHotline,
      website: hpDefaultWebsite,
      footerTitle: hpDefaultFooterTitle,
      footerName: hpDefaultFooterName,
      admissionHour: '08', admissionDay: '16', admissionMonth: '09', admissionYear: '2024',
      qrCodeImage: null
    },
    'Đinh Nhu': {
      campus: 'Đinh Nhu',
      title: 'GIẤY TRIỆU TẬP TRÚNG TUYỂN',
      basis: hpDefaultBasis,
      announcer: hpDefaultAnnouncer,
      location: 'Cơ sở Đinh Nhu; Trường Cao đẳng Hàng hải và Đường thủy I, phường Đinh Nhu, TP Hải Phòng.',
      requirements: [...defaultRequirements],
      hotline: hpDefaultHotline,
      website: hpDefaultWebsite,
      footerTitle: hpDefaultFooterTitle,
      footerName: hpDefaultFooterName,
      admissionHour: '08', admissionDay: '17', admissionMonth: '09', admissionYear: '2024',
      qrCodeImage: null
    },
    'Thu học phí': {
      campus: 'Toàn trường',
      title: 'BIÊN LAI THU LỆ PHÍ VÀ HỌC PHÍ',
      basis: 'Năm triệu không trăm hai mươi lăm nghìn đồng chẵn',
      announcer: 'TRƯỜNG CĐ HÀNG HẢI & ĐƯỜNG THỦY I',
      location: '425 Phương Khê, Kiến An, Hải Phòng',
      requirements: [],
      hotline: '0981.344.488',
      website: 'cdhh.edu.vn',
      footerTitle: 'Người thu tiền (Kế toán)',
      footerName: user?.fullName || 'Quản trị viên hệ thống',
      admissionHour: '', admissionDay: '', admissionMonth: '', admissionYear: '',
      qrCodeImage: null
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25 });
  const [totalCount, setTotalCount] = useState(0);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Quản trị viên' | 'Cán bộ tiếp nhận' | 'Cán bộ duyệt hồ sơ' | 'Kế toán'>('Cán bộ tiếp nhận');

  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  const [editingTuition, setEditingTuition] = useState<OccupationTuition | null>(null);

  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [editingHealth, setEditingHealth] = useState<HealthInsuranceConfig | null>(null);

  const [isComprehensiveModalOpen, setIsComprehensiveModalOpen] = useState(false);
  const [editingComprehensive, setEditingComprehensive] = useState<ComprehensiveInsuranceConfig | null>(null);

  const [isUniformModalOpen, setIsUniformModalOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformConfig | null>(null);

  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusConfig | null>(null);

  const [isEducationLevelModalOpen, setIsEducationLevelModalOpen] = useState(false);
  const [editingEducationLevel, setEditingEducationLevel] = useState<EducationLevelConfig | null>(null);

  const handleTabChange = (tab: typeof activeTab) => {
    if ((user?.role === 'Cán bộ tiếp nhận' || user?.role === 'Cán bộ duyệt hồ sơ') && tab !== 'submissions') {
      alert('Bạn không có quyền truy cập chức năng này!');
      return;
    }
    if (user?.role === 'Kế toán' && tab !== 'tuition') {
      alert('Bạn không có quyền truy cập chức năng này!');
      return;
    }
    setActiveTab(tab);
  };

  const fetchData = async () => {
    try {
      const response = await api.fetchAllRegistrations({
        page: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm,
        campus: filterCampus,
        level: filterLevel,
        major: filterMajor
      });
      
      const regData = response.data;
      const meta = response.meta;
      
      setSubmissions(regData.map((r: any) => ({
        ...r,
        id: r.idNumber, // Dùng cho UI
        docId: r.documentId || r.id, // Dùng cho API
        campus: r.campus?.name || r.campus,
        educationLevel: r.educationLevel?.name || r.educationLevel
      })));
      
      if (meta?.pagination) {
        setTotalCount(meta.pagination.total);
      }

      const staffData = await api.fetchStaffs();
      setUsers(staffData.map((s: any) => ({
        ...s,
        id: s.documentId || s.id
      })));

      const campusData = await api.fetchCampuses();
      setCampusConfigs(campusData.map((c: any) => ({
        id: c.documentId || c.id,
        name: c.name || c.attributes?.name,
        code: c.code || c.attributes?.code,
        address: c.address || c.attributes?.address
      })));

      const elData = await api.fetchEducationLevels();
      setEducationLevelConfigs(elData.map((l: any) => ({
        id: l.documentId || l.id,
        name: l.name || l.attributes?.name,
        code: l.code || l.attributes?.code,
        description: l.description || l.attributes?.description
      })));

      const occData = await api.fetchOccupations();
      setTuitionConfigs(occData.map((o: any) => {
        const item = o.attributes || o;
        const campusObj = item.campus?.data?.attributes || item.campus?.attributes || item.campus;
        const levelObj = item.educationLevel?.data?.attributes || item.educationLevel?.attributes || item.educationLevel;

        return {
          id: o.documentId || o.id,
          code: item.code,
          name: item.name,
          amount: (item.amount !== undefined && item.amount !== null) ? item.amount : (item.attributes?.amount || 0),
          campus: campusObj?.name || campusObj,
          educationLevel: levelObj?.name || levelObj
        };
      }));

      const healthData = await api.fetchHealthInsurances();
      setHealthConfigs(healthData.map((h: any) => ({
        id: h.documentId || h.id,
        code: h.code || h.attributes?.code,
        description: h.description || h.attributes?.description,
        amount: (h.amount !== undefined && h.amount !== null) ? h.amount : (h.attributes?.amount || 0)
      })));

      const compData = await api.fetchComprehensiveInsurances();
      setComprehensiveConfigs(compData.map((c: any) => ({
        id: c.documentId || c.id,
        code: c.code || c.attributes?.code,
        description: c.description || c.attributes?.description,
        amount: (c.amount !== undefined && c.amount !== null) ? c.amount : (c.attributes?.amount || 0)
      })));

      const uniformData = await api.fetchUniforms();
      setUniformConfigs(uniformData.map((u: any) => ({
        id: u.documentId || u.id,
        code: u.code || u.attributes?.code,
        description: u.description || u.attributes?.description,
        amount: (u.amount !== undefined && u.amount !== null) ? u.amount : (u.attributes?.amount || 0)
      })));

      const templateData = await api.fetchAdmissionTemplates();
      if (templateData && templateData.length > 0) {
        setAdmissionTemplates(templateData.map((t: any) => ({
          ...t,
          id: t.documentId || t.id
        })));
      }

      const settings = await api.fetchSystemSettings();
      const seqSetting = settings.find((s: any) => s.key === 'global_admission_seq');
      if (seqSetting) localStorage.setItem('global_admission_seq', seqSetting.value);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.pageSize, searchTerm, filterCampus, filterLevel, filterMajor]);

  const fetchTuitionData = async () => {
    setIsTuitionLoading(true);
    try {
      const response = await api.fetchAllApprovedRegistrations();
      const regData = response.data || response;
      setTuitionSubmissions(regData.map((r: any) => ({
        ...r,
        id: r.idNumber,
        docId: r.documentId || r.id,
        campus: r.campus?.name || r.campus,
        educationLevel: r.educationLevel?.name || r.educationLevel
      })));
    } catch (error) {
      console.error("Lỗi khi tải danh sách học phí:", error);
    } finally {
      setIsTuitionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tuition') {
      fetchTuitionData();
    }
  }, [activeTab]);

  const handleViewDetail = async (submission: any) => {
    try {
      // Fetch full record including images
      const response = await api.getRegistrationById(submission.docId);
      const fullData = response.data;
      const flattenedFullData = {
        ...fullData,
        id: fullData.idNumber,
        docId: fullData.documentId || fullData.id,
        campus: fullData.campus?.name || fullData.campus,
        educationLevel: fullData.educationLevel?.name || fullData.educationLevel
      };
      setSelectedSubmission(flattenedFullData);
    } catch (error) {
      console.error("Error fetching detail:", error);
      alert("Không thể tải chi tiết hồ sơ");
    }
  };

  const handleSaveEducationLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const levelData = {
      name: fd.get('name') as string,
      code: fd.get('code') as string,
      description: fd.get('description') as string
    };

    try {
      if (editingEducationLevel) {
        await api.updateEducationLevel(editingEducationLevel.id, levelData);
      } else {
        await api.createEducationLevel(levelData);
      }
      setIsEducationLevelModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving education level:", error);
      alert(error instanceof Error ? error.message : "Lỗi khi lưu hệ đào tạo");
    }
  };

  const handleDeleteEducationLevel = async (documentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hệ đào tạo này?")) {
      try {
        await api.deleteEducationLevel(documentId);
        fetchData();
      } catch (error) {
        console.error("Error deleting education level:", error);
        alert(error instanceof Error ? error.message : "Lỗi khi xóa hệ đào tạo");
      }
    }
  };

  const handleSaveCampus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const campusData = {
      name: fd.get('name') as string,
      code: fd.get('code') as string,
      address: fd.get('address') as string
    };

    try {
      if (editingCampus) {
        await api.updateCampus(editingCampus.id, campusData);
      } else {
        await api.createCampus(campusData);
      }
      setIsCampusModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving campus:", error);
      alert(error instanceof Error ? error.message : "Lỗi khi lưu cơ sở");
    }
  };

  const handleDeleteCampus = async (documentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cơ sở này?")) {
      try {
        await api.deleteCampus(documentId);
        fetchData();
      } catch (error) {
        console.error("Error deleting campus:", error);
        alert(error instanceof Error ? error.message : "Lỗi khi xóa cơ sở");
      }
    }
  };

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const staffData: any = {
      fullName: fd.get('fullName') as string,
      username: fd.get('username') as string,
      role: fd.get('role') as string,
      campus: fd.get('campus') as string,
      status: editingUser?.status || 'Hoạt động'
    };

    const password = fd.get('password') as string;
    if (password) staffData.password = password;

    try {
      if (editingUser) {
        await api.updateStaff(editingUser.id, staffData);
      } else {
        await api.createStaff(staffData);
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Lỗi khi lưu tài khoản cán bộ");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await api.deleteStaff(id);
        fetchData();
      } catch (error) {
        alert("Lỗi khi xóa tài khoản");
      }
    }
  };

  const handleToggleStaffStatus = async (userItem: User) => {
    const newStatus = userItem.status === 'Hoạt động' ? 'Tạm khóa' : 'Hoạt động';
    try {
      await api.updateStaff(userItem.id, { status: newStatus });
      fetchData();
    } catch (error) {
      alert("Lỗi khi thay đổi trạng thái tài khoản");
    }
  };

  const saveToStorage = (data: FormData[]) => {
    setSubmissions(data);
  };

  const saveUsersToStorage = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };

  const saveTemplatesToStorage = (templates: Record<string, AdmissionTemplate>) => {
    setAdmissionTemplates(templates);
  };

  const handleSaveAdmissionTemplate = async () => {
    const template = admissionTemplates[admissionSubTab];
    if (!template) return;

    try {
      // Tìm template theo campus
      const allTemplates = await api.fetchAdmissionTemplates();
      const existing = allTemplates.find((t: any) => t.campus === admissionSubTab);

      if (existing) {
        await api.updateAdmissionTemplate(existing.documentId || existing.id, template);
      } else {
        await api.createAdmissionTemplate(template);
      }
      alert(`Đã lưu mẫu "${admissionSubTab}" lên hệ thống.`);
      fetchData();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Lỗi khi lưu mẫu văn bản");
    }
  };

  const handleSaveSeq = async (nextSeq: number) => {
    try {
      const settings = await api.fetchSystemSettings();
      const existing = settings.find((s: any) => s.key === 'global_admission_seq');
      if (existing) {
        await api.updateSystemSetting(existing.documentId || existing.id, { value: nextSeq.toString() });
      } else {
        await api.createSystemSetting({ key: 'global_admission_seq', value: nextSeq.toString() });
      }
      localStorage.setItem('global_admission_seq', nextSeq.toString());
    } catch (error) {
      console.error("Error saving seq:", error);
    }
  };

  const handleSaveTuition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const campusName = fd.get('campus') as string;
    const levelName = fd.get('educationLevel') as string;

    const campus = campusConfigs.find(c => c.name === campusName);
    const level = educationLevelConfigs.find(l => l.name === levelName);

    const configData = {
      code: fd.get('code') as string,
      name: fd.get('name') as string,
      amount: parseInt(fd.get('amount') as string) || 0,
      campus: campus?.id,
      educationLevel: level?.id
    };

    try {
      if (editingTuition) {
        await api.updateOccupation(editingTuition.id, configData);
      } else {
        await api.createOccupation(configData);
      }
      setIsTuitionModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving tuition:", error);
      alert(error instanceof Error ? error.message : "Lỗi khi lưu cấu hình học phí");
    }
  };

  const handleDeleteTuition = async (documentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cấu hình này?")) {
      try {
        await api.deleteOccupation(documentId);
        fetchData();
      } catch (error) {
        console.error("Error deleting tuition:", error);
        alert(error instanceof Error ? error.message : "Lỗi khi xóa cấu hình");
      }
    }
  };

  const handleSaveHealth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const configData = {
      code: fd.get('code') as string,
      description: fd.get('description') as string,
      amount: parseInt(fd.get('amount') as string) || 0
    };

    try {
      if (editingHealth) {
        await api.updateHealthInsurance(editingHealth.id, configData);
      } else {
        await api.createHealthInsurance(configData);
      }
      setIsHealthModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving health insurance:", error);
      alert("Lỗi khi lưu cấu hình BHYT");
    }
  };

  const handleSaveComprehensive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const configData = {
      code: fd.get('code') as string,
      description: fd.get('description') as string,
      amount: parseInt(fd.get('amount') as string) || 0
    };

    try {
      if (editingComprehensive) {
        await api.updateComprehensiveInsurance(editingComprehensive.id, configData);
      } else {
        await api.createComprehensiveInsurance(configData);
      }
      setIsComprehensiveModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving comprehensive insurance:", error);
      alert("Lỗi khi lưu cấu hình BH toàn diện");
    }
  };

  const handleSaveUniform = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new window.FormData(e.currentTarget);
    const configData = {
      code: fd.get('code') as string,
      description: fd.get('description') as string,
      amount: parseInt(fd.get('amount') as string) || 0
    };

    try {
      if (editingUniform) {
        await api.updateUniform(editingUniform.id, configData);
      } else {
        await api.createUniform(configData);
      }
      setIsUniformModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving uniform:", error);
      alert("Lỗi khi lưu cấu hình đồng phục");
    }
  };

  const handleDeleteHealth = async (documentId: string) => {
    if (window.confirm("Xóa cấu hình BHYT này?")) {
      try {
        await api.deleteHealthInsurance(documentId);
        fetchData();
      } catch (error) {
        alert("Lỗi khi xóa cấu hình");
      }
    }
  };

  const handleDeleteComprehensive = async (documentId: string) => {
    if (window.confirm("Xóa cấu hình BH toàn diện này?")) {
      try {
        await api.deleteComprehensiveInsurance(documentId);
        fetchData();
      } catch (error) {
        alert("Lỗi khi xóa cấu hình");
      }
    }
  };

  const handleDeleteUniform = async (documentId: string) => {
    if (window.confirm("Xóa cấu hình đồng phục này?")) {
      try {
        await api.deleteUniform(documentId);
        fetchData();
      } catch (error) {
        alert("Lỗi khi xóa cấu hình");
      }
    }
  };

  const saveCampusConfigsToStorage = (configs: CampusConfig[]) => setCampusConfigs(configs);
  const saveEducationLevelConfigsToStorage = (configs: EducationLevelConfig[]) => setEducationLevelConfigs(configs);
  const saveHealthConfigsToStorage = (configs: HealthInsuranceConfig[]) => setHealthConfigs(configs);
  const saveComprehensiveConfigsToStorage = (configs: ComprehensiveInsuranceConfig[]) => setComprehensiveConfigs(configs);
  const saveUniformConfigsToStorage = (configs: UniformConfig[]) => setUniformConfigs(configs);
  const saveTuitionConfigsToStorage = (configs: OccupationTuition[]) => setTuitionConfigs(configs);

  const seedConfigData = () => {
    const newCampuses: CampusConfig[] = [
      { id: 'cp1', code: 'HP', name: 'Hải Phòng', address: '425 Phương Khê, Kiến An, Hải Phòng' },
      { id: 'cp2', code: 'ND', name: 'Nam Đồng', address: 'Nam Đồng, TP Hải Dương' },
      { id: 'cp3', code: 'DN', name: 'Đinh Nhu', address: 'Đinh Nhu, TP Hải Phòng' }
    ];
    saveCampusConfigsToStorage(newCampuses);

    const newEducationLevels: EducationLevelConfig[] = [
      { id: 'el1', code: 'CD', name: 'Cao đẳng', description: 'Hệ đào tạo chính quy trình độ Cao đẳng' },
      { id: 'el2', code: 'TC', name: 'Trung cấp', description: 'Hệ đào tạo trình độ Trung cấp' },
      { id: 'el3', code: '9+', name: '9+', description: 'Hệ đào tạo song bằng' }
    ];
    saveEducationLevelConfigsToStorage(newEducationLevels);

    const newTuitions: OccupationTuition[] = [];
    let count = 1;
    MAJORS.forEach(major => {
      SPECIALTIES[major].forEach(spec => {
        newTuitions.push({
          id: Math.random().toString(36).substr(2, 6),
          code: count.toString().padStart(3, '0'),
          name: spec,
          amount: 3000000 + (Math.floor(Math.random() * 5) * 500000),
          campus: CAMPUSES[Math.floor(Math.random() * CAMPUSES.length)],
          educationLevel: EDUCATION_LEVELS[Math.floor(Math.random() * EDUCATION_LEVELS.length)]
        });
        count++;
      });
    });
    saveTuitionConfigsToStorage(newTuitions);

    const newHealth: HealthInsuranceConfig[] = [
      { id: 'h1', code: 'BH01', amount: 972000, description: 'BHYT Sinh viên (12 tháng)' }
    ];
    saveHealthConfigsToStorage(newHealth);

    const newComp: ComprehensiveInsuranceConfig[] = [
      { id: 'c1', code: 'BH02', amount: 150000, description: 'BH Toàn diện (01 năm)' }
    ];
    saveComprehensiveConfigsToStorage(newComp);

    const newUniform: UniformConfig[] = [
      { id: 'u1', code: 'DP01', amount: 1200000, description: 'Combo Đồng phục' }
    ];
    saveUniformConfigsToStorage(newUniform);

    return {
      campuses: newCampuses,
      educationLevels: newEducationLevels,
      tuitions: newTuitions,
      health: newHealth,
      comp: newComp,
      uniform: newUniform
    };
  };

  const seedMockData = () => {
    const configs = seedConfigData();
    const sampleUsers: User[] = [
      { id: 'u1', fullName: 'Nguyễn Cán Bộ Nam Đồng', username: 'namdong', role: 'Cán bộ tiếp nhận', campus: 'Nam Đồng', status: 'Hoạt động', lastLogin: new Date().toISOString() },
      { id: 'u2', fullName: 'Trần Kế Toán Trụ Sở', username: 'ketoan', role: 'Kế toán', campus: 'Hải Phòng', status: 'Hoạt động', lastLogin: new Date().toISOString() },
      { id: 'u3', fullName: 'Lê Quản Trị', username: 'admin_test', role: 'Quản trị viên', status: 'Hoạt động', lastLogin: new Date().toISOString() }
    ];
    saveUsersToStorage(sampleUsers);

    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
    const middleNames = ['Văn', 'Thị', 'Đình', 'Hoàng', 'Minh', 'Thanh', 'Anh', 'Xuân', 'Kim', 'Đức'];
    const lastNames = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hương', 'Hùng', 'Kiên', 'Linh', 'Nam', 'Phong', 'Quân', 'Sơn', 'Trang', 'Tú', 'Uyên', 'Việt'];
    const statuses = [SubmissionStatus.PENDING, SubmissionStatus.RECEIVED, SubmissionStatus.APPROVED];
    const tuitionStatuses = [TuitionStatus.UNPAID, TuitionStatus.PARTIAL, TuitionStatus.PAID];
    const newMockRecords: FormData[] = [];

    for (let i = 0; i < 6000; i++) {
      const fullName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const idNum = `03120600${(Math.floor(Math.random() * 9000) + 1000).toString()}${i.toString().padStart(4, '0')}`;
      const campus = CAMPUSES[Math.floor(Math.random() * CAMPUSES.length)];
      const majorKey = MAJORS[Math.floor(Math.random() * MAJORS.length)];
      const specialty = SPECIALTIES[majorKey][Math.floor(Math.random() * SPECIALTIES[majorKey].length)];
      const grades: Record<string, string> = {};
      SUBJECTS.forEach(sub => grades[sub] = (Math.random() * 3.5 + 6.0).toFixed(1));

      const config = configs.tuitions.find(c => c.name === specialty);
      const tuitionAmount = config?.amount || 5000000;
      const healthAmount = configs.health[0]?.amount || 972000;
      const comprehensiveAmount = configs.comp[0]?.amount || 150000;
      const uniformAmount = configs.uniform[0]?.amount || 1200000;
      const totalRequired = tuitionAmount + healthAmount + comprehensiveAmount + uniformAmount;
      const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const currentTuitionStatus = tuitionStatuses[Math.floor(Math.random() * tuitionStatuses.length)];

      let tuitionPaidAmount = 0;
      if (currentTuitionStatus === TuitionStatus.PAID) {
        tuitionPaidAmount = totalRequired;
      } else if (currentTuitionStatus === TuitionStatus.PARTIAL) {
        tuitionPaidAmount = Math.floor((totalRequired * (Math.random() * 0.5 + 0.1)) / 1000) * 1000;
      }

      newMockRecords.push({
        id: idNum,
        submissionDate: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
        fullName: fullName,
        dob: `${2006 + Math.floor(Math.random() * 2)}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
        pob: 'Hải Phòng',
        gender: Math.random() > 0.5 ? 'Nam' : 'Nữ',
        ethnicity: 'Kinh',
        idNumber: idNum,
        issueDate: '2021-06-15',
        issuePlace: 'Cục CS QLHC về TTXH',
        province: 'Hải Phòng',
        district: 'Quận Ngô Quyền',
        addressDetails: `${Math.floor(Math.random() * 200)} Lạch Tray`,
        phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `student.${i}@hanghai.edu.vn`,
        parentName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} Văn Phụ Huynh`,
        parentPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        campus: campus,
        educationLevel: EDUCATION_LEVELS[Math.floor(Math.random() * EDUCATION_LEVELS.length)],
        choice1Major: majorKey,
        choice1Specialty: specialty,
        choice2Major: MAJORS[0],
        choice2Specialty: SPECIALTIES[MAJORS[0]][0],
        gradYear: '2024',
        gradSchool: 'THPT Ngô Quyền',
        gradProvince: 'Hải Phòng',
        gradDistrict: 'Quận Ngô Quyền',
        diplomaNumber: `B-${Math.floor(Math.random() * 1000000)}`,
        grades,
        recipient: RecipientType.CANDIDATE,
        deliveryAddress: AddressType.PERMANENT,
        deliveryAddressDetails: '',
        status: currentStatus,
        tuitionStatus: currentTuitionStatus,
        tuitionAmount,
        healthAmount,
        comprehensiveAmount,
        uniformAmount,
        tuitionPaidAmount,
        isHealthSelected: true,
        isComprehensiveSelected: true,
        isUniformSelected: true,
        files: { frontId: null, backId: null, diploma: null, tempCert: null }
      });

      // Avoid UI Freeze by breaking the task every 500 iterations
      if (i % 500 === 0) {
        // This is a browser environment hint, mock data is usually done on a button click
      }
    }
    saveToStorage(newMockRecords);
    alert(`ĐÃ KHỞI TẠO TOÀN BỘ DỮ LIỆU MẪU:\n- 6000 hồ sơ thí sinh mẫu (Server-side simulation)\n- 3 tài khoản cán bộ mẫu\n- Cấu hình học phí 30+ ngành học\n- Cấu hình phí bảo hiểm & đồng phục`);
  };

  const handleClearAllData = () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ hồ sơ trong hệ thống? Hành động này không thể hoàn tác.')) {
      saveToStorage([]);
      localStorage.setItem('global_admission_seq', '0');
      alert('Đã xóa sạch dữ liệu hồ sơ và đặt lại bộ đếm số hiệu.');
    }
  };

  const filteredSubmissions = React.useMemo(() => {
    return submissions
      .filter(s => {
        if (user?.role !== 'Quản trị viên') {
          if (!user?.campus || s.campus !== user.campus) return false;
        }
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = s.fullName.toLowerCase().includes(searchLower) ||
          s.phone.includes(searchTerm) ||
          s.idNumber.includes(searchTerm);
        const matchesCampus = filterCampus === '' || s.campus === filterCampus;
        const matchesLevel = filterLevel === '' || s.educationLevel === filterLevel;
        const matchesMajor = filterMajor === '' || s.choice1Major === filterMajor;
        return matchesSearch && matchesCampus && matchesLevel && matchesMajor;
      })
      .sort((a, b) => {
        const priorityA = STATUS_PRIORITY[a.status] || 99;
        const priorityB = STATUS_PRIORITY[b.status] || 99;
        return priorityA - priorityB;
      });
  }, [submissions, searchTerm, filterCampus, filterLevel, filterMajor, user?.role, user?.campus]);

  const approvedSubmissions = React.useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return tuitionSubmissions
      .filter(s => {
        if (user?.role !== 'Quản trị viên') {
          if (!user?.campus || s.campus !== user.campus) return false;
        }
        return s.fullName.toLowerCase().includes(searchLower) ||
          s.phone.includes(searchTerm) ||
          s.idNumber.includes(searchTerm);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [tuitionSubmissions, searchTerm, user?.role, user?.campus]);

  const paginatedTuitionSubmissions = React.useMemo(() => {
    const startIndex = (tuitionPagination.page - 1) * tuitionPagination.pageSize;
    const endIndex = startIndex + tuitionPagination.pageSize;
    return approvedSubmissions.slice(startIndex, endIndex);
  }, [approvedSubmissions, tuitionPagination.page, tuitionPagination.pageSize]);

  // Reset tuition pagination to page 1 when search term changes
  useEffect(() => {
    setTuitionPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  const handleExportExcel = async () => {
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
        if (user?.role !== 'Quản trị viên') {
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
        'Người nhận giấy báo', 'Địa chỉ nhận giấy báo', 'Chi tiết nới nhận'
      ];

      const rows = allData.map((s: any, idx: number) => [
        idx + 1,
        s.submissionDate ? new Date(s.submissionDate).toLocaleDateString('vi-VN') : '',
        s.status,
        s.fullName,
        s.gender,
        s.dob ? new Date(s.dob).toLocaleDateString('vi-VN') : '',
        s.pob,
        s.ethnicity,
        `'${s.idNumber}`,
        s.issueDate ? new Date(s.issueDate).toLocaleDateString('vi-VN') : '',
        s.issuePlace,
        `'${s.phone}`,
        s.email,
        s.addressDetails,
        s.district,
        s.province,
        s.parentName,
        `'${s.parentPhone}`,
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
      ]);

      const ws = XLSX.utils.aoa_to_sheet([
        [`TỔNG SỐ HỒ SƠ TỔNG HỢP TRÊN HỆ THỐNG: ${allData.length}`],
        [],
        headers, 
        ...rows
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachTuyenSinh");
      XLSX.writeFile(wb, `Danh_sach_tuyen_sinh_toan_he_thong_${Date.now()}.xlsx`);
    } catch (error) {
      console.error("Lỗi xuất excel:", error);
      alert("Đã xảy ra lỗi khi tải dữ liệu xuất Excel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTuitionExcel = () => {
    if (submissions.length === 0) return alert('Không có dữ liệu!');
    const headers = ['STT', 'Mã số (CCCD)', 'Họ và tên', 'Ngày sinh', 'Nơi sinh', 'Dân tộc', 'SĐT', 'Số nhà, đường, ngõ, xóm', 'Xã/Phường/Thị trấn', 'Tỉnh/thành phố', 'Nghề đào tạo', 'Mã nghề', 'Học phí', 'BH Y Tế', 'BH Toàn Diện', 'Đồng Phục', 'Đã nộp', 'Còn lại', 'Tình trạng', 'Ghi chú', 'Acc người thu tiền', 'Ngày nộp', 'Ngày thu chi tiết'];
    const rows = approvedSubmissions.map((s, idx) => {
      const hAmount = s.isHealthSelected ? (s.healthAmount || 0) : 0;
      const cAmount = s.isComprehensiveSelected ? (s.comprehensiveAmount || 0) : 0;
      const uAmount = s.isUniformSelected ? (s.uniformAmount || 0) : 0;
      const totalAmount = (s.tuitionAmount || 0) + hAmount + cAmount + uAmount;
      const remaining = totalAmount - (s.tuitionPaidAmount || 0);
      return [
        idx + 1,
        `'${s.idNumber}`,
        s.fullName,
        s.dob ? (() => {
          const d = new Date(s.dob);
          return `'${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        })() : '',
        s.pob || '',
        s.ethnicity || '',
        `'${s.phone}`,
        s.addressDetails,
        s.district,
        s.province,
        s.choice1Major || '',
        s.choice1Specialty || '',
        (s.tuitionAmount || 0),
        hAmount,
        cAmount,
        uAmount,
        s.tuitionPaidAmount || 0,
        remaining > 0 ? remaining : 0,
        s.tuitionStatus || TuitionStatus.UNPAID,
        s.paymentMethod || '',
        s.collectorAccount || '',
        s.collectedDate ? (() => {
          const d = new Date(s.collectedDate);
          return `'${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        })() : '',
        s.collectedDate ? new Date(s.collectedDate).toLocaleString('vi-VN') : ''
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([
      [`TỔNG SỐ HỒ SƠ HỌC PHÍ (ĐÃ XUẤT RA EXCEL): ${approvedSubmissions.length}`],
      [],
      headers, 
      ...rows
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuanLyHocPhi");
    XLSX.writeFile(wb, `Danh_sach_hoc_phi_${Date.now()}.xlsx`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const updateStatusForSelected = async (status: SubmissionStatus) => {
    if (selectedIds.size === 0) return alert('Vui lòng chọn ít nhất một hồ sơ!');
    try {
      const idsToUpdate = Array.from(selectedIds);
      for (const id of idsToUpdate) {
        const sub = submissions.find(s => s.id === id);
        if (sub?.docId) {
          await api.updateRegistration(sub.docId, { 
            status,
            syncAmounts: status === SubmissionStatus.APPROVED 
          });
        }
      }
      fetchData();
      alert(`Đã cập nhật trạng thái cho ${selectedIds.size} hồ sơ.`);
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return alert('Vui lòng chọn ít nhất một hồ sơ để xóa!');

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} hồ sơ đã chọn? Thao tác này không thể hoàn tác.`)) {
      try {
        const idsToRemove = Array.from(selectedIds);
        for (const id of idsToRemove) {
          const submission = submissions.find(s => s.id === id);
          if (submission?.docId) {
            await api.deleteRegistration(submission.docId);
          }
        }
        alert(`Đã xóa thành công ${selectedIds.size} hồ sơ.`);
        setSelectedIds(new Set());
        fetchData();
      } catch (error) {
        console.error("Error deleting selected registrations:", error);
        alert("Có lỗi xảy ra khi xóa hồ sơ. Vui lòng thử lại.");
        fetchData();
      }
    }
  };

  const updateCurrentSubmissionStatus = async (status: SubmissionStatus) => {
    if (!selectedSubmission?.docId) return;
    try {
      await api.updateRegistration(selectedSubmission.docId, { 
        status,
        syncAmounts: status === SubmissionStatus.APPROVED 
      });
      // Re-fetch data to reflect newly synced amounts
      await fetchData();
      // Also update local selected submission if possible
      const refreshed = await api.getRegistrationById(selectedSubmission.docId);
      if (refreshed?.data) {
        setSelectedSubmission(prev => ({ ...prev, ...refreshed.data.attributes, id: refreshed.data.id, docId: refreshed.data.documentId }));
      }
      
      if (status === SubmissionStatus.RECEIVED) {
        alert("Đã tiếp nhận hồ sơ");
      }
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handlePrintSubmission = async () => {
    if (!selectedSubmission) return;
    let currentSeq = selectedSubmission.docSeq;
    if (!currentSeq) {
      const lastSeq = parseInt(localStorage.getItem('global_admission_seq') || '0');
      const nextSeq = lastSeq + 1;
      currentSeq = nextSeq.toString().padStart(2, '0');
      handleSaveSeq(nextSeq);

      try {
        await api.updateRegistration(selectedSubmission.docId, {
          docSeq: currentSeq,
          status: SubmissionStatus.APPROVED,
          syncAmounts: true
        });
        
        // Re-fetch data
        await fetchData();
        
        // Update local object
        const refreshed = await api.getRegistrationById(selectedSubmission.docId);
        if (refreshed?.data) {
           setSelectedSubmission(prev => ({ ...prev, ...refreshed.data.attributes, id: refreshed.data.id, docId: refreshed.data.documentId, docSeq: currentSeq, status: SubmissionStatus.APPROVED }));
        }
      } catch (error) {
        alert("Lỗi khi cập nhật hồ sơ trúng tuyển");
        return;
      }
    } else {
      await updateCurrentSubmissionStatus(SubmissionStatus.APPROVED);
    }
    const template = admissionTemplates[selectedSubmission.campus] || admissionTemplates['Hải Phòng'];
    renderPrintWindow(template, { ...selectedSubmission, docSeq: currentSeq, status: SubmissionStatus.APPROVED }, currentSeq);
  };

  const handlePrintInvoice = (s: FormData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const template = admissionTemplates['Thu học phí'];
    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const docNumber = `BK-${Math.floor(Math.random() * 900000 + 100000)}`;
    const hAmt = s.isHealthSelected ? (s.healthAmount || 0) : 0;
    const cAmt = s.isComprehensiveSelected ? (s.comprehensiveAmount || 0) : 0;
    const uAmt = s.isUniformSelected ? (s.uniformAmount || 0) : 0;
    const totalRequired = (s.tuitionAmount || 0) + hAmt + cAmt + uAmt;
    const remaining = totalRequired - (s.tuitionPaidAmount || 0);

    const renderReceiptHTML = (lien: number) => `
      <div class="receipt-container">
        <div class="lien-label">LIÊN ${lien}: ${lien === 1 ? 'NHÀ TRƯỜNG LƯU' : 'THÍ SINH LƯU'}</div>
        <div class="header">
          <div class="school-info">
            <div class="school-name">${template.announcer}</div>
            <div class="school-addr">Địa chỉ: ${template.location}</div>
          </div>
          <div class="doc-info">
            <div>Số hiệu: ${docNumber}</div>
            <div>Ngày: ${formattedDate}</div>
          </div>
        </div>
        <div class="title">${template.title}</div>
        <div class="student-info">
          <div><span class="info-label">Người nộp:</span><span class="info-value">${s.fullName}</span></div>
          <div><span class="info-label">Mã số (CCCD):</span><span class="info-value">${s.idNumber}</span></div>
          <div><span class="info-label">Ngành học:</span><span class="info-value">${s.choice1Specialty}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="8%">STT</th>
              <th>Nội dung thanh toán</th>
              <th width="30%" class="right">Thành tiền (đ)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="center">1</td><td>Học phí học kỳ 1</td><td class="right">${(s.tuitionAmount || 0).toLocaleString('vi-VN')}</td></tr>
            <tr><td class="center">2</td><td>Bảo hiểm Y tế (bắt buộc)</td><td class="right">${hAmt.toLocaleString('vi-VN')}</td></tr>
            <tr><td class="center">3</td><td>Bảo hiểm Toàn diện</td><td class="right">${cAmt.toLocaleString('vi-VN')}</td></tr>
            <tr><td class="center">4</td><td>Đồng phục sinh viên</td><td class="right">${uAmt.toLocaleString('vi-VN')}</td></tr>
            <tr class="total-row bold">
              <td colspan="2" class="total-label">TỔNG TIỀN ĐÃ THU</td>
              <td class="right">${(s.tuitionPaidAmount || 0).toLocaleString('vi-VN')}</td>
            </tr>
            <tr class="total-row bold">
              <td colspan="2" class="total-label">SỐ TIỀN CÒN LẠI PHẢI THU</td>
              <td class="right">${(remaining > 0 ? remaining : 0).toLocaleString('vi-VN')}</td>
            </tr>
          </tbody>
        </table>
        <div class="by-words">Bằng chữ: ${template.basis}</div>
        <div class="footer">
          <div class="sig-box">
            <div class="sig-title">Người nộp tiền</div>
            <div class="sig-name" style="font-weight: normal; font-style: italic; font-size: 10pt">(Ký, ghi rõ họ tên)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">${template.footerTitle}</div>
            <div class="sig-name">${user?.fullName || template.footerName}</div>
          </div>
        </div>
      </div>
    `;
    printWindow.document.write(`
      <html>
        <head>
          <title>${template.title} - ${s.fullName}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; margin: 0; padding: 0; background: #fff; }
            .page-wrapper { width: 210mm; height: 297mm; display: flex; flex-direction: column; padding: 10mm; box-sizing: border-box; }
            .receipt-container { height: 48%; padding: 5mm; position: relative; box-sizing: border-box; }
            .lien-label { position: absolute; top: 0; right: 5mm; font-size: 9pt; font-weight: bold; font-style: italic; color: #555; }
            .cut-line { width: 100%; border-top: 1px dashed #000; margin: 5mm 0; position: relative; }
            .cut-line::after { content: "✂"; position: absolute; left: 0; top: -12px; font-size: 14pt; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
            .school-info { line-height: 1.2; }
            .school-name { font-weight: bold; font-size: 12pt; text-transform: uppercase; }
            .school-addr { font-size: 9pt; color: #333; }
            .doc-info { text-align: right; line-height: 1.2; font-size: 10pt; }
            .title { text-align: center; font-weight: bold; font-size: 14pt; text-transform: uppercase; margin: 10px 0 10px 0; }
            .student-info { margin-bottom: 10px; line-height: 1.4; font-size: 11pt; }
            .info-label { display: inline-block; width: 120px; }
            .info-value { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 11pt; }
            th { text-align: center; font-weight: bold; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .total-row { background-color: #fff; }
            .total-label { text-align: center; font-weight: bold; text-transform: uppercase; }
            .by-words { margin-top: 5px; font-style: italic; font-size: 10pt; }
            .footer { margin-top: 10px; display: flex; justify-content: space-around; text-align: center; }
            .sig-box { width: 45%; }
            .sig-title { font-weight: bold; margin-bottom: 100px; }
            .sig-name { font-weight: bold; font-size: 11pt; }
            @media print { body { -webkit-print-color-adjust: exact; } .page-wrapper { margin: 0; border: none; } }
          </style>
        </head>
        <body>
          <div class="page-wrapper">
            ${renderReceiptHTML(1)}
            <div class="cut-line"></div>
            ${renderReceiptHTML(2)}
          </div>
          <script>
            window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSyncTuitionFromConfig = async () => {
    if (approvedSubmissions.length === 0) return alert('Không có dữ liệu trúng tuyển!');
    if (!window.confirm(`Bạn có chắc muốn đồng bộ lại học phí và bảo hiểm cho ${approvedSubmissions.length} thí sinh từ cấu hình hệ thống?`)) return;
    
    setIsLoading(true);
    let successCount = 0;
    try {
      for (const sub of approvedSubmissions) {
        if (sub.docId) {
          await api.updateRegistration(sub.docId, { syncAmounts: true });
          successCount++;
        }
      }
      alert(`Đã đồng bộ thành công cho ${successCount} hồ sơ.`);
      fetchData();
    } catch (error) {
      console.error("Lỗi đồng bộ:", error);
      alert("Có lỗi xảy ra trong quá trình đồng bộ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintBlankTemplate = () => {
    const template = admissionTemplates[admissionSubTab];
    const dummySubmission: any = {
      fullName: 'NGUYỄN VĂM MẪU',
      dob: '2007-01-01',
      pob: 'Hải Phòng',
      ethnicity: 'Kinh',
      addressDetails: 'Số 123 Đường Mẫu',
      district: 'Quận Mẫu',
      province: 'Thành phố Mẫu',
      educationLevel: 'Cao đẳng',
      choice1Specialty: 'Lập trình Web',
      campus: template.campus,
      tuitionAmount: 3500000,
      healthAmount: 972000,
      comprehensiveAmount: 150000,
      tuitionPaidAmount: 4025000,
      isHealthSelected: true,
      isComprehensiveSelected: true,
      isUniformSelected: true,
      files: { frontId: null, backId: null, diploma: null, tempCert: null }
    };
    if (admissionSubTab === 'Thu học phí') {
      handlePrintInvoice(dummySubmission);
    } else {
      renderPrintWindow(template, dummySubmission, '00');
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newTemplates = { ...admissionTemplates };
        newTemplates[admissionSubTab].qrCodeImage = base64;
        saveTemplatesToStorage(newTemplates);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const rows = data.slice(1) as any[];
        if (rows.length === 0) return alert('File không có dữ liệu!');

        let successCount = 0;
        let failCount = 0;
        let errors: string[] = [];

        console.log('Đang bắt đầu nhập dữ liệu từ Excel...');

        for (const row of rows) {
          const code = row[0]?.toString() || '';
          const name = row[1]?.toString() || '';
          const campusName = (row[2]?.toString() || '').trim();
          const levelName = (row[3]?.toString() || '').trim();
          const amountStr = row[4]?.toString().replace(/[^\d]/g, '') || '0';
          const amount = parseInt(amountStr);

          if (!code || !name) continue;

          // Tìm ID tương ứng cho campus và educationLevel
          const campus = campusConfigs.find(c => c.name.trim().toLowerCase() === campusName.toLowerCase());
          const level = educationLevelConfigs.find(l => l.name.trim().toLowerCase() === levelName.toLowerCase());

          if (!campus) {
            errors.push(`Dòng ${rows.indexOf(row) + 2}: Không tìm thấy cơ sở "${campusName}"`);
            failCount++;
            continue;
          }
          if (!level) {
            errors.push(`Dòng ${rows.indexOf(row) + 2}: Không tìm thấy hệ đào tạo "${levelName}"`);
            failCount++;
            continue;
          }

          const configData = {
            code,
            name,
            amount,
            campus: campus.id,
            educationLevel: level.id
          };

          try {
            await api.createOccupation(configData);
            successCount++;
          } catch (error) {
            console.error(`Lỗi khi nhập ngành ${name}:`, error);
            errors.push(`Dòng ${rows.indexOf(row) + 2}: Lỗi hệ thống khi lưu "${name}"`);
            failCount++;
          }
        }

        if (successCount > 0 || failCount > 0) {
          let msg = `Kết quả nhập dữ liệu:\n- Thành công: ${successCount}\n- Thất bại: ${failCount}`;
          if (errors.length > 0) {
            msg += `\n\nChi tiết lỗi (20 dòng đầu):\n${errors.slice(0, 20).join('\n')}`;
          }
          alert(msg);
          if (successCount > 0) fetchData();
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Mã nghề', 'Tên nghề đào tạo', 'Cơ sở', 'Hệ', 'Học phí'];
    const sampleData = [
      ['001', 'LẬP TRÌNH WEB', 'Nam Đồng', 'Cao đẳng', '5000000'],
      ['002', 'LẬP TRÌNH MOBILE', 'Nam Đồng', 'Trung cấp', '4500000']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_nhap_hoc_phi');
    XLSX.writeFile(wb, 'Mau_cau_hinh_hoc_phi.xlsx');
  };

  const renderPrintWindow = (template: AdmissionTemplate, submission: any, docNumber?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const now = new Date();
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear();
    const qrSrc = template.qrCodeImage || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIIAAACCAQMAAAD9Db7nAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABN0lEQVRIicWVsW3DQAxFn/D/K+Z8gW8gBfD8U8S9E67E7yv8E8XPCv8E8bvCP6L4I0oPivFpWfM1/M068LpA6/N8WdZ8B9+u68L6vV+uC6/S7rqu7L9f76W6Lqx308G6rj0p9n65B8V4fS7Lmu/gh+vC+tB7UoxPS5onxdnvfV3YlC/W1/ty5R6fljXfg6X6mO+f6rqwKff49L6f6rqw9/P7/v1T6/fXpTrP82VZs7Gf78/vO+f7XhRjPl+WNYPv13VhU+96X9R8B597UIzf76W6Lqx300E3Xdf/r6P/+Wv5C5I/vVpXyH59AAAAAElFTkSuQmCC";
    const displayNum = docNumber || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    const tAmt = submission.tuitionAmount || 0;
    const hAmt = submission.isHealthSelected ? (submission.healthAmount || 0) : 0;
    const cAmt = submission.isComprehensiveSelected ? (submission.comprehensiveAmount || 0) : 0;
    const totalAmt = tAmt + hAmt + cAmt;

    printWindow.document.write(`
      <html>
        <head>
          <title>${template.title} - ${submission.fullName}</title>
          <style>
            @page { size: A4; margin: 0; }
            html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #000; line-height: 1.15; font-size: 13pt; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; }
            .page-container { width: 210mm; height: 297mm; padding: 15mm 15mm 15mm 20mm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
            .header-left { text-align: center; width: 48%; }
            .header-right { text-align: center; width: 48%; }
            .school-name-small { font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 1px; white-space: nowrap; }
            .school-name-large { font-weight: bold; font-size: 11pt; text-transform: uppercase; line-height: 1.1; }
            .line-under { border-bottom: 1.5px solid #000; display: inline-block; width: 55%; margin-top: 1px; }
            .doc-number { font-size: 11pt; margin-top: 5px; }
            .nation-name { font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 1px; }
            .nation-slogan { font-weight: bold; font-size: 12pt; margin-bottom: 0px; }
            .doc-date { font-style: italic; font-size: 12pt; text-align: right; margin-top: 5px; }
            .main-title { text-align: center; font-weight: bold; font-size: 15pt; margin: 20px 0 10px 0; text-transform: uppercase; }
            .basis { text-align: justify; font-style: italic; font-size: 12pt; margin-bottom: 10px; line-height: 1.15; }
            .announcer { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 20px; text-transform: uppercase; }
            .content-row { margin-bottom: 5px; display: flex; align-items: baseline; }
            .label { width: 210px; flex-shrink: 0; }
            .value { font-weight: bold; }
            .full-width-row { margin: 8px 0; text-align: justify; }
            .section-bold { font-weight: bold; margin: 3px 0 3px 0; font-size: 13pt; }
            .requirement-item { margin-bottom: 1px; padding-left: 0px; text-align: justify; font-weight: bold; line-height: 1.15; }
            .fees-table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            .fees-table th, .fees-table td { border: 1px solid black; padding: 4px 8px; font-size: 12pt; }
            .fees-table th { text-align: center; font-weight: bold; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .contact-info { margin-top: 5px; font-style: italic; font-size: 12pt; text-align: justify; line-height: 1.15; }
            .contact-info b { font-weight: bold; font-style: normal; }
            .footer-area { display: flex; justify-content: space-between; margin-top: 10px; align-items: flex-start; padding-bottom: 5mm; }
            .qr-side { width: 45%; display: flex; flex-direction: column; align-items: flex-start; }
            .qr-box { width: 110px; height: 110px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; overflow: hidden; }
            .qr-box img { width: 100%; height: 100%; object-fit: contain; }
            .qr-label { font-size: 9pt; line-height: 1.2; text-align: left; font-style: italic; font-weight: bold; }
            .signature-side { width: 50%; text-align: center; }
            .sig-title { font-weight: bold; text-transform: uppercase; margin-bottom: 100px; white-space: pre-line; line-height: 1.1; font-size: 12pt; }
            .sig-name { font-weight: bold; font-size: 13pt; }
            @media print { .no-print { display: none; } body, .page-container { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header-top">
              <div class="header-left">
                <div class="school-name-small">CỤC HÀNG HẢI VÀ ĐƯỜNG THỦY VIỆT NAM</div>
                <div class="school-name-large">TRƯỜNG CAO ĐẲNG<br>HÀNG HẢI VÀ ĐƯỜNG THỦY I</div>
                <div><div class="line-under"></div></div>
                <div class="doc-number">Số: ${displayNum}/GTT-CĐHHĐTI</div>
              </div>
              <div class="header-right">
                <div class="nation-name">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div class="nation-slogan">Độc lập - Tự do - Hạnh phúc</div>
                <div><div class="line-under"></div></div>
                <div class="doc-date">Hải Phòng, ngày ${currentDay} tháng ${currentMonth} năm ${currentYear}</div>
              </div>
            </div>
            <div class="main-title">${template.title}</div>
            <div class="basis">${template.basis}</div>
            <div class="announcer">${template.announcer}</div>
            <div class="content-row">
              <span class="label">Báo cho thí sinh:</span>
              <span class="value" style="font-size: 14pt;">${submission.fullName}</span>
              <span style="margin-left: auto;">Ngày sinh: <span class="value">${new Date(submission.dob).toLocaleDateString('vi-VN')}</span></span>
            </div>
            <div class="content-row">
              <span class="label">Địa chỉ thường trú:</span>
              <span class="value">${submission.addressDetails}, ${submission.district}, ${submission.province}</span>
            </div>
            <div class="full-width-row">Đã trúng tuyển vào Trường Cao đẳng Hàng hải và Đường thủy I, trình độ <b>${submission.educationLevel || 'Cao đẳng'}</b> năm ${currentYear};</div>
            <div class="content-row">
              <span class="label">Nghề đào tạo đăng ký học:</span>
              <span class="value">${submission.choice1Major} (Mã: ${submission.choice1Specialty})</span>
            </div>
            <div class="content-row">
              <span class="label">Thời gian nhập học:</span>
              <span class="value">${template.admissionHour || '........'} giờ, ngày ${template.admissionDay || '....'} tháng ${template.admissionMonth || '....'} năm ${template.admissionYear || '....'}</span>
            </div>
            <div class="content-row">
              <span class="label">Địa điểm nhập học:</span>
              <span style="font-size: 11pt;">${template.location}</span>
            </div>
            <div class="section-bold">Khi đến trường nhập học, thí sinh cần mang theo:</div>
            ${template.requirements.map((req, idx) => `<div class="requirement-item">${idx + 1}. ${req}</div>`).join('')}
            <div class="section-bold">7. Các khoản thu:</div>
            <table class="fees-table">
              <thead>
                <tr>
                  <th width="8%">STT</th>
                  <th width="67%">Tên khoản nộp</th>
                  <th width="25%">Cộng</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="center">1</td><td>Học phí học kỳ 1</td><td class="right">${tAmt > 0 ? tAmt.toLocaleString('vi-VN') + ' đ' : ''}</td></tr>
                <tr><td class="center">2</td><td>Phí bảo hiểm Y tế (1 năm)</td><td class="right">${hAmt > 0 ? hAmt.toLocaleString('vi-VN') + ' đ' : ''}</td></tr>
                <tr><td class="center">3</td><td>Phí bảo hiểm Toàn diện (1 năm)</td><td class="right">${cAmt > 0 ? cAmt.toLocaleString('vi-VN') + ' đ' : ''}</td></tr>
                <tr class="bold">
                  <td colspan="2" class="center">TỔNG CỘNG:</td>
                  <td class="right">${totalAmt > 0 ? totalAmt.toLocaleString('vi-VN') + ' đ' : ''}</td>
                </tr>
              </tbody>
            </table>
            <div class="contact-info">Để biết thêm thông tin chi tiết thí sinh liên hệ với phòng <b>Công tác HS-SV</b>, Hotline: <b>${template.hotline}</b> hoặc xem trên Website: <b>${template.website}</b></div>
            <div class="footer-area">
              <div class="qr-side">
                <div class="qr-box"><img src="${qrSrc}" alt="QR Map" /></div>
                <div class="qr-label">Quét mã để xem đường đi<br>đến Trường CĐ HH&ĐT I</div>
              </div>
              <div class="signature-side">
                <div class="sig-title">${template.footerTitle}</div>
                <div class="sig-name">${template.footerName}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 300); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusStyle = (status: SubmissionStatus | undefined) => {
    switch (status) {
      case SubmissionStatus.PENDING: return 'bg-orange-50 text-orange-600 border-orange-200';
      case SubmissionStatus.RECEIVED: return 'bg-blue-50 text-blue-600 border-blue-200';
      case SubmissionStatus.APPROVED: return 'bg-green-50 text-green-600 border-green-200';
      case SubmissionStatus.LOCKED: return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  const isAdmin = user?.role === 'Quản trị viên';
  const EditIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
  const DeleteIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m-3 0h10" /></svg>);

  const uniqueFilterCampuses = Array.from(new Set(tuitionConfigs.map(c => c.campus))).filter(Boolean).sort();
  const uniqueFilterLevels = Array.from(new Set(tuitionConfigs.map(c => c.educationLevel))).filter(Boolean).sort();
  const uniqueFilterMajors = Array.from(new Set(tuitionConfigs.map(c => c.name))).filter(Boolean).sort();

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <header className="bg-blue-900 shadow-2xl z-30 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
            <div>
              <h1 className="text-white text-lg font-black tracking-tighter leading-none">ADMIN PORTAL</h1>
              <p className="text-blue-300/60 text-[9px] font-bold uppercase tracking-widest mt-1">Cao đẳng Hàng hải I</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <HorizontalMenuButton active={activeTab === 'submissions'} onClick={() => handleTabChange('submissions')} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Quản lý hồ sơ" />
            <HorizontalMenuButton active={activeTab === 'tuition'} onClick={() => handleTabChange('tuition')} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>} label="Quản lý học phí" />
            <HorizontalMenuButton active={activeTab === 'admission-templates'} onClick={() => handleTabChange('admission-templates')} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} label="Mẫu văn bản" />
            <HorizontalMenuButton active={activeTab === 'tuition-config'} onClick={() => handleTabChange('tuition-config')} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Cài đặt" />
            {isAdmin && <HorizontalMenuButton active={activeTab === 'roles'} onClick={() => handleTabChange('roles')} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} label="Phân quyền" />}
          </nav>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-white font-bold text-sm leading-none">{user?.fullName}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[8px] font-black uppercase rounded border border-blue-500/30">{user?.role}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 font-black border border-white/10">{user?.fullName?.charAt(0)}</div>
            </div>
            <button onClick={onLogout} className="flex items-center justify-center w-9 h-9 text-blue-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all" title="Đăng xuất"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        {activeTab === 'submissions' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-blue-950 tracking-tight">Hồ sơ đăng ký</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Quản lý và xét tuyển hồ sơ thí sinh trực tuyến</p>
              </div>

            </header>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 min-w-[120px]"><span className="text-[10px] text-blue-600 font-extrabold uppercase block mb-0.5">Tổng số</span><span className="text-xl font-black text-blue-900">{totalCount}</span></div>
              <select disabled={!isAdmin} className={`bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-medium outline-none ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} value={filterCampus} onChange={e => setFilterCampus(e.target.value)}><option value="">Tất cả cơ sở</option>{uniqueFilterCampuses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-medium outline-none" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}><option value="">Tất cả hệ đào tạo</option>{uniqueFilterLevels.map(l => <option key={l} value={l}>{l}</option>)}</select>
              <select className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-medium outline-none max-w-[200px]" value={filterMajor} onChange={e => setFilterMajor(e.target.value)}><option value="">Tất cả nghề đào tạo</option>{uniqueFilterMajors.map((m, idx) => <option key={idx} value={m}>{m}</option>)}</select>
              <button onClick={handleExportExcel} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Xuất Excel</button>
              <div className="flex-1 relative"><input type="text" placeholder="Tìm tên, SĐT, CCCD..." className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex gap-2 overflow-x-auto items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Thao tác nhanh:</span><ActionButton label="Tiếp nhận" color="blue" onClick={() => updateStatusForSelected(SubmissionStatus.RECEIVED)} />{user?.role !== 'Cán bộ tiếp nhận' && (<><ActionButton label="Duyệt trúng tuyển" color="green" onClick={() => updateStatusForSelected(SubmissionStatus.APPROVED)} /><ActionButton label="Khóa hồ sơ" color="slate" onClick={() => updateStatusForSelected(SubmissionStatus.LOCKED)} /><ActionButton label="Hủy trạng thái" color="orange" onClick={() => updateStatusForSelected(SubmissionStatus.PENDING)} /></>)}{isAdmin && <ActionButton label="Xóa hồ sơ" color="red" onClick={handleDeleteSelected} />}</div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                    <tr><th className="px-6 py-4 w-10"><input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0} onChange={toggleSelectAll} /></th><th className="px-4 py-4">Mã hồ sơ (CCCD)</th><th className="px-4 py-4">Họ và tên</th><th className="px-4 py-4">Số điện thoại</th><th className="px-4 py-4">Cơ sở</th><th className="px-4 py-4">Hệ đào tạo</th><th className="px-4 py-4">Nghề đào tạo</th><th className="px-4 py-4 text-center">Trạng thái</th><th className="px-4 py-4 text-center">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredSubmissions.map(s => (
                      <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.has(s.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                        <td className="px-4 py-4 font-mono text-gray-400 text-xs">{s.idNumber}</td>
                        <td className="px-4 py-4 font-bold text-blue-900">{s.fullName}</td>
                        <td className="px-4 py-4 text-gray-600">{s.phone}</td>
                        <td className="px-4 py-4"><span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-blue-100 uppercase whitespace-nowrap tracking-wider">{s.campus}</span></td>
                        <td className="px-4 py-4"><span className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-purple-100 uppercase whitespace-nowrap tracking-wider">{s.educationLevel}</span></td>
                        <td className="px-4 py-4"><div className="flex flex-col"><span className="text-gray-950 font-black text-[11px] leading-tight block max-w-[180px] uppercase">{s.choice1Major}</span><span className="text-gray-400 text-[9px] font-bold uppercase mt-0.5">Mã nghề: {s.choice1Specialty}</span></div></td>
                        <td className="px-4 py-4 text-center"><span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest whitespace-nowrap ${getStatusStyle(s.status)}`}>{s.status}</span></td>
                        <td className="px-4 py-4 text-center"><div className="flex justify-center gap-1.5"><button onClick={() => handleViewDetail(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all" title="Xem chi tiết"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button><button onClick={() => handleViewDetail(s)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all" title="Sửa hồ sơ"><EditIcon /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Hiển thị {submissions.length} / {totalCount} hồ sơ
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="px-4 py-2 rounded-lg bg-white border border-blue-100 text-blue-900 text-xs font-black">
                    Trang {pagination.page} / {Math.ceil(totalCount / pagination.pageSize) || 1}
                  </div>
                  <button 
                    disabled={pagination.page >= Math.ceil(totalCount / pagination.pageSize)}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'tuition' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-blue-950 tracking-tight">Quản lý học phí</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Theo dõi tình trạng nộp học phí của các thí sinh trúng tuyển</p>
              </div>
            </header>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 min-w-[120px]"><span className="text-[10px] text-emerald-600 font-extrabold uppercase block mb-0.5">Trúng tuyển</span><span className="text-xl font-black text-emerald-900">{approvedSubmissions.length}</span></div>
              <button 
                onClick={handleSyncTuitionFromConfig} 
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Đang đồng bộ...' : 'Đồng bộ từ cấu hình'}
              </button>
              <button onClick={handleExportTuitionExcel} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Xuất Excel</button>
              <div className="flex-1 relative"><input type="text" placeholder="Tìm tên, SĐT, CCCD..." className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                  <tr><th className="px-2 py-4 w-[110px]">Mã số (CCCD)</th><th className="px-4 py-4">Họ và tên</th><th className="px-4 py-4">SĐT</th><th className="px-4 py-4 min-w-[140px]">Nghề đào tạo</th><th className="px-4 py-4 text-center">Học phí</th><th className="px-4 py-4 text-center">BH Y Tế</th><th className="px-4 py-4 text-center">BH Toàn Diện</th><th className="px-4 py-4 text-center">Đồng Phục</th><th className="px-2 py-4 text-center w-[110px]">Đã nộp</th><th className="px-4 py-4 text-center">Còn lại</th><th className="px-4 py-4 text-center">In Hóa đơn</th><th className="px-4 py-4 text-center">Ghi chú</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isTuitionLoading ? (
                    <tr><td colSpan={12} className="px-6 py-10 text-center text-blue-600 font-bold italic animate-pulse">Đang nạp toàn bộ danh sách trúng tuyển...</td></tr>
                  ) : approvedSubmissions.length === 0 ? (
                    <tr><td colSpan={12} className="px-6 py-10 text-center text-gray-400 italic font-medium bg-gray-50/20">Chưa có thí sinh trúng tuyển nào trong danh sách lọc hiện tại.</td></tr>
                  ) : (
                    paginatedTuitionSubmissions.map(s => {
                      const hVal = s.isHealthSelected ? (s.healthAmount || 0) : 0;
                      const cVal = s.isComprehensiveSelected ? (s.comprehensiveAmount || 0) : 0;
                      const uVal = s.isUniformSelected ? (s.uniformAmount || 0) : 0;
                      const totalRequired = (s.tuitionAmount || 0) + hVal + cVal + uVal;
                      const remaining = totalRequired - (s.tuitionPaidAmount || 0);

                      const handleFeeSelect = async (field: 'isHealthSelected' | 'isComprehensiveSelected' | 'isUniformSelected', checked: boolean) => {
                        try {
                          // Update local state first for instant feedback
                          setTuitionSubmissions(prev => prev.map(item => item.id === s.id ? { ...item, [field]: checked } : item));
                          await api.updateRegistration(s.docId, { [field]: checked });
                        } catch (error) {
                          alert("Lỗi khi cập nhật cấu hình phí");
                          // Revert on error
                          setTuitionSubmissions(prev => prev.map(item => item.id === s.id ? { ...item, [field]: !checked } : item));
                        }
                      };

                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-2 py-4 text-xs font-mono text-gray-400 break-all w-[110px] whitespace-nowrap">{s.idNumber}</td>
                          <td className="px-4 py-4 font-bold text-blue-900">{s.fullName}</td>
                          <td className="px-4 py-4 text-gray-600">{s.phone}</td>
                          <td className="px-4 py-4 font-medium text-gray-700 uppercase text-[11px] min-w-[140px]">{s.choice1Major}</td>
                          <td className="px-4 py-4 text-center font-bold text-gray-900">{(s.tuitionAmount || 0).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-4 text-center"><div className="flex flex-col items-center gap-1"><input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={s.isHealthSelected} onChange={(e) => handleFeeSelect('isHealthSelected', e.target.checked)} /><span className={`font-bold text-blue-600 ${!s.isHealthSelected && 'opacity-30'}`}>{(s.healthAmount || 0).toLocaleString('vi-VN')}</span></div></td>
                          <td className="px-4 py-4 text-center"><div className="flex flex-col items-center gap-1"><input type="checkbox" className="w-4 h-4 rounded text-orange-600 cursor-pointer" checked={s.isComprehensiveSelected} onChange={(e) => handleFeeSelect('isComprehensiveSelected', e.target.checked)} /><span className={`font-bold text-orange-600 ${!s.isComprehensiveSelected && 'opacity-30'}`}>{(s.comprehensiveAmount || 0).toLocaleString('vi-VN')}</span></div></td>
                          <td className="px-4 py-4 text-center"><div className="flex flex-col items-center gap-1"><input type="checkbox" className="w-4 h-4 rounded text-slate-600 cursor-pointer" checked={s.isUniformSelected} onChange={(e) => handleFeeSelect('isUniformSelected', e.target.checked)} /><span className={`font-bold text-slate-600 ${!s.isUniformSelected && 'opacity-30'}`}>{(s.uniformAmount || 0).toLocaleString('vi-VN')}</span></div></td>
                          <td className="px-2 py-4 text-center w-[110px]">
                            <TuitionPaidInput
                              key={`${s.id}-${s.tuitionPaidAmount}`}
                              initialValue={s.tuitionPaidAmount || 0}
                              totalRequired={totalRequired}
                              onUpdate={async (paid, status) => {
                                try {
                                  const now = new Date().toISOString();
                                  const collector = user.fullName || user.username;
                                  setTuitionSubmissions(prev => prev.map(item => item.id === s.id ? { ...item, tuitionPaidAmount: paid, tuitionStatus: status, collectorAccount: collector, collectedDate: now } : item));
                                  await api.updateRegistration(s.docId, { tuitionPaidAmount: paid, tuitionStatus: status, collectorAccount: collector, collectedDate: now });
                                } catch (err) {
                                  console.error(err);
                                  alert("Lỗi khi cập nhật số tiền đã nộp");
                                  fetchData(); // Rollback if necessary
                                }
                              }}
                            />
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-red-600">{(remaining > 0 ? remaining : 0).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-4 text-center"><button onClick={() => handlePrintInvoice(s)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100" title="In biên lai / Hóa đơn"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button></td>
                          <td className="px-4 py-4 text-center"><select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium outline-none" value={s.paymentMethod || ''} onChange={async (e) => {
                            const newMethod = e.target.value;
                            try {
                              const now = new Date().toISOString();
                              const collector = user.fullName || user.username;
                              setTuitionSubmissions(prev => prev.map(item => item.id === s.id ? { ...item, paymentMethod: newMethod, collectorAccount: collector, collectedDate: now } : item));
                              await api.updateRegistration(s.docId, { paymentMethod: newMethod, collectorAccount: collector, collectedDate: now });
                            } catch (err) {
                              alert("Lỗi khi lưu phương thức thanh toán");
                              fetchTuitionData();
                            }
                          }}><option value="">-- Chọn --</option><option value="Tiền mặt">Tiền mặt</option><option value="Chuyển khoản">Chuyển khoản</option></select></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {/* Tuition Pagination Controls */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Hiển thị {(tuitionPagination.page - 1) * tuitionPagination.pageSize + 1} - {Math.min(tuitionPagination.page * tuitionPagination.pageSize, approvedSubmissions.length)} / {approvedSubmissions.length} hồ sơ trúng tuyển
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={tuitionPagination.page <= 1}
                    onClick={() => setTuitionPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="px-4 py-2 rounded-lg bg-white border border-blue-100 text-emerald-900 text-xs font-black">
                    Trang {tuitionPagination.page} / {Math.ceil(approvedSubmissions.length / tuitionPagination.pageSize) || 1}
                  </div>
                  <button 
                    disabled={tuitionPagination.page >= Math.ceil(approvedSubmissions.length / tuitionPagination.pageSize)}
                    onClick={() => setTuitionPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'admission-templates' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-black text-blue-950 tracking-tight">Biên tập mẫu văn bản</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Biên tập nội dung Giấy triệu tập hoặc Biên lai học phí</p>
              </div>
            </header>
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 w-fit mb-6">
              <SubTabButton active={admissionSubTab === 'Hải Phòng'} onClick={() => setAdmissionSubTab('Hải Phòng')} label="Mẫu Hải Phòng" /><SubTabButton active={admissionSubTab === 'Nam Đồng'} onClick={() => setAdmissionSubTab('Nam Đồng')} label="Mẫu Nam Đồng" /><SubTabButton active={admissionSubTab === 'Đinh Nhu'} onClick={() => setAdmissionSubTab('Đinh Nhu')} label="Mẫu Đinh Nhu" /><SubTabButton active={admissionSubTab === 'Thu học phí'} onClick={() => setAdmissionSubTab('Thu học phí')} label="Mẫu thu học phí" />
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-blue-900 font-black uppercase text-xs tracking-widest border-b pb-2">Thông tin hiển thị trên văn bản</h4>
                  <div className="space-y-4">
                    <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Tiêu đề văn bản</label><input className="w-full bg-gray-50 border rounded-xl px-4 py-3 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500/20 outline-none" value={admissionTemplates[admissionSubTab].title} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].title = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">{admissionSubTab === 'Thu học phí' ? 'Số tiền bằng chữ (Mặc định)' : 'Ghi chú / Căn cứ'}</label><textarea rows={3} className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" value={admissionTemplates[admissionSubTab].basis} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].basis = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Tên đơn vị ban hành</label><input className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" value={admissionTemplates[admissionSubTab].announcer} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].announcer = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div>
                    {admissionSubTab !== 'Thu học phí' && (
                      <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Thời gian nhập học (Dành cho Giấy báo)</label><div className="grid grid-cols-4 gap-2"><div className="space-y-1"><input className="w-full bg-gray-50 border rounded-xl px-2 py-2 text-xs font-bold" placeholder="Giờ" value={admissionTemplates[admissionSubTab].admissionHour} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].admissionHour = e.target.value; saveTemplatesToStorage(newTemplates); }} /><p className="text-[8px] text-center text-gray-400 uppercase font-black">Giờ</p></div><div className="space-y-1"><input className="w-full bg-gray-50 border rounded-xl px-2 py-2 text-xs font-bold" placeholder="Ngày" value={admissionTemplates[admissionSubTab].admissionDay} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].admissionDay = e.target.value; saveTemplatesToStorage(newTemplates); }} /><p className="text-[8px] text-center text-gray-400 uppercase font-black">Ngày</p></div><div className="space-y-1"><input className="w-full bg-gray-50 border rounded-xl px-2 py-2 text-xs font-bold" placeholder="Tháng" value={admissionTemplates[admissionSubTab].admissionMonth} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].admissionMonth = e.target.value; saveTemplatesToStorage(newTemplates); }} /><p className="text-[8px] text-center text-gray-400 uppercase font-black">Tháng</p></div><div className="space-y-1"><input className="w-full bg-gray-50 border rounded-xl px-2 py-2 text-xs font-bold" placeholder="Năm" value={admissionTemplates[admissionSubTab].admissionYear} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].admissionYear = e.target.value; saveTemplatesToStorage(newTemplates); }} /><p className="text-[8px] text-center text-gray-400 uppercase font-black">Năm</p></div></div></div>
                    )}
                    <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Địa chỉ liên hệ / Thu phí</label><textarea rows={2} className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" value={admissionTemplates[admissionSubTab].location} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].location = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Hotline & Website</label><div className="flex gap-4"><input className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 text-xs" placeholder="Hotline" value={admissionTemplates[admissionSubTab].hotline} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].hotline = e.target.value; saveTemplatesToStorage(newTemplates); }} /><input className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 text-xs" placeholder="Website" value={admissionTemplates[admissionSubTab].website} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].website = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div></div>
                    <div className="flex gap-4"><div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Chức danh người ký</label><textarea rows={2} className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" value={admissionTemplates[admissionSubTab].footerTitle} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].footerTitle = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div><div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Họ tên người ký</label><input className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-xs font-bold" value={admissionTemplates[admissionSubTab].footerName} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].footerName = e.target.value; saveTemplatesToStorage(newTemplates); }} /></div></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-blue-900 font-black uppercase text-xs tracking-widest border-b pb-2">Hình ảnh & Tùy chọn</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Ảnh Mã QR / Dấu đỏ scan</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-white border rounded-lg flex items-center justify-center overflow-hidden shrink-0">{admissionTemplates[admissionSubTab].qrCodeImage ? (<img src={admissionTemplates[admissionSubTab].qrCodeImage!} className="w-full h-full object-contain" alt="QR Preview" />) : (<span className="text-[8px] text-gray-400 font-bold uppercase text-center px-1">Không ảnh</span>)}</div>
                        <div className="flex flex-col gap-2 flex-1"><label className="cursor-pointer bg-blue-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-800 transition-all">Tải lên ảnh mới<input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} /></label>{admissionTemplates[admissionSubTab].qrCodeImage && (<button onClick={() => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].qrCodeImage = null; saveTemplatesToStorage(newTemplates); }} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline">Xóa ảnh</button>)}</div>
                      </div>
                    </div>
                    {admissionSubTab !== 'Thu học phí' && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Danh sách hồ sơ cần mang theo:</p>
                        {admissionTemplates[admissionSubTab].requirements.map((req, idx) => (<div key={idx} className="flex gap-2"><input className="flex-1 bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/10 outline-none" value={req} onChange={(e) => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].requirements[idx] = e.target.value; saveTemplatesToStorage(newTemplates); }} /><button onClick={() => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].requirements.splice(idx, 1); saveTemplatesToStorage(newTemplates); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div>))}
                        <button onClick={() => { const newTemplates = { ...admissionTemplates }; newTemplates[admissionSubTab].requirements.push("Hồ sơ bổ sung..."); saveTemplatesToStorage(newTemplates); }} className="w-full py-2 border-2 border-dashed rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all">+ Thêm dòng hồ sơ</button>
                      </div>
                    )}
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between"><p className="text-[10px] text-gray-400 font-bold uppercase italic">* Dữ liệu được lưu trữ tập trung trên hệ thống Strapi.</p><div className="flex gap-3"><button onClick={handlePrintBlankTemplate} className="px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 text-xs">In mẫu thử</button><button onClick={handleSaveAdmissionTemplate} className="px-8 py-3 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-95 text-xs">Xác nhận lưu</button></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'tuition-config' ? (
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-black text-blue-950 tracking-tight">Cấu hình hệ thống</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Quản lý cơ sở, hệ đào tạo, định mức học phí, bảo hiểm và đồng phục</p>
              </div>
            </header>
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 w-fit mb-6">
              <SubTabButton active={tuitionSubTab === 'campuses'} onClick={() => setTuitionSubTab('campuses')} label="Cơ sở nhập học" /><SubTabButton active={tuitionSubTab === 'education-levels'} onClick={() => setTuitionSubTab('education-levels')} label="Hệ đào tạo" /><SubTabButton active={tuitionSubTab === 'majors'} onClick={() => setTuitionSubTab('majors')} label="Học phí ngành" /><SubTabButton active={tuitionSubTab === 'health'} onClick={() => setTuitionSubTab('health')} label="BH Y tế" /><SubTabButton active={tuitionSubTab === 'comprehensive'} onClick={() => setTuitionSubTab('comprehensive')} label="BH toàn diện" /><SubTabButton active={tuitionSubTab === 'uniform'} onClick={() => setTuitionSubTab('uniform')} label="Đồng phục" />
            </div>
            {tuitionSubTab === 'campuses' ? (
              <>
                <div className="flex justify-end mb-4"><button onClick={() => { setEditingCampus(null); setIsCampusModalOpen(true); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm cơ sở mới</button></div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-8 py-4">Mã cơ sở</th><th className="px-8 py-4">Tên cơ sở</th><th className="px-8 py-4">Địa chỉ liên hệ</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {campusConfigs.length === 0 ? (<tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình cơ sở nào</td></tr>) : (
                        campusConfigs.map(config => (
                          <tr key={config.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5 text-gray-900 font-mono text-xs font-bold uppercase">{config.code}</td>
                            <td className="px-8 py-5 text-gray-900 font-bold uppercase">{config.name}</td>
                            <td className="px-8 py-5 text-gray-600 italic font-medium">{config.address}</td>
                            <td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingCampus(config); setIsCampusModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteCampus(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : tuitionSubTab === 'education-levels' ? (
              <>
                <div className="flex justify-end mb-4"><button onClick={() => { setEditingEducationLevel(null); setIsEducationLevelModalOpen(true); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm hệ đào tạo</button></div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-8 py-4">Mã hệ</th><th className="px-8 py-4">Tên hệ đào tạo</th><th className="px-8 py-4">Mô tả chi tiết</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {educationLevelConfigs.length === 0 ? (<tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình hệ đào tạo nào</td></tr>) : (
                        educationLevelConfigs.map(config => (
                          <tr key={config.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5 text-gray-900 font-mono text-xs font-bold uppercase">{config.code}</td>
                            <td className="px-8 py-5 text-gray-900 font-bold uppercase">{config.name}</td>
                            <td className="px-8 py-5 text-gray-600 font-medium">{config.description}</td>
                            <td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingEducationLevel(config); setIsEducationLevelModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteEducationLevel(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : tuitionSubTab === 'majors' ? (
              <>
                <div className="flex justify-end mb-4 gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
                  <button onClick={handleDownloadTemplate} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Tải file mẫu</button>
                  <button onClick={handleExcelImport} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>Nhập từ Excel</button>
                  <button onClick={() => { setEditingTuition(null); setIsTuitionModalOpen(true); }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm mức học phí</button>
                </div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-6 py-4">Mã nghề</th><th className="px-6 py-4">Tên nghề đào tạo</th><th className="px-6 py-4">Cơ sở</th><th className="px-6 py-4">Hệ</th><th className="px-6 py-4 text-center">Học phí</th><th className="px-6 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">{tuitionConfigs.length === 0 ? (<tr><td colSpan={6} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình học phí nào</td></tr>) : (tuitionConfigs.map(config => (<tr key={config.id} className="hover:bg-gray-50/50 transition-colors"><td className="px-6 py-5 font-mono text-xs text-blue-600 font-bold">{config.code}</td><td className="px-6 py-5 text-gray-900 font-bold text-sm uppercase">{config.name}</td><td className="px-6 py-5"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-indigo-100">{config.campus}</span></td><td className="px-6 py-5"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-blue-100">{config.educationLevel}</span></td><td className="px-6 py-5 text-center"><span className="text-emerald-600 font-black text-base">{config.amount.toLocaleString('vi-VN')}</span><span className="text-[10px] text-gray-400 font-bold ml-1">đ</span></td><td className="px-6 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingTuition(config); setIsTuitionModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteTuition(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td></tr>)))}</tbody>
                  </table>
                </div>
              </>
            ) : tuitionSubTab === 'health' ? (
              <>
                <div className="flex justify-end mb-4"><button onClick={() => { setEditingHealth(null); setIsHealthModalOpen(true); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm mức BHYT</button></div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-8 py-4">Mã BH</th><th className="px-8 py-4">Mô tả / Thời hạn</th><th className="px-8 py-4 text-center">Số tiền (VNĐ)</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{healthConfigs.length === 0 ? (<tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình BHYT nào</td></tr>) : (healthConfigs.map(config => (<tr key={config.id} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-5 font-mono text-xs text-blue-600 font-bold">{config.code}</td><td className="px-8 py-5 text-gray-700 font-medium">{config.description}</td><td className="px-8 py-5 text-center"><span className="text-blue-600 font-black text-base">{config.amount.toLocaleString('vi-VN')}</span><span className="text-[10px] text-gray-400 font-bold ml-1">đ</span></td><td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingHealth(config); setIsHealthModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteHealth(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td></tr>)))}</tbody>
                  </table>
                </div>
              </>
            ) : tuitionSubTab === 'comprehensive' ? (
              <>
                <div className="flex justify-end mb-4"><button onClick={() => { setEditingComprehensive(null); setIsComprehensiveModalOpen(true); }} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm mức BH toàn diện</button></div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-8 py-4">Mã BH</th><th className="px-8 py-4">Mô tả / Thời hạn</th><th className="px-8 py-4 text-center">Số tiền (VNĐ)</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{comprehensiveConfigs.length === 0 ? (<tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình BH toàn diện nào</td></tr>) : (comprehensiveConfigs.map(config => (<tr key={config.id} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-5 font-mono text-xs text-orange-600 font-bold">{config.code}</td><td className="px-8 py-5 text-gray-700 font-medium">{config.description}</td><td className="px-8 py-5 text-center"><span className="text-orange-600 font-black text-base">{config.amount.toLocaleString('vi-VN')}</span><span className="text-[10px] text-gray-400 font-bold ml-1">đ</span></td><td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingComprehensive(config); setIsComprehensiveModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteComprehensive(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td></tr>)))}</tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-end mb-4"><button onClick={() => { setEditingUniform(null); setIsUniformModalOpen(true); }} className="px-6 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-700/20 hover:bg-slate-800 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm mức đồng phục</button></div>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                      <tr><th className="px-8 py-4">Mã ĐP</th><th className="px-8 py-4">Mô tả bộ đồng phục</th><th className="px-8 py-4 text-center">Số tiền (VNĐ)</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">{uniformConfigs.length === 0 ? (<tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Chưa có cấu hình đồng phục nào</td></tr>) : (uniformConfigs.map(config => (<tr key={config.id} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-5 font-mono text-xs text-slate-600 font-bold">{config.code}</td><td className="px-8 py-5 text-gray-700 font-medium">{config.description}</td><td className="px-8 py-5 text-center"><span className="text-slate-800 font-black text-base">{config.amount.toLocaleString('vi-VN')}</span><span className="text-[10px] text-gray-400 font-bold ml-1">đ</span></td><td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingUniform(config); setIsUniformModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><EditIcon /></button><button onClick={() => handleDeleteUniform(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><DeleteIcon /></button></div></td></tr>)))}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          isAdmin && (
            <div className="max-w-7xl mx-auto space-y-6">
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black text-blue-950 tracking-tight">Phân quyền người dùng</h2>
                  <p className="text-gray-500 text-sm font-medium mt-1">Quản lý tài khoản cán bộ và quyền truy cập hệ thống</p>
                </div>
                <button onClick={() => { setEditingUser(null); setSelectedRole('Cán bộ tiếp nhận'); setIsUserModalOpen(true); }} className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Thêm người dùng</button>
              </header>
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                    <tr><th className="px-8 py-4">Họ và tên</th><th className="px-8 py-4">Tên đăng nhập</th><th className="px-8 py-4">Vai trò</th><th className="px-8 py-4 text-center">Trạng thái</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {users.map(userItem => (<tr key={userItem.id} className="hover:bg-gray-50 transition-colors"><td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">{userItem.fullName.charAt(0)}</div><div><p className="font-bold text-blue-900">{userItem.fullName}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID: #{userItem.id}</p></div></div></td><td className="px-8 py-5 text-gray-600 font-medium">{userItem.username}</td><td className="px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${userItem.role === 'Quản trị viên' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{userItem.role}</span></td><td className="px-8 py-5 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${userItem.status === 'Hoạt động' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{userItem.status}</span></td><td className="px-8 py-5 text-center"><div className="flex justify-center gap-4"><button onClick={() => { setEditingUser(userItem); setSelectedRole(userItem.role); setIsUserModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><EditIcon /></button><button onClick={() => handleToggleStaffStatus(userItem)} className={`p-2 rounded-lg transition-all ${userItem.status === 'Hoạt động' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={userItem.status === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa'}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button><button onClick={() => handleDeleteStaff(userItem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa tài khoản"><DeleteIcon /></button></div></td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-900 p-6 flex justify-between items-center"><h3 className="text-white font-black uppercase tracking-widest text-sm">{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3><button onClick={() => setIsUserModalOpen(false)} className="text-white/60 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-4" onSubmit={handleSaveStaff}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Họ và tên</label><input name="fullName" defaultValue={editingUser?.fullName} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-bold text-blue-900" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tên đăng nhập</label><input name="username" defaultValue={editingUser?.username} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-medium" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mật khẩu</label><input name="password" type="password" required={!editingUser} placeholder={editingUser ? "•••••••• (Bỏ trống nếu không đổi)" : "••••••••"} className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-medium" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tên cơ sở {selectedRole !== 'Quản trị viên' && <span className="text-red-500">*</span>}</label><select name="campus" required={selectedRole !== 'Quản trị viên'} defaultValue={editingUser?.campus || ''} className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"><option value="">-- Chọn cơ sở --</option>{CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Vai trò hệ thống</label><select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)} className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"><option value="Quản trị viên">Quản trị viên</option><option value="Cán bộ tiếp nhận">Cán bộ tiếp nhận</option><option value="Cán bộ duyệt hồ sơ">Cán bộ duyệt hồ sơ</option><option value="Kế toán">Kế toán</option></select></div>
              <div className="pt-4"><button type="submit" className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Lưu thông tin</button></div>
            </form>
          </div>
        </div>
      )}

      {isCampusModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingCampus ? 'Cập nhật cơ sở' : 'Thêm cơ sở mới'}</h3><button onClick={() => setIsCampusModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveCampus}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã cơ sở</label><input name="code" defaultValue={editingCampus?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-mono text-sm" placeholder="Ví dụ: HP, ND, DN..." /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên cơ sở</label><input name="name" defaultValue={editingCampus?.name} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-bold" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ</label><textarea name="address" rows={2} defaultValue={editingCampus?.address} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none resize-none" /></div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase">Lưu cơ sở</button>
            </form>
          </div>
        </div>
      )}

      {isEducationLevelModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingEducationLevel ? 'Cập nhật hệ đào tạo' : 'Thêm hệ đào tạo mới'}</h3><button onClick={() => setIsEducationLevelModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveEducationLevel}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã hệ đào tạo</label><input name="code" defaultValue={editingEducationLevel?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-mono text-sm" placeholder="Ví dụ: CD, TC, 9+..." /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên hệ đào tạo</label><input name="name" defaultValue={editingEducationLevel?.name} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none font-bold" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả</label><textarea name="description" rows={2} defaultValue={editingEducationLevel?.description} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none resize-none" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase">Lưu hệ đào tạo</button>
            </form>
          </div>
        </div>
      )}

      {isTuitionModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingTuition ? 'Cập nhật học phí' : 'Thêm học phí mới'}</h3><button onClick={() => setIsTuitionModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveTuition}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã nghề <span className="text-red-500">*</span></label><input name="code" defaultValue={editingTuition?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" placeholder="Mã nghề tự động" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên nghề</label><input name="name" defaultValue={editingTuition?.name} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cơ sở</label><select name="campus" defaultValue={editingTuition?.campus || (campusConfigs.length > 0 ? campusConfigs[0].name : '')} className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none">{campusConfigs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hệ đào tạo</label><select name="educationLevel" defaultValue={editingTuition?.educationLevel || (educationLevelConfigs.length > 0 ? educationLevelConfigs[0].name : '')} className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none">{educationLevelConfigs.map(el => <option key={el.id} value={el.name}>{el.name}</option>)}</select></div></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số tiền</label><input name="amount" type="number" defaultValue={editingTuition?.amount} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase">Lưu cấu hình</button>
            </form>
          </div>
        </div>
      )}

      {isHealthModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingHealth ? 'Cập nhật BHYT' : 'Thêm mức BHYT mới'}</h3><button onClick={() => setIsHealthModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveHealth}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã bảo hiểm</label><input name="code" defaultValue={editingHealth?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả / Thời hạn</label><input name="description" defaultValue={editingHealth?.description} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số tiền</label><input name="amount" type="number" defaultValue={editingHealth?.amount} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase">Lưu cấu hình</button>
            </form>
          </div>
        </div>
      )}

      {isComprehensiveModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-orange-600 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingComprehensive ? 'Cập nhật BH toàn diện' : 'Thêm mức BH toàn diện mới'}</h3><button onClick={() => setIsComprehensiveModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveComprehensive}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã bảo hiểm</label><input name="code" defaultValue={editingComprehensive?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả / Thời hạn</label><input name="description" defaultValue={editingComprehensive?.description} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số tiền</label><input name="amount" type="number" defaultValue={editingComprehensive?.amount} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase">Lưu cấu hình</button>
            </form>
          </div>
        </div>
      )}

      {isUniformModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-700 p-6 flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest text-sm">{editingUniform ? 'Cập nhật đồng phục' : 'Thêm mức đồng phục mới'}</h3><button onClick={() => setIsUniformModalOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form className="p-8 space-y-6" onSubmit={handleSaveUniform}>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã đồng phục</label><input name="code" defaultValue={editingUniform?.code} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</label><input name="description" defaultValue={editingUniform?.description} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số tiền</label><input name="amount" type="number" defaultValue={editingUniform?.amount} required className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none" /></div>
              <button type="submit" className="w-full bg-slate-700 text-white py-4 rounded-2xl font-black uppercase">Lưu cấu hình</button>
            </form>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-7xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="bg-blue-900 px-10 py-3 flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-[1.25rem] flex items-center justify-center border border-white/20"><svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                <div><h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedSubmission.fullName}</h3><div className="flex items-center gap-3 mt-2"><span className="text-blue-300 font-bold text-xs uppercase tracking-widest">Mã hồ sơ: {selectedSubmission.idNumber}</span><span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(selectedSubmission.status)}`}>{selectedSubmission.status}</span></div></div>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="w-12 h-12 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                    <h4 className="text-blue-900 font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4">1. Thông tin cá nhân & Liên hệ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4"><DetailItem label="Giới tính" value={selectedSubmission.gender} /><DetailItem label="Ngày sinh" value={selectedSubmission.dob ? new Date(selectedSubmission.dob).toLocaleDateString('vi-VN') : '--'} /><DetailItem label="Nơi sinh" value={selectedSubmission.pob} /><DetailItem label="Dân tộc" value={selectedSubmission.ethnicity} /><DetailItem label="Ngày cấp CCCD" value={selectedSubmission.issueDate ? new Date(selectedSubmission.issueDate).toLocaleDateString('vi-VN') : '--'} /><DetailItem label="Nơi cấp" value={selectedSubmission.issuePlace} colSpan={2} /><DetailItem label="Số điện thoại" value={selectedSubmission.phone} highlight /><DetailItem label="Email" value={selectedSubmission.email} colSpan={2} /><DetailItem label="Họ tên phụ huynh" value={selectedSubmission.parentName} /><DetailItem label="SĐT phụ huynh" value={selectedSubmission.parentPhone} /></div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"><h4 className="text-blue-900 font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4">2. Địa chỉ thường trú (VNeID)</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DetailItem label="Tỉnh / Thành phố" value={selectedSubmission.province} /><DetailItem label="Quận / Huyện, Xã / Phường" value={selectedSubmission.district} /><DetailItem label="Số nhà, đường, xóm" value={selectedSubmission.addressDetails} /></div></div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"><h4 className="text-blue-900 font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4">3. Thông tin gửi giấy báo kết quả</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DetailItem label="Người nhận" value={selectedSubmission.recipient} /><DetailItem label="Địa chỉ nhận" value={selectedSubmission.deliveryAddress} />{selectedSubmission.deliveryAddress === AddressType.OTHER && <DetailItem label="Địa chỉ chi tiết" value={selectedSubmission.deliveryAddressDetails} colSpan={2} />}</div></div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"><h4 className="text-blue-900 font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4">4. Nguyện vọng & Học vấn</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4"><DetailItem label="Cơ sở nhập học" value={selectedSubmission.campus} highlight /><DetailItem label="Hệ đào tạo" value={selectedSubmission.educationLevel} highlight /><DetailItem label="Năm tốt nghiệp" value={selectedSubmission.gradYear} /><DetailItem label="Trường tốt nghiệp" value={selectedSubmission.gradSchool} /><DetailItem label="Nguyện vọng 1" value={selectedSubmission.choice1Major} colSpan={2} highlight /><DetailItem label="Mã nghề" value={selectedSubmission.choice1Specialty} /><DetailItem label="NV 2" value={selectedSubmission.choice2Major} /></div></div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"><h4 className="text-blue-900 font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-900 pl-4">5. Bảng điểm học tập (Lớp cuối cấp)</h4><div className="grid grid-cols-5 md:grid-cols-10 gap-2 pt-2">{SUBJECTS.map(sub => (<div key={sub} className="flex flex-col items-center bg-gray-50 rounded-xl p-2 border border-gray-100"><span className="text-[8px] font-black text-gray-400 uppercase mb-1">{sub}</span><span className="text-xs font-black text-blue-900">{selectedSubmission.grades?.[sub] || '-'}</span></div>))}</div></div>
                </div>
                <div className="space-y-10">
                  <div className="bg-blue-900 p-8 rounded-[2rem] shadow-xl space-y-6"><h4 className="text-white font-black uppercase text-xs tracking-[0.2em] border-l-4 border-blue-300 pl-4">6. Hồ sơ đính kèm</h4><div className="grid grid-cols-1 gap-6"><FilePreviewItem label="Mặt trước CCCD" src={selectedSubmission.frontId} /><FilePreviewItem label="Mặt sau CCCD" src={selectedSubmission.backId} /><FilePreviewItem label="Bằng tốt nghiệp / Chứng nhận" src={selectedSubmission.diploma} /><FilePreviewItem label="Học bạ học tập" src={selectedSubmission.tempCert} /></div></div>
                  <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center gap-3"><div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kiểm soát viên</p><p className="text-xs text-emerald-800 font-bold mt-1">Hồ sơ đầy đủ & hợp lệ</p></div></div>
                </div>
              </div>
            </div>
            <div className="bg-white px-10 py-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 shrink-0">
              <div className="flex gap-2">
                <button onClick={() => updateCurrentSubmissionStatus(SubmissionStatus.RECEIVED)} className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">Tiếp nhận</button>
                {user?.role !== 'Cán bộ tiếp nhận' && (
                  <>
                    <button onClick={() => updateCurrentSubmissionStatus(SubmissionStatus.LOCKED)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Khóa hồ sơ</button>
                    <button onClick={async () => {
                      const newPass = Math.random().toString(36).slice(-6).toUpperCase();
                      try {
                        await api.updateRegistration(selectedSubmission.docId, { password: newPass });
                        alert(`Mật khẩu mới cho hồ sơ ${selectedSubmission.idNumber} là: ${newPass}`);
                        fetchData();
                      } catch (err) { alert("Lỗi cấp lại mật khẩu"); }
                    }} className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-200 transition-all">Cấp lại Mật khẩu</button>
                  </>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setSelectedSubmission(null)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-600">Hủy bỏ</button>
                {user?.role !== 'Cán bộ tiếp nhận' && <button onClick={handlePrintSubmission} className="px-10 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all">Duyệt & In giấy báo</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
