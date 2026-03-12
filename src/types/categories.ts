import type { Category } from './index';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', type: 'expense' },
  { id: 'transport', name: 'Transport', type: 'expense' },
  { id: 'housing', name: 'Housing', type: 'expense' },
  { id: 'shopping', name: 'Shopping', type: 'expense' },
  { id: 'health', name: 'Health', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense' },
  { id: 'education', name: 'Education', type: 'expense' },
  { id: 'travel', name: 'Travel', type: 'expense' },
  { id: 'internet', name: 'Internet', type: 'expense' },
  { id: 'debt_payment', name: 'Debt Payment', type: 'expense' },
  { id: 'maintenance', name: 'Maintenance', type: 'expense' },
  { id: 'other', name: 'Other', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', type: 'income' },
  { id: 'business', name: 'Business', type: 'income' },
  { id: 'investment', name: 'Investment', type: 'income' },
  { id: 'gift', name: 'Gift', type: 'income' },
  { id: 'debt_return', name: 'Debt Return', type: 'income' },
  { id: 'other', name: 'Other', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getExpenseCategoryOptions(): { value: string; label: string }[] {
  return EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.name }));
}

export function getIncomeCategoryOptions(): { value: string; label: string }[] {
  return INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.name }));
}
