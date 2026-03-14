/**
 * Admin user management service.
 */

import { api } from './api';
import type {
  AdminUser,
  AdminUsersFilters,
  PaginatedAdminUsers,
  BlockUserRequest,
} from '../types/adminUser.types';

export type {
  AdminUser,
  AdminUsersFilters,
  PaginatedAdminUsers,
  BlockUserRequest,
} from '../types/adminUser.types';

function buildQuery(params: AdminUsersFilters): string {
  const search = new URLSearchParams();
  if (params.query != null && params.query !== '') search.set('query', params.query);
  if (params.enabled != null) search.set('enabled', String(params.enabled));
  if (params.locked != null) search.set('locked', String(params.locked));
  if (params.page != null) search.set('page', String(params.page));
  if (params.size != null) search.set('size', String(params.size));
  const q = search.toString();
  return q ? `?${q}` : '';
}

function unwrapList<T>(res: T[] | { success?: boolean; data?: T[] }): T[] {
  if (Array.isArray(res)) return res;
  const data = (res as { data?: T[] }).data;
  return Array.isArray(data) ? data : [];
}

function unwrapOne<T>(res: T | { success?: boolean; data?: T }): T | null {
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in res) {
    const d = (res as { data?: T }).data;
    if (d !== undefined) return d;
  }
  return (res as T) ?? null;
}

export async function fetchUsers(filters?: AdminUsersFilters): Promise<PaginatedAdminUsers> {
  const path = `/admin/users${buildQuery(filters ?? {})}`;
  const res = await api<PaginatedAdminUsers | { success?: boolean; data?: PaginatedAdminUsers }>(path);
  const data = unwrapOne(res);
  if (data && Array.isArray(data.content)) {
    return {
      content: data.content,
      page: data.page ?? 0,
      size: data.size ?? 20,
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      last: data.last ?? true,
    };
  }
  const list = unwrapList(res as unknown as AdminUser[] | { data?: AdminUser[] });
  return {
    content: list,
    page: 0,
    size: list.length,
    totalElements: list.length,
    totalPages: 1,
    last: true,
  };
}

export async function fetchUserDetail(id: string): Promise<AdminUser | null> {
  const res = await api<AdminUser | { success?: boolean; data?: AdminUser }>(
    `/admin/users/${encodeURIComponent(id)}`
  );
  return unwrapOne(res);
}

export async function deleteUser(id: string): Promise<void> {
  await api(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function blockUser(id: string, body?: BlockUserRequest): Promise<void> {
  await api(`/admin/users/${encodeURIComponent(id)}/block`, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  });
}

export async function unblockUser(id: string): Promise<void> {
  await api(`/admin/users/${encodeURIComponent(id)}/unblock`, { method: 'PATCH' });
}
