import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export function Navbar() {
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
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full" aria-hidden />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F0]">
          <div className="text-right">
            <p className="text-sm font-medium text-[#0F172A]">John Doe</p>
            <p className="text-xs text-[#64748B]">john@example.com</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
