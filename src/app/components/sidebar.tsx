import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank, 
  TrendingUp, 
  Settings,
  ChevronLeft,
  Wallet,
  Target,
  Users,
  Sparkles
} from 'lucide-react';
import { Logo } from './logo';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Accounts', path: '/accounts' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: ArrowLeftRight, label: 'Transfer', path: '/transfer' },
  { icon: PiggyBank, label: 'Debts', path: '/debts' },
  { icon: Target, label: 'Budget', path: '/budget' },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: Sparkles, label: 'Smart Features', path: '/smart' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  return (
    <div 
      className={`bg-white border-r border-[#E2E8F0] transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <Logo size="sm" variant="icon" />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] p-2 rounded-lg transition-all"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#1E40AF] text-white'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}