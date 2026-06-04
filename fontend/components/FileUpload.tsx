import React, { useState } from 'react';

interface FileUploadProps {
  label: string;
  required?: boolean;
  placeholderImage: string;
  helperText?: string;
  onFileChange?: (url: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, required, placeholderImage, helperText, onFileChange }) => {
  const [fileName, setFileName] = useState('Không có tệp nào được chọn');
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Giới hạn 5MB
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
        e.target.value = '';
        return;
      }

      setFileName(file.name);
      setIsUploading(true);

      // Hiển thị preview cục bộ ngay lập tức
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      try {
        // Tạo form data để upload
        const formData = new FormData();
        formData.append('files', file);

        // Luôn dùng relative path để đi qua nginx proxy
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload thất bại: ${res.status}`);

        const data = await res.json();
        const uploadedFile = Array.isArray(data) ? data[0] : data;

        // URL luôn là relative (ví dụ: /uploads/abc.jpg)
        const fileUrl = uploadedFile.url.startsWith('http')
          ? uploadedFile.url
          : uploadedFile.url;  // giữ nguyên relative path

        if (onFileChange) onFileChange(fileUrl);
      } catch (err) {
        console.error('Upload lỗi:', err);
        alert('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
        setPreview(null);
        setFileName('Không có tệp nào được chọn');
        if (onFileChange) onFileChange(null);
        e.target.value = '';
      } finally {
        setIsUploading(false);
      }
    } else {
      setPreview(null);
      setFileName('Không có tệp nào được chọn');
      if (onFileChange) onFileChange(null);
    }
  };

  // Xác định src hiển thị — hỗ trợ cả URL và base64 cũ
  const displaySrc = preview || placeholderImage || undefined;

  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <p className="text-sm font-semibold text-gray-800 min-h-[2.5rem] flex items-center justify-center">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </p>

      <div className="w-full h-40 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group">
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-500">
            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs font-bold">Đang tải lên...</span>
          </div>
        ) : (
          <>
            <img
              src={displaySrc}
              alt={label}
              className={`w-full h-full object-contain ${!preview ? 'opacity-50 grayscale' : ''}`}
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-1 rounded">Xem trước</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 w-full">
        <label className={`cursor-pointer bg-white border border-gray-300 px-3 py-1 text-xs rounded hover:bg-gray-50 transition-colors whitespace-nowrap ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? 'Đang tải...' : 'Chọn tệp'}
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
        </label>
        <span className="text-[10px] text-gray-500 truncate text-left flex-1" title={fileName}>
          {fileName}
        </span>
      </div>

      {helperText && (
        <p className="text-[10px] text-red-500 font-bold leading-tight mt-1 text-center italic whitespace-pre-line">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
