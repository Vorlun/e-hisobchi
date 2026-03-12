import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#1E40AF] text-white hover:bg-[#1E3A8A] active:bg-[#1E3A8A]',
    secondary: 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1]',
    ghost: 'bg-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B]',
    outline: 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:shadow-md active:bg-[#F1F5F9]',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
