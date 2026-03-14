import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Transaction, TransactionType } from '../types';
import type { TransactionFilters, TransactionPagination, TransactionApi, CreateTransactionRequest, UpdateTransactionRequest } from '../types/transaction.types';
import * as transactionService from '../services/transaction.service';

function mapApiToDomain(tx: TransactionApi | { id: string | number; accountId: string | number; type: string; amount: number; categoryId: string | number; categoryName: string; description?: string; date: string; accountName?: string; transferToAccountId?: string; transferToAccountName?: string; transferPurposeName?: string }): Transaction {
  return {
    id: String(tx.id),
    title: tx.description ?? tx.categoryName ?? '',
    amount: tx.amount,
    type: (tx.type as TransactionType) ?? 'EXPENSE',
    category: tx.categoryId != null ? String(tx.categoryId) : '',
    accountId: String(tx.accountId),
    toAccountId: tx.transferToAccountId,
    date: tx.date,
    description: tx.description,
    createdAt: tx.date,
    accountName: tx.accountName,
    categoryId: tx.categoryId != null ? String(tx.categoryId) : undefined,
    categoryName: tx.categoryName,
    transferToAccountId: tx.transferToAccountId,
    transferToAccountName: tx.transferToAccountName,
    transferPurposeName: tx.transferPurposeName,
  };
}

interface TransactionState {
  transactions: Transaction[];
  transactionPagination: TransactionPagination;
  transactionFilters: TransactionFilters;
  loading: boolean;
  error: string | null;
}

interface TransactionContextValue extends TransactionState {
  fetchTransactions: () => Promise<void>;
  setTransactionFilters: (filters: Partial<TransactionFilters>) => void;
  setTransactionPage: (page: number) => void;
  createTransaction: (data: CreateTransactionRequest) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionRequest) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactionById: (id: string) => Promise<Transaction>;
  clearError: () => void;
}

const defaultPagination: TransactionPagination = {
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionPagination, setTransactionPagination] = useState<TransactionPagination>(defaultPagination);
  const [transactionFilters, setTransactionFiltersState] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { content, pagination } = await transactionService.fetchTransactions({
        filters: transactionFilters,
        page: transactionPagination.page,
        size: transactionPagination.size,
      });
      setTransactions(content.map(mapApiToDomain));
      setTransactionPagination(pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [
    transactionFilters.type,
    transactionFilters.categoryId,
    transactionFilters.accountId,
    transactionFilters.dateFrom,
    transactionFilters.dateTo,
    transactionPagination.page,
    transactionPagination.size,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setTransactionFilters = useCallback((filters: Partial<TransactionFilters>) => {
    setTransactionFiltersState((prev) => ({ ...prev, ...filters }));
    setTransactionPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  const setTransactionPage = useCallback((page: number) => {
    setTransactionPagination((prev) => ({ ...prev, page }));
  }, []);

  const createTransaction = useCallback(async (data: CreateTransactionRequest): Promise<Transaction> => {
    setError(null);
    try {
      const created = await transactionService.createTransaction(data);
      const domain = mapApiToDomain(created);
      setTransactions((prev) => [domain, ...prev]);
      setTransactionPagination((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(message);
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, data: UpdateTransactionRequest): Promise<Transaction> => {
    setError(null);
    try {
      const updated = await transactionService.updateTransaction(id, data);
      const domain = mapApiToDomain(updated);
      setTransactions((prev) => prev.map((t) => (t.id === id ? domain : t)));
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(message);
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await transactionService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setTransactionPagination((prev) => ({ ...prev, totalElements: Math.max(0, prev.totalElements - 1) }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete transaction';
      setError(message);
      throw err;
    }
  }, []);

  const fetchTransactionById = useCallback(async (id: string): Promise<Transaction> => {
    const tx = await transactionService.fetchTransactionById(id);
    return mapApiToDomain(tx);
  }, []);

  const value = useMemo<TransactionContextValue>(
    () => ({
      transactions,
      transactionPagination,
      transactionFilters,
      loading,
      error,
      fetchTransactions,
      setTransactionFilters,
      setTransactionPage,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      fetchTransactionById,
      clearError,
    }),
    [
      transactions,
      transactionPagination,
      transactionFilters,
      loading,
      error,
      fetchTransactions,
      setTransactionFilters,
      setTransactionPage,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      fetchTransactionById,
      clearError,
    ]
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions(): TransactionContextValue {
  const ctx = React.useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}
