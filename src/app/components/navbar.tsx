import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../store/authStore';

export function Navbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.fullName ?? 'User';
  const displayEmail = user?.email ?? '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <label htmlFor="navbar-search" className="sr-only">Search transactions and categories</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
          <input
            id="navbar-search"
            type="search"
            placeholder="Search transactions, categories..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
            aria-label="Search transactions and categories"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden />
          {notificationsCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full"
              aria-hidden
            />
          )}
        </button>

        <div className="relative pl-4 border-l border-[#E2E8F0]" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-3 rounded-lg p-1 hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Profile menu"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-[#0F172A]">{displayName}</p>
              <p className="text-xs text-[#64748B]">{displayEmail || '—'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {initial}
            </div>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 py-1 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-50"
              role="menu"
            >
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                <User className="w-4 h-4 text-[#64748B]" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                <Settings className="w-4 h-4 text-[#64748B]" />
                Settings
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 text-[#64748B]" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
