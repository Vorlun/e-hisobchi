/**
 * Transaction domain and API types.
 */

export type TransactionTypeApi = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TransactionApi {
  id: string | number;
  accountId: string | number;
  accountName: string;
  type: TransactionTypeApi | string;
  amount: number;
  currency: string;
  categoryId: string | number;
  categoryName: string;
  description: string;
  date: string;
  dateTime?: string;
  transferId?: number;
  transferToAccountId?: string;
  transferToAccountName?: string;
  transferPurposeName?: string;
}

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionPagination {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last?: boolean;
}

export interface CreateTransactionRequest {
  accountId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  dateTime?: string;
}

export interface UpdateTransactionRequest {
  accountId?: string;
  amount?: number;
  categoryId?: string;
  description?: string;
  date?: string;
  dateTime?: string;
}

export interface PaginatedTransactions {
  content: TransactionApi[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}
