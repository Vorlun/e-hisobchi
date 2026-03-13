import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const heightClass =
    size === 'sm'
      ? 'h-14 sm:h-16 lg:h-20'
      : size === 'lg'
        ? 'h-14 sm:h-16 lg:h-20'
        : 'h-14 sm:h-16 lg:h-20';

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
