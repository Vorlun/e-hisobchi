import React, { useEffect } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Monitor, LogOut } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';

export default function Devices() {
  const { devices, loading, error, fetchDevices, logoutDevice, logoutOtherDevices } = useDevices();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Qurilmalar</h1>
          <p className="text-[#64748B] mt-1">Active sessions and devices</p>
        </div>
        {devices.length > 1 && (
          <Button
            variant="outline"
            onClick={() => logoutOtherDevices()}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout other devices
          </Button>
        )}
      </div>
      {loading && (
        <p className="text-sm text-[#64748B]" aria-busy>
          Loading devices…
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && devices.length === 0 && (
        <Card className="p-8 text-center">
          <Monitor className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" aria-hidden />
          <p className="text-[#64748B]">No active sessions.</p>
        </Card>
      )}
      {!loading && !error && devices.length > 0 && (
        <div className="space-y-4">
          {devices.map((d) => (
            <Card key={d.deviceId} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0F172A] truncate">{d.userAgent || 'Unknown device'}</p>
                <p className="text-sm text-[#64748B]">{d.ipAddress || '—'}</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Last active: {d.lastActiveAt ? new Date(d.lastActiveAt).toLocaleString() : '—'}
                </p>
                {d.current && (
                  <span className="inline-block mt-2 text-xs font-medium text-[#1E40AF] bg-[#EFF6FF] px-2 py-1 rounded">
                    Current device
                  </span>
                )}
              </div>
              {!d.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutDevice(d.deviceId)}
                  className="flex-shrink-0"
                >
                  Logout
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
