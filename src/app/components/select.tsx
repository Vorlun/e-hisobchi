import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', id: idProp, ...props }: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm mb-2 text-[#0F172A]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
