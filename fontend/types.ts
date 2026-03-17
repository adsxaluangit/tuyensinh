
export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
  OTHER = 'Khác'
}

export enum RecipientType {
  CANDIDATE = 'Thí sinh',
  PARENT = 'Phụ huynh/người bảo trợ'
}

export enum AddressType {
  PERMANENT = 'Địa chỉ hộ khẩu thường trú',
  OTHER = 'Địa chỉ khác'
}

export enum SubmissionStatus {
  PENDING = 'Chờ Duyệt',
  RECEIVED = 'Đã tiếp nhận hồ sơ',
  APPROVED = 'Trúng tuyển',
  LOCKED = 'Đã khóa'
}

export enum TuitionStatus {
  UNPAID = 'Chưa nộp',
  PARTIAL = 'Nộp một phần',
  PAID = 'Đã nộp đủ'
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: 'Quản trị viên' | 'Cán bộ tiếp nhận' | 'Cán bộ duyệt hồ sơ' | 'Kế toán';
  campus?: string;
  status: 'Hoạt động' | 'Tạm khóa';
  lastLogin: string;
}

export interface FormData {
  id: string;
  submissionDate: string;
  fullName: string;
  dob: string;
  pob: string;
  gender: string;
  ethnicity: string;
  idNumber: string;
  issueDate: string;
  issuePlace: string;
  province: string;
  district: string;
  addressDetails: string;
  phone: string;
  email: string;
  parentName: string;
  parentPhone: string;
  campus: string;
  educationLevel: string;
  choice1Major: string;
  choice1Specialty: string;
  choice2Major: string;
  choice2Specialty: string;
  gradYear: string;
  gradSchool: string;
  gradProvince: string;
  gradDistrict: string;
  diplomaNumber: string;
  grades: Record<string, string>;
  recipient: RecipientType;
  deliveryAddress: AddressType;
  deliveryAddressDetails: string;
  status: SubmissionStatus;
  tuitionStatus?: TuitionStatus;
  tuitionAmount?: number;
  healthAmount?: number;
  comprehensiveAmount?: number;
  uniformAmount?: number;
  tuitionPaidAmount?: number;
  isHealthSelected?: boolean;
  isComprehensiveSelected?: boolean;
  isUniformSelected?: boolean;
  docSeq?: string; // Số thứ tự văn bản cấp khi in giấy báo
  files: {
    frontId: string | null;
    backId: string | null;
    diploma: string | null;
    tempCert: string | null;
  };
  password?: string;
  paymentMethod?: string;
  collectorAccount?: string;
  collectedDate?: string;
}
