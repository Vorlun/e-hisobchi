import React from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { User } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../store/authStore';

export default function Profile() {
  const { user } = useAuth();
  const displayName = user?.fullName ?? 'User';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const email = user?.email ?? '';
  const phone = user?.phoneNumber ?? '';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Profil</h1>
        <p className="text-[#64748B] mt-1">Your account information</p>
      </div>
      <Card className="p-6 max-w-lg">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full bg-[#1E40AF] text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#0F172A] text-lg truncate">{displayName}</p>
            {email && (
              <p className="text-sm text-[#64748B] truncate" title={email}>
                {email}
              </p>
            )}
            {phone && (
              <p className="text-sm text-[#64748B] truncate" title={phone}>
                {phone}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
          <Link to="/settings">
            <Button variant="outline" className="w-full sm:w-auto">
              <User className="w-4 h-4 mr-2 inline" />
              Account settings
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
