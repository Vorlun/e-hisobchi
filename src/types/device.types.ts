/**
 * Device / session API types.
 */

export interface Device {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  expiresAt: string;
  current: boolean;
}

export interface DevicesResponse {
  devices: Device[];
  total: number;
}
