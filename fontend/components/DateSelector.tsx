
import React, { useState, useEffect, useMemo } from 'react';

interface DateSelectorProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({ value, onChange, required }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Sync with value prop (for initial load or external changes)
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parseInt(parts[1], 10).toString());
        setDay(parseInt(parts[2], 10).toString());
      }
    } else {
      // If parent clears the value, we clear local state too
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  const years = useMemo(() => {
    const end = new Date().getFullYear();
    const start = end - 60;
    const result = [];
    for (let i = end; i >= start; i--) result.push(i);
    return result;
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const days = useMemo(() => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [month, year]);

  const handleUpdate = (type: 'day' | 'month' | 'year', val: string) => {
    let d = day;
    let m = month;
    let y = year;

    if (type === 'day') { setDay(val); d = val; }
    if (type === 'month') { setMonth(val); m = val; }
    if (type === 'year') { setYear(val); y = val; }

    if (y && m && d) {
      const numY = Number(y);
      const numM = Number(m);
      const numD = Number(d);
      
      const lastDay = new Date(numY, numM, 0).getDate();
      const finalDay = numD > lastDay ? lastDay : numD;
      
      if (finalDay !== numD) {
        setDay(finalDay.toString());
        d = finalDay.toString();
      }
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      onChange(`${numY}-${pad(numM)}-${pad(Number(d))}`);
    } else {
      // Clear parent value if incomplete
      if (value) onChange('');
    }
  };

  const selectClasses = "w-full border-[1.5px] border-[#3b82f6] rounded-[0.8rem] px-2 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white appearance-none cursor-pointer font-medium text-gray-800";

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={day} 
          onChange={(e) => handleUpdate('day', e.target.value)}
        >
          <option value="">Ngày</option>
          {days.map(d => <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={month} 
          onChange={(e) => handleUpdate('month', e.target.value)}
        >
          <option value="">Tháng</option>
          {months.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative">
        <select 
          required={required}
          className={selectClasses} 
          value={year} 
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
