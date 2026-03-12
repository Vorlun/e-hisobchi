import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    success: 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20',
    warning: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
    info: 'bg-[#DBEAFE] text-[#1E40AF] border-[#1E40AF]/20',
    default: 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
