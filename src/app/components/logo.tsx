import React from 'react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'h-8', text: 'text-lg' },
    md: { container: 'h-10', text: 'text-xl' },
    lg: { container: 'h-12', text: 'text-2xl' },
  };

  return (
    <div className={`flex items-center gap-2 ${sizes[size].container}`}>
      <div className="relative">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#1E40AF"/>
          <path d="M12 28V12H20C22.21 12 24 13.79 24 16C24 17.45 23.23 18.71 22.08 19.38C23.63 20.05 24.67 21.59 24.67 23.38C24.67 25.93 22.6 28 20.08 28H12ZM16 18H19C19.55 18 20 17.55 20 17C20 16.45 19.55 16 19 16H16V18ZM16 24H19.5C20.33 24 21 23.33 21 22.5C21 21.67 20.33 21 19.5 21H16V24Z" fill="white"/>
          <circle cx="28" cy="28" r="6" fill="#10B981"/>
          <path d="M28 25V31M25 28H31" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className={`font-bold text-[#0F172A] ${sizes[size].text}`}>
        e-hisobchi.uz
      </span>
    </div>
  );
}
