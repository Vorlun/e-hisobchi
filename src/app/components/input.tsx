import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id: idProp, ...props }: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm mb-2 text-[#0F172A]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all ${error ? 'border-[#DC2626]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}
