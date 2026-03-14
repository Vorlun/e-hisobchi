/**
 * Budgets API — backend budgets and their computed status.
 * In API mode, the frontend treats the backend as source of truth for spent/remaining/percent.
 */

import { api } from './api';

/** Backend budget response. */
export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: string; // e.g. MONTHLY
  year: number;
  month: number;
}

/** Backend budget status response. */
export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercent: number;
  exceeded: boolean;
  warning: boolean;
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  period: string;
  year: number;
  month: number;
}

export interface UpdateBudgetRequest extends CreateBudgetRequest {}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getBudgets(): Promise<Budget[]> {
  const res = await api<Budget[] | { success: boolean; data?: Budget[] }>('/budgets');
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: Budget[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid budgets response');
  return list;
}

export async function createBudget(data: CreateBudgetRequest): Promise<Budget> {
  const res = await api<Budget | { success: boolean; data?: Budget }>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const b = (res as { data?: Budget }).data ?? (res as Budget);
  if (!b?.id) throw new Error('Invalid create budget response');
  return b;
}

export async function updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
  const res = await api<Budget | { success: boolean; data?: Budget }>(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const b = (res as { data?: Budget }).data ?? (res as Budget);
  if (!b?.id) throw new Error('Invalid update budget response');
  return b;
}

export async function deleteBudget(id: string): Promise<void> {
  const res = await api<unknown>(`/budgets/${id}`, { method: 'DELETE' });
  checkSuccess(res as { success?: boolean });
}

export async function getBudgetStatus(): Promise<BudgetStatus[]> {
  const res = await api<BudgetStatus[] | { success: boolean; data?: BudgetStatus[] }>('/budgets/status');
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: BudgetStatus[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid budget status response');
  return list;
}

