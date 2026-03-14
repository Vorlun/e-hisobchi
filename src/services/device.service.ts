/**
 * Device / session service — active sessions and logout.
 */

import { api } from './api';
import { getRefreshToken } from './tokenStorage';
import type { Device, DevicesResponse } from '../types/device.types';

export type { Device, DevicesResponse } from '../types/device.types';

function deviceHeaders(): Record<string, string> {
  const refresh = getRefreshToken();
  const h: Record<string, string> = {};
  if (refresh) h['X-Refresh-Token'] = refresh;
  return h;
}

export async function fetchDevices(): Promise<DevicesResponse> {
  const res = await api<DevicesResponse | { success?: boolean; data?: DevicesResponse }>(
    '/devices',
    { headers: deviceHeaders() }
  );
  const wrapped = res as { devices?: Device[]; total?: number; data?: { devices?: Device[]; total?: number } } | null;
  const data = wrapped?.data ?? (wrapped && 'devices' in wrapped ? wrapped : null);
  if (!data || !Array.isArray(data.devices)) return { devices: [], total: 0 };
  return {
    devices: data.devices,
    total: typeof data.total === 'number' ? data.total : data.devices.length,
  };
}

export async function logoutDevice(deviceId: string): Promise<void> {
  await api(`/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
    headers: deviceHeaders(),
  });
}

export async function logoutOtherDevices(): Promise<void> {
  await api('/devices/others', {
    method: 'DELETE',
    headers: deviceHeaders(),
  });
}
