import React from 'react';
import { Link, useLocation } from 'react-router';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  /** Paths that should also match (e.g. '/' for dashboard) */
  matchPaths?: string[];
}

export function SidebarItem({ to, icon: Icon, label, collapsed, matchPaths }: SidebarItemProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const isActive =
    pathname === to || (matchPaths?.some((p) => pathname === p) ?? false) || (to === '/dashboard' && (pathname === '/' || pathname === '/dashboard'));

  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-l-4 ${
        isActive
          ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
          : 'border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}
