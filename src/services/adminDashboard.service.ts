/**
 * Admin dashboard service — activity, growth, and platform stats.
 */

import { api } from './api';
import type {
  AdminActivity,
  AdminGrowthPoint,
  AdminStats,
} from '../types/admin.types';

export type { AdminActivity, AdminGrowthPoint, AdminStats } from '../types/admin.types';

function unwrap<T>(res: T | { success?: boolean; data?: T }): T {
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in res) {
    const d = (res as { data?: T }).data;
    if (d !== undefined) return d;
  }
  return res as T;
}

export async function fetchActivity(): Promise<AdminActivity> {
  const res = await api<AdminActivity | { success?: boolean; data?: AdminActivity }>(
    '/admin/dashboard/activity'
  );
  return unwrap(res);
}

export async function fetchGrowth(): Promise<AdminGrowthPoint[]> {
  const res = await api<
    AdminGrowthPoint[] | { success?: boolean; data?: AdminGrowthPoint[] }
  >('/admin/dashboard/growth');
  const list = unwrap(res);
  return Array.isArray(list) ? list : [];
}

export async function fetchStats(): Promise<AdminStats> {
  const res = await api<AdminStats | { success?: boolean; data?: AdminStats }>(
    '/admin/dashboard/stats'
  );
  return unwrap(res);
}
