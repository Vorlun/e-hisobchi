import React from 'react';

interface LogoProps {
  /** sm: header/sidebar, md: default, lg: login/hero */
  size?: 'sm' | 'md' | 'lg';
  /** full: icon + text (logo_full.png), icon: icon only (logo.png) for collapsed/mobile */
  variant?: 'full' | 'icon';
}

const sizeHeight = { sm: 32, md: 36, lg: 40 } as const;

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const height = sizeHeight[size];

  if (variant === 'icon') {
    return (
      <img
        src="/logo.png"
        alt="e-Hisobchi logo"
        className="w-auto object-contain"
        style={{ height: `${height}px`, width: 'auto' }}
        width={height}
        height={height}
      />
    );
  }

  return (
    <img
      src="/logo_full.png"
      alt="e-Hisobchi"
      className="w-auto max-w-[200px] object-contain object-left"
      style={{ height: `${Math.min(height, 40)}px` }}
      width={200}
      height={40}
    />
  );
}
