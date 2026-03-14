/**
 * Budget service — single entry for budgets API.
 */

import * as budgetsApi from './budgets.api';
import type { BudgetApi, BudgetStatus, CreateBudgetRequest, UpdateBudgetRequest } from '../types/budget.types';

export type { BudgetApi, BudgetStatus, CreateBudgetRequest, UpdateBudgetRequest } from '../types/budget.types';

export async function fetchBudgets(): Promise<BudgetApi[]> {
  const list = await budgetsApi.getBudgets();
  return list;
}

export async function fetchBudgetStatus(): Promise<BudgetStatus[]> {
  return budgetsApi.getBudgetStatus();
}

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetApi> {
  return budgetsApi.createBudget(data);
}

export async function updateBudget(id: string, data: UpdateBudgetRequest): Promise<BudgetApi> {
  return budgetsApi.updateBudget(id, data);
}

export async function deleteBudget(id: string): Promise<void> {
  await budgetsApi.deleteBudget(id);
}
