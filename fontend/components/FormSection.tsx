
import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-8">
      <div className="bg-[#cc0000] py-3 px-6 mb-6 rounded-[0.6rem] shadow-lg">
        <h2 className="text-sm md:text-[15px] font-black text-white uppercase tracking-wider text-center">
          {title}
        </h2>
      </div>
      <div className="space-y-4 px-1">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
