/**
 * Debts API — GET/POST/PUT/PATCH with filters and summary.
 * Backend provides overdue; frontend uses it directly.
 */

import { api } from './api';

export type DebtType = 'LENT' | 'BORROWED';
export type DebtStatus = 'OPEN' | 'CLOSED';

/** Backend debt response. */
export interface Debt {
  id: string;
  type: DebtType;
  personName: string;
  personPhone?: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  dueDate?: string;
  status: DebtStatus;
  overdue: boolean;
}

export interface DebtSummary {
  totalBorrowed: number;
  totalLent: number;
  openCount: number;
  overdueCount: number;
}

export interface GetDebtsParams {
  type?: DebtType;
  status?: DebtStatus;
}

export interface CreateDebtRequest {
  type: DebtType;
  personName: string;
  personPhone?: string;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  dueDate?: string;
}

export type UpdateDebtRequest = CreateDebtRequest;

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getDebts(params?: GetDebtsParams): Promise<Debt[]> {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.status) search.set('status', params.status);
  const q = search.toString();
  const res = await api<Debt[] | { success: boolean; data?: Debt[] }>(`/debts${q ? `?${q}` : ''}`);
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: Debt[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid debts response');
  return list;
}

export async function getDebtById(id: string): Promise<Debt> {
  const res = await api<Debt | { success: boolean; data?: Debt }>(`/debts/${id}`);
  checkSuccess(res as { success?: boolean });
  const d = (res as { data?: Debt }).data ?? (res as Debt);
  if (!d?.id) throw new Error('Invalid debt response');
  return d;
}

export async function createDebt(data: CreateDebtRequest): Promise<Debt> {
  const res = await api<Debt | { success: boolean; data?: Debt }>('/debts', {
    method: 'POST',
    body: JSON.stringify({ ...data, currency: data.currency ?? 'UZS' }),
  });
  checkSuccess(res as { success?: boolean });
  const d = (res as { data?: Debt }).data ?? (res as Debt);
  if (!d?.id) throw new Error('Invalid create debt response');
  return d;
}

export async function updateDebt(id: string, data: UpdateDebtRequest): Promise<Debt> {
  const res = await api<Debt | { success: boolean; data?: Debt }>(`/debts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, currency: data.currency ?? 'UZS' }),
  });
  checkSuccess(res as { success?: boolean });
  const d = (res as { data?: Debt }).data ?? (res as Debt);
  if (!d?.id) throw new Error('Invalid update debt response');
  return d;
}

export async function closeDebt(id: string): Promise<Debt> {
  const res = await api<Debt | { success: boolean; data?: Debt }>(`/debts/${id}/close`, {
    method: 'PATCH',
  });
  checkSuccess(res as { success?: boolean });
  const d = (res as { data?: Debt }).data ?? (res as Debt);
  if (!d?.id) throw new Error('Invalid close debt response');
  return d;
}

export async function getDebtSummary(): Promise<DebtSummary> {
  const res = await api<DebtSummary | { success: boolean; data?: DebtSummary }>('/debts/summary');
  checkSuccess(res as { success?: boolean });
  const data = (res as { data?: DebtSummary }).data ?? (res as DebtSummary);
  if (data == null || typeof data.totalBorrowed !== 'number') throw new Error('Invalid debt summary response');
  return data;
}
