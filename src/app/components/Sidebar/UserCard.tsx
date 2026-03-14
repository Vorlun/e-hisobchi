import React from 'react';
import { useAuth } from '../../../store/authStore';

interface UserCardProps {
  collapsed?: boolean;
}

export function UserCard({ collapsed }: UserCardProps) {
  const { user } = useAuth();
  const displayName = user?.fullName ?? 'User';
  const displayEmail = user?.email ?? '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  if (collapsed) {
    return (
      <div className="p-2 flex justify-center border-b border-[#E2E8F0]">
        <div
          className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-semibold text-lg shrink-0"
          title={displayName}
          aria-hidden
        >
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-[#E2E8F0]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-semibold text-lg shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#0F172A] truncate">{displayName}</p>
          <p className="text-xs text-[#64748B] truncate">{displayEmail || '—'}</p>
        </div>
      </div>
    </div>
  );
}
