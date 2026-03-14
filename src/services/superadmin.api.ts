/**
 * Superadmin API — admin management (list, create, get, update, enable, disable, reset password).
 */

import { api } from './api';
import type { Admin, CreateAdminRequest, UpdateAdminRequest, ResetPasswordRequest } from '../types/superadmin.types';

const BASE = '/superadmin/admins';

interface Wrapped<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrap<T>(res: Wrapped<T> | T): T {
  if (res != null && typeof res === 'object' && 'data' in res && (res as Wrapped<T>).data !== undefined) {
    return (res as Wrapped<T>).data as T;
  }
  return res as T;
}

export async function getAdmins(): Promise<Admin[]> {
  const res = await api<Wrapped<Admin[]>>(BASE);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

export async function getAdminById(id: number): Promise<Admin> {
  const res = await api<Wrapped<Admin>>(`${BASE}/${id}`);
  const data = unwrap(res);
  if (!data?.id) throw new Error('Invalid admin response');
  return data;
}

export async function createAdmin(body: CreateAdminRequest): Promise<Admin> {
  const res = await api<Wrapped<Admin>>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = unwrap(res);
  if (!data?.id) throw new Error('Invalid create admin response');
  return data;
}

export async function updateAdmin(id: number, body: UpdateAdminRequest): Promise<Admin> {
  const res = await api<Wrapped<Admin>>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const data = unwrap(res);
  if (!data?.id) throw new Error('Invalid update admin response');
  return data;
}

export async function disableAdmin(id: number): Promise<void> {
  await api<Wrapped<unknown>>(`${BASE}/${id}/disable`, { method: 'PATCH' });
}

export async function enableAdmin(id: number): Promise<void> {
  await api<Wrapped<unknown>>(`${BASE}/${id}/enable`, { method: 'PATCH' });
}

export async function resetAdminPassword(id: number, body: ResetPasswordRequest): Promise<void> {
  await api<Wrapped<unknown>>(`${BASE}/${id}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
