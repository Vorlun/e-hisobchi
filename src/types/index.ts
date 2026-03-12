/**
 * Financial domain models — single source of truth for store, services, and API contract.
 * Use the exported const arrays for validation and iteration; use types for typing.
 */

// --- Transaction ---
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  'EXPENSE',
  'INCOME',
  'TRANSFER',
] as const;

export function isTransactionType(value: string): value is TransactionType {
  return TRANSACTION_TYPES.includes(value as TransactionType);
}

// --- Account ---
export type AccountType =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'SAVINGS'
  | 'WALLET';

export const ACCOUNT_TYPES: readonly AccountType[] = [
  'CASH',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'SAVINGS',
  'WALLET',
] as const;

export function isAccountType(value: string): value is AccountType {
  return ACCOUNT_TYPES.includes(value as AccountType);
}

// --- Debt ---
export type DebtStatus = 'OPEN' | 'CLOSED';

export const DEBT_STATUSES: readonly DebtStatus[] = ['OPEN', 'CLOSED'] as const;

export type DebtDirection = 'LENT' | 'BORROWED';

export const DEBT_DIRECTIONS: readonly DebtDirection[] = ['LENT', 'BORROWED'] as const;

export function isDebtDirection(value: string): value is DebtDirection {
  return DEBT_DIRECTIONS.includes(value as DebtDirection);
}

export function isDebtStatus(value: string): value is DebtStatus {
  return DEBT_STATUSES.includes(value as DebtStatus);
}

// --- Category (for type field) ---
export type CategoryType = 'expense' | 'income';

export const CATEGORY_TYPES: readonly CategoryType[] = ['expense', 'income'] as const;

// --- Entities ---
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  color: string;
  createdAt: string;
  initialBalance?: number;
  archived?: boolean;
  cardExpiresAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId?: string;
  date: string;
  description?: string;
  createdAt: string;
  /** From API: account display name */
  accountName?: string;
  /** From API: category id (same as category) */
  categoryId?: string;
  /** From API: category display name */
  categoryName?: string;
  /** From API: transfer destination account id */
  transferToAccountId?: string;
  /** From API: transfer destination account name */
  transferToAccountName?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  direction: DebtDirection;
  status: DebtStatus;
  date: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  /** From API */
  personPhone?: string;
  currency?: string;
  overdue?: boolean;
}
