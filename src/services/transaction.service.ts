/**
 * Transaction service — single entry for transaction API.
 */

import * as transactionsApi from './transactions.api';
import type {
  TransactionFilters,
  TransactionPagination,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PaginatedTransactions,
  TransactionApi,
} from '../types/transaction.types';

export type { TransactionFilters, TransactionPagination, CreateTransactionRequest, UpdateTransactionRequest } from '../types/transaction.types';

export async function fetchTransactions(params?: {
  filters?: TransactionFilters;
  page?: number;
  size?: number;
}): Promise<{ content: TransactionApi[]; pagination: TransactionPagination }> {
  const res = await transactionsApi.getTransactions({
    type: params?.filters?.type,
    categoryId: params?.filters?.categoryId,
    accountId: params?.filters?.accountId,
    dateFrom: params?.filters?.dateFrom,
    dateTo: params?.filters?.dateTo,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  });
  return {
    content: res.content as TransactionApi[],
    pagination: {
      page: res.page,
      size: res.size,
      totalPages: res.totalPages,
      totalElements: res.totalElements,
      last: res.last,
    },
  };
}

export async function fetchTransactionById(id: string): Promise<TransactionApi> {
  const tx = await transactionsApi.getTransactionById(id);
  return tx as TransactionApi;
}

export async function createTransaction(data: CreateTransactionRequest): Promise<TransactionApi> {
  const tx = await transactionsApi.createTransaction({
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    categoryId: data.categoryId,
    description: data.description,
    date: data.dateTime ?? data.date,
  });
  return tx as TransactionApi;
}

export async function updateTransaction(id: string, data: UpdateTransactionRequest): Promise<TransactionApi> {
  const tx = await transactionsApi.updateTransaction(id, {
    accountId: data.accountId,
    amount: data.amount,
    categoryId: data.categoryId,
    description: data.description,
    date: data.dateTime ?? data.date,
  });
  return tx as TransactionApi;
}

export async function deleteTransaction(id: string): Promise<void> {
  await transactionsApi.deleteTransaction(id);
}
