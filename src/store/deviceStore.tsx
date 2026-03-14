import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Device } from '../types/device.types';
import * as deviceService from '../services/device.service';

interface DeviceState {
  devices: Device[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface DeviceContextValue extends DeviceState {
  fetchDevices: () => Promise<void>;
  logoutDevice: (deviceId: string) => Promise<void>;
  logoutOtherDevices: () => Promise<void>;
  clearError: () => void;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deviceService.fetchDevices();
      setDevices(res.devices);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      setDevices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutDevice = useCallback(async (deviceId: string) => {
    setError(null);
    try {
      await deviceService.logoutDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout device';
      setError(message);
      throw err;
    }
  }, []);

  const logoutOtherDevices = useCallback(async () => {
    setError(null);
    try {
      await deviceService.logoutOtherDevices();
      await fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout other devices';
      setError(message);
      throw err;
    }
  }, [fetchDevices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const value = useMemo<DeviceContextValue>(
    () => ({
      devices,
      total,
      loading,
      error,
      fetchDevices,
      logoutDevice,
      logoutOtherDevices,
      clearError,
    }),
    [devices, total, loading, error, fetchDevices, logoutDevice, logoutOtherDevices, clearError]
  );

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevices(): DeviceContextValue {
  const ctx = React.useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be used within DeviceProvider');
  return ctx;
}
