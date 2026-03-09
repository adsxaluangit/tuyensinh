
import React, { useState } from 'react';

interface FileUploadProps {
  label: string;
  required?: boolean;
  placeholderImage: string;
  onFileChange?: (base64: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, required, placeholderImage, onFileChange }) => {
  const [fileName, setFileName] = useState('Không có tệp nào được chọn');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        if (onFileChange) onFileChange(result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      if (onFileChange) onFileChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <p className="text-sm font-semibold text-gray-800 min-h-[2.5rem] flex items-center justify-center">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </p>

      <div className="w-full h-40 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group">
        <img
          src={preview || placeholderImage}
          alt={label}
          className={`w-full h-full object-contain ${!preview ? 'opacity-50 grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-1 rounded">Xem trước</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full">
        <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1 text-xs rounded hover:bg-gray-50 transition-colors whitespace-nowrap">
          Chọn tệp
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>
        <span className="text-[10px] text-gray-500 truncate text-left flex-1" title={fileName}>
          {fileName}
        </span>
      </div>
    </div>
  );
};

export default FileUpload;
