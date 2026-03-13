import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const heightClass =
    size === 'sm'
      ? 'h-7 sm:h-8 lg:h-9'
      : size === 'lg'
        ? 'h-8 sm:h-9 lg:h-10'
        : 'h-7 sm:h-8 lg:h-9';

  if (variant === 'icon') {
    return (
      <img
        src="/logo.png"
        alt="e-Hisobchi logo"
        className={`${heightClass} w-auto object-contain`}
      />
    );
  }

  return (
    <img
      src="/logo_full.png"
      alt="e-Hisobchi"
      className={`${heightClass} w-auto max-w-[200px] object-contain object-left`}
    />
  );
}
