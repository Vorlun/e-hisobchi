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
  const data = res && typeof res === 'object' && 'devices' in res
    ? (res as DevicesResponse)
    : (res as { data?: DevicesResponse }).data;
  if (!data) return { devices: [], total: 0 };
  return {
    devices: Array.isArray(data.devices) ? data.devices : [],
    total: typeof data.total === 'number' ? data.total : 0,
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
