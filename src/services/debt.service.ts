/**
 * Debt service — single entry for debts API.
 */

import * as debtsApi from './debts.api';
import type {
  DebtApi,
  DebtSummary,
  DebtFilters,
  CreateDebtRequest,
  UpdateDebtRequest,
} from '../types/debt.types';

export type {
  DebtApi,
  DebtSummary,
  DebtFilters,
  CreateDebtRequest,
  UpdateDebtRequest,
} from '../types/debt.types';

export async function fetchDebts(filters?: DebtFilters): Promise<DebtApi[]> {
  return debtsApi.getDebts(filters);
}

export async function fetchDebtById(id: string): Promise<DebtApi> {
  return debtsApi.getDebtById(id);
}

export async function createDebt(data: CreateDebtRequest): Promise<DebtApi> {
  return debtsApi.createDebt({
    ...data,
    currency: data.currency ?? 'UZS',
  });
}

export async function updateDebt(id: string, data: UpdateDebtRequest): Promise<DebtApi> {
  return debtsApi.updateDebt(id, {
    ...data,
    currency: data.currency ?? 'UZS',
  });
}

export async function closeDebt(id: string): Promise<DebtApi> {
  return debtsApi.closeDebt(id);
}

export async function fetchDebtSummary(): Promise<DebtSummary> {
  return debtsApi.getDebtSummary();
}
