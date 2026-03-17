
import React, { useMemo } from 'react';

interface DateSelectorProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({ value, onChange, required }) => {
  // Parse current value
  const dateObj = value ? new Date(value) : null;
  const currentDay = dateObj ? dateObj.getDate() : '';
  const currentMonth = dateObj ? dateObj.getMonth() + 1 : '';
  const currentYear = dateObj ? dateObj.getFullYear() : '';

  const years = useMemo(() => {
    const end = new Date().getFullYear();
    const start = end - 60;
    const result = [];
    for (let i = end; i >= start; i--) result.push(i);
    return result;
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const days = useMemo(() => {
    if (!currentMonth || !currentYear) return Array.from({ length: 31 }, (_, i) => i + 1);
    const lastDay = new Date(Number(currentYear), Number(currentMonth), 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [currentMonth, currentYear]);

  const handleUpdate = (type: 'day' | 'month' | 'year', val: string) => {
    let d = currentDay;
    let m = currentMonth;
    let y = currentYear;

    if (type === 'day') d = Number(val);
    if (type === 'month') m = Number(val);
    if (type === 'year') y = Number(val);

    if (y && m && d) {
      // Ensure day is valid for the month
      const numY = Number(y);
      const numM = Number(m);
      const numD = Number(d);
      
      const lastDay = new Date(numY, numM, 0).getDate();
      const finalDay = numD > lastDay ? lastDay : numD;
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      onChange(`${numY}-${pad(numM)}-${pad(finalDay)}`);
    } else {
      // If incomplete, we can optionally clear it or just update the part
      // But for simplicity in this form, we wait until all are selected or just store partials (not ideal for type="date")
      // Since App.tsx uses "dob" as a string, let's just update what we can
    }
  };

  const selectClasses = "w-full border-[1.5px] border-[#3b82f6] rounded-[0.8rem] px-2 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none cursor-pointer font-medium text-gray-800";

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={currentDay} 
          onChange={(e) => handleUpdate('day', e.target.value)}
        >
          <option value="">Ngày</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={currentMonth} 
          onChange={(e) => handleUpdate('month', e.target.value)}
        >
          <option value="">Tháng</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={currentYear} 
          onChange={(e) => handleUpdate('year', e.target.value)}
        >
          <option value="">Năm</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
