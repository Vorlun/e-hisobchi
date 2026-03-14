/**
 * Budget API types.
 */

export interface BudgetApi {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: string;
  year: number;
  month: number;
}

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
