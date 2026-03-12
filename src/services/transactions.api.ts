/**
 * Transactions API — GET/POST/PUT/DELETE with filters and pagination.
 * Backend updates account balances; frontend reloads accounts after mutations.
 */

import { api } from './api';

/** Backend transaction response (Transaction data model). */
export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  amount: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string;
  transferToAccountId?: string;
  transferToAccountName?: string;
}

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetTransactionsParams extends TransactionFilters {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateTransactionRequest {
  accountId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
}

export interface UpdateTransactionRequest {
  accountId?: string;
  amount?: number;
  categoryId?: string;
  description?: string;
  date?: string;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getTransactions(
  params?: GetTransactionsParams
): Promise<PaginatedResponse<Transaction>> {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.categoryId) search.set('categoryId', params.categoryId);
  if (params?.accountId) search.set('accountId', params.accountId);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.size !== undefined) search.set('size', String(params.size));
  const q = search.toString();
  const res = await api<PaginatedResponse<Transaction> | { success: boolean; data?: PaginatedResponse<Transaction> }>(
    `/transactions${q ? `?${q}` : ''}`
  );
  checkSuccess(res as { success?: boolean });
  const data = Array.isArray((res as { content?: Transaction[] }).content)
    ? (res as PaginatedResponse<Transaction>)
    : (res as { data?: PaginatedResponse<Transaction> }).data;
  if (!data?.content) throw new Error('Invalid transactions response');
  return data as PaginatedResponse<Transaction>;
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const res = await api<Transaction | { success: boolean; data?: Transaction }>(`/transactions/${id}`);
  checkSuccess(res as { success?: boolean });
  const tx = (res as { data?: Transaction }).data ?? (res as Transaction);
  if (!tx?.id) throw new Error('Invalid transaction response');
  return tx;
}

export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  const res = await api<Transaction | { success: boolean; data?: Transaction }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const tx = (res as { data?: Transaction }).data ?? (res as Transaction);
  if (!tx?.id) throw new Error('Invalid create transaction response');
  return tx;
}

export async function updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
  const res = await api<Transaction | { success: boolean; data?: Transaction }>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const tx = (res as { data?: Transaction }).data ?? (res as Transaction);
  if (!tx?.id) throw new Error('Invalid update transaction response');
  return tx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await api<unknown>(`/transactions/${id}`, { method: 'DELETE' });
  checkSuccess(res as { success?: boolean });
}
