/**
 * Category API types for transactions (income, expense, transfer).
 */

export type CategoryTypeApi = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface CategoryApi {
  id: string | number;
  name: string;
  type: CategoryTypeApi;
  color: string;
  isDefault: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryTypeApi;
  color: string;
}

export interface UpdateCategoryRequest {
  name: string;
  type: CategoryTypeApi;
  color: string;
}
