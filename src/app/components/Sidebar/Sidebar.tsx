import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Tag,
  Repeat,
  PieChart,
  Landmark,
  Users,
  BarChart2,
  CircleDollarSign,
  Monitor,
  User,
  ChevronLeft,
  Moon,
  Sun,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Logo } from '../logo';
import { SidebarItem } from './SidebarItem';
import { UserCard } from './UserCard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../../../store/languageStore';
import { useTheme } from '../../../store/themeStore';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Mobile: sidebar is open as overlay */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const MENU_CONFIG = [
  { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard', matchPaths: ['/'] },
  { path: '/accounts', icon: Wallet, key: 'accounts' },
  { path: '/cards', icon: CreditCard, key: 'cards' },
  { path: '/transactions', icon: ArrowLeftRight, key: 'transactions' },
  { path: '/categories', icon: Tag, key: 'categories' },
  { path: '/transfer', icon: Repeat, key: 'transfers' },
  { path: '/budget', icon: PieChart, key: 'budgets' },
  { path: '/debts', icon: Landmark, key: 'debts' },
  { path: '/family', icon: Users, key: 'family' },
  { path: '/statistics', icon: BarChart2, key: 'statistics' },
  { path: '/currency', icon: CircleDollarSign, key: 'currency' },
  { path: '/devices', icon: Monitor, key: 'devices' },
  { path: '/profile', icon: User, key: 'profile' },
  { path: '/smart', icon: Sparkles, key: 'smart' },
  { path: '/settings', icon: Settings, key: 'settings' },
];

export function Sidebar({ collapsed = false, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const menuItems = useMemo(
    () =>
      MENU_CONFIG.map((item) => ({
        ...item,
        label: t(item.key),
      })),
    [t]
  );

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
        <Logo size="sm" variant="icon" />
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] p-2 rounded-lg transition-all"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      <UserCard collapsed={collapsed} />

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Main navigation">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            matchPaths={item.matchPaths}
          />
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-[#E2E8F0]">
        <div className="p-4 flex items-center justify-between gap-2">
          {!collapsed && (
            <span className="text-xs font-medium text-[#64748B]">Theme</span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" aria-hidden />
            ) : (
              <Moon className="w-5 h-5" aria-hidden />
            )}
          </button>
        </div>
        <LanguageSwitcher collapsed={collapsed} />
      </div>
    </>
  );

  const baseClasses = `bg-white border-r border-[#E2E8F0] transition-all duration-300 flex flex-col ${
    collapsed ? 'w-20' : 'w-64'
  }`;

  if (mobileOpen !== undefined && onMobileClose) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
            onKeyDown={(e) => e.key === 'Escape' && onMobileClose()}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}
        <aside
          className={`fixed top-0 left-0 h-full z-50 lg:relative lg:flex ${baseClasses} ${
            mobileOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return <aside className={baseClasses}>{sidebarContent}</aside>;
}
