import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account, AccountType, Transaction, Budget, Debt, DebtDirection, Category } from '../types';
import { createTransaction } from '../services/transactions';
import { createAccount, toAccountType, toDisplayAccountType, generateId } from '../services/accounts';
import {
  applyDeltasToAccounts,
  getTransactionDeltas,
  mergeDeltas,
  reverseDeltas,
} from '../services/balance';
import {
  selectTotalBalance,
  selectTransactionsByTimeFilter,
  selectExpenseByCategory,
  selectIncomeVsExpenseTimeline,
} from '../services/selectors';
import { validateTransaction, validateTransfer, validateTransferRequest } from '../services/validation';
import { getTodayString } from '../utils/dates';
import type { TimeFilter } from '../utils/dates';
import { isApiAvailable } from '../services/api';
import { useAccounts } from './accountStore';
import { useTransactions } from './transactionStore';
import { useTransfers } from './transferStore';
import { useCards } from './cardStore';
import { useBudgets } from './budgetStore';
import { useCategories } from './categoryStore';
import { useDebts } from './debtStore';
import { useStatistics } from './statisticsStore';
import type { Card, CreateCardRequest, UpdateCardRequest } from '../types/card.types';
import type { BudgetStatus } from '../types/budget.types';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types';
import type { DebtSummary } from '../types/debt.types';
import type { TransactionFilters } from '../types/transaction.types';
import type { Transfer } from '../services/transfers.api';
import type { TransferPagination, TransferPurpose } from '../types/transfer.types';
import type {
  SummaryStats,
  TimelineDataPoint,
  CategoryStatsItem,
  CalendarStatsItem,
  TopCategoryItem,
} from '../types/statistics.types';
import type { TransactionType } from '../types';

/** Normalize category for comparison (budgets may use display names; transactions use ids). */
function categoryMatches(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

// Re-export for consumers
export type { TimeFilter };

interface TransactionPagination {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

const DEFAULT_PAGINATION: TransactionPagination = {
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
};

interface FinanceState {
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  transactionPagination: TransactionPagination;
  transactionFilters: TransactionFilters;
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  transferCategories: Category[];
  /** Local budgets array, used in non-API mode and for legacy components. */
  transfers: Transfer[];
  transferPagination: TransferPagination;
  transferPurposes: TransferPurpose[];
  budgets: Budget[];
  /** Backend-derived budget status entries keyed by budget/category. */
  budgetStatus: BudgetStatus[];
  debts: Debt[];
  debtSummary: DebtSummary | null;
  summaryStats: SummaryStats | null;
  timelineStats: TimelineDataPoint[];
  categoryStats: CategoryStatsItem[];
  incomeCategoryStats: CategoryStatsItem[];
  calendarStats: CalendarStatsItem[];
  topCategories: TopCategoryItem[];
  loadingAccounts: boolean;
  loadingCards: boolean;
  loadingTransactions: boolean;
  loadingTransfers: boolean;
  loadingBudgets: boolean;
  loadingDebts: boolean;
  loadingStats: boolean;
}

export interface DebtFilters {
  type?: import('../types/debt.types').DebtTypeApi;
  status?: import('../types/debt.types').DebtStatusApi;
}

interface FinanceContextValue extends FinanceState {
  totalBalance: number;
  loadAccounts: () => Promise<void>;
  loadCards: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  setTransactionFilters: (filters: Partial<TransactionFilters>) => void;
  setTransactionPage: (page: number) => void;
  loadCategories: (type?: import('../types/category.types').CategoryTypeApi) => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadBudgetStatus: () => Promise<void>;
  loadTransfers: () => Promise<void>;
  loadTransferPurposes: () => Promise<void>;
  loadDebts: (filters?: DebtFilters) => Promise<void>;
  loadDebtSummary: () => Promise<void>;
  loadStats: (filter: TimeFilter) => Promise<void>;
  addAccount: (name: string, type: string, balance: number, currency?: string) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  archiveAccount: (id: string) => Promise<void>;
  depositToAccount: (id: string, amount: number, note?: string) => Promise<void>;
  withdrawFromAccount: (id: string, amount: number, note?: string) => Promise<void>;
  getTotalBalance: () => Promise<{ balances: Record<string, number> } | null>;
  createCard: (data: CreateCardRequest) => Promise<void>;
  updateCard: (id: string, data: UpdateCardRequest) => Promise<void>;
  archiveCard: (id: string) => Promise<void>;
  lookupCard: (cardNumber: string) => Promise<{ cardNumber: string; cardType: string; cardholderName: string } | null>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void | Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => void | Promise<void>;
  deleteTransaction: (id: string) => void | Promise<void>;
  addTransfer: (params: {
    fromAccountId: string;
    toAccountId?: string;
    toCardNumber?: string;
    amount: number;
    description?: string;
    purpose?: string;
  }) => void | Promise<void>;
  addBudget: (category: string, limit: number) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  deleteBudget: (id: string) => Promise<void>;
  updateBudgetSpent: (categoryId: string, spent: number) => void;
  addDebt: (
    personName: string,
    amount: number,
    direction: DebtDirection,
    date: string,
    dueDate?: string,
    notes?: string
  ) => void | Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => void | Promise<void>;
  markDebtClosed: (id: string) => void | Promise<void>;
  closeDebt: (id: string) => void | Promise<void>;
  getTransactionsByTimeFilter: (filter: TimeFilter) => Transaction[];
  getExpenseByCategory: (filter: TimeFilter) => { name: string; value: number; color: string }[];
  getIncomeVsExpense: (filter: TimeFilter) => { period: string; income: number; expense: number }[];
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const {
    cards: cardsFromStore,
    loading: loadingCards,
    fetchCards: fetchCardsFromStore,
    createCard: createCardInStore,
    updateCard: updateCardInStore,
    archiveCard: archiveCardInStore,
    lookupCard: lookupCardFromStore,
  } = useCards();
  const {
    budgets: budgetsFromStore,
    budgetStatus: budgetStatusFromStore,
    loading: loadingBudgets,
    fetchBudgets: fetchBudgetsFromStore,
    fetchBudgetStatus: fetchBudgetStatusFromStore,
    createBudget: createBudgetInStore,
    updateBudget: updateBudgetInStore,
    deleteBudget: deleteBudgetInStore,
  } = useBudgets();
  const {
    categories: categoriesFromStore,
    fetchCategories: fetchCategoriesFromStore,
    createCategory: createCategoryInStore,
    updateCategory: updateCategoryInStore,
    deleteCategory: deleteCategoryInStore,
  } = useCategories();
  const {
    debts: debtsFromStore,
    summary: debtSummaryFromStore,
    loading: loadingDebts,
    fetchDebts: fetchDebtsFromStore,
    fetchDebtSummary: fetchDebtSummaryFromStore,
    createDebt: createDebtInStore,
    updateDebt: updateDebtInStore,
    closeDebt: closeDebtInStore,
  } = useDebts();
  const {
    summaryStats: summaryStatsFromStore,
    timelineStats: timelineStatsFromStore,
    categoryStats: categoryStatsFromStore,
    incomeCategoryStats: incomeCategoryStatsFromStore,
    calendarStats: calendarStatsFromStore,
    topCategories: topCategoriesFromStore,
    loading: loadingStats,
    loadStats: loadStatsFromStore,
  } = useStatistics();
  const {
    accounts,
    loading: loadingAccounts,
    fetchAccounts: fetchAccountsFromStore,
    createAccount: createAccountInStore,
    updateAccount: updateAccountInStore,
    archiveAccount: archiveAccountInStore,
    deposit: depositInStore,
    withdraw: withdrawInStore,
    fetchTotalBalance: fetchTotalBalanceFromStore,
  } = useAccounts();
  const {
    transactions,
    transactionPagination,
    transactionFilters,
    loading: loadingTransactions,
    fetchTransactions: fetchTransactionsFromStore,
    setTransactionFilters: setTransactionFiltersFromStore,
    setTransactionPage: setTransactionPageFromStore,
    createTransaction: createTransactionInStore,
    updateTransaction: updateTransactionInStore,
    deleteTransaction: deleteTransactionInStore,
  } = useTransactions();
  const {
    transfers,
    transferPagination,
    transferPurposes,
    loading: loadingTransfers,
    fetchTransfers: fetchTransfersFromStore,
    setTransferPage: setTransferPageFromStore,
    createTransfer: createTransferInStore,
    fetchTransferPurposes: fetchTransferPurposesFromStore,
  } = useTransfers();
  const totalBalance = useMemo(() => selectTotalBalance(accounts), [accounts]);

  const categories = useMemo(() => categoriesFromStore, [categoriesFromStore]);
  const incomeCategories = useMemo(
    () => categoriesFromStore.filter((c) => c.type === 'income'),
    [categoriesFromStore]
  );
  const expenseCategories = useMemo(
    () => categoriesFromStore.filter((c) => c.type === 'expense'),
    [categoriesFromStore]
  );
  const transferCategories = useMemo(
    () => categoriesFromStore.filter((c) => c.type === 'transfer'),
    [categoriesFromStore]
  );

  const loadTransactions = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchTransactionsFromStore();
  }, [fetchTransactionsFromStore]);

  const setTransactionFilters = useCallback(
    (filters: Partial<TransactionFilters>) => {
      setTransactionFiltersFromStore(filters);
    },
    [setTransactionFiltersFromStore]
  );

  const setTransactionPage = useCallback(
    (page: number) => {
      setTransactionPageFromStore(page);
    },
    [setTransactionPageFromStore]
  );

  const loadBudgets = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchBudgetsFromStore();
    await fetchBudgetStatusFromStore();
  }, [fetchBudgetsFromStore, fetchBudgetStatusFromStore]);

  const loadBudgetStatus = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchBudgetStatusFromStore();
  }, [fetchBudgetStatusFromStore]);

  const loadCategories = useCallback(
    async (type?: import('../types/category.types').CategoryTypeApi) => {
      if (!isApiAvailable) return;
      await fetchCategoriesFromStore(type);
    },
    [fetchCategoriesFromStore]
  );

  const createCategory = useCallback(
    async (data: CreateCategoryRequest) => {
      if (!isApiAvailable) return;
      await createCategoryInStore(data);
    },
    [createCategoryInStore]
  );

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryRequest) => {
      if (!isApiAvailable) return;
      await updateCategoryInStore(id, data);
    },
    [updateCategoryInStore]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await deleteCategoryInStore(id);
    },
    [deleteCategoryInStore]
  );

  const loadTransfers = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchTransfersFromStore();
  }, [fetchTransfersFromStore]);

  const loadTransferPurposes = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchTransferPurposesFromStore();
  }, [fetchTransferPurposesFromStore]);

  const loadDebts = useCallback(
    async (filters?: DebtFilters) => {
      if (!isApiAvailable) return;
      await fetchDebtsFromStore(filters);
    },
    [fetchDebtsFromStore]
  );

  const loadDebtSummary = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchDebtSummaryFromStore();
  }, [fetchDebtSummaryFromStore]);

  const loadStats = useCallback(
    async (filter: TimeFilter) => {
      if (!isApiAvailable) return;
      await loadStatsFromStore(filter);
    },
    [loadStatsFromStore]
  );

  const loadAccounts = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchAccountsFromStore();
  }, [fetchAccountsFromStore]);

  const loadCards = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchCardsFromStore();
  }, [fetchCardsFromStore]);

  useEffect(() => {
    if (isApiAvailable) {
      loadAccounts();
      loadCards();
    }
  }, [loadAccounts, loadCards]);

  const addAccount = useCallback(
    async (name: string, type: string, balance: number, currency = 'UZS') => {
      if (!isApiAvailable) return;
      await createAccountInStore({
        name,
        type: toAccountType(type) as string,
        currency,
        initialBalance: balance,
      });
    },
    [createAccountInStore]
  );

  const updateAccount = useCallback(
    async (id: string, data: Partial<Account>) => {
      if (!isApiAvailable) return;
      await updateAccountInStore(id, {
        name: data.name,
        type: data.type as string,
        color: data.color,
        cardExpiresAt: data.cardExpiresAt,
      });
    },
    [updateAccountInStore]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await archiveAccountInStore(id);
    },
    [archiveAccountInStore]
  );

  const archiveAccount = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await archiveAccountInStore(id);
    },
    [archiveAccountInStore]
  );

  const depositToAccount = useCallback(
    async (id: string, amount: number, note?: string) => {
      if (!isApiAvailable) return;
      await depositInStore(id, { amount, note });
    },
    [depositInStore]
  );

  const withdrawFromAccount = useCallback(
    async (id: string, amount: number, note?: string) => {
      if (!isApiAvailable) return;
      await withdrawInStore(id, { amount, note });
    },
    [withdrawInStore]
  );

  const getTotalBalance = useCallback(async (): Promise<{ balances: Record<string, number> } | null> => {
    if (!isApiAvailable) return null;
    try {
      const data = await fetchTotalBalanceFromStore();
      return data ? { balances: data.balances } : null;
    } catch {
      return null;
    }
  }, [fetchTotalBalanceFromStore]);

  const createCard = useCallback(
    async (data: CreateCardRequest) => {
      if (!isApiAvailable) return;
      await createCardInStore(data);
    },
    [createCardInStore]
  );

  const updateCard = useCallback(
    async (id: string, data: UpdateCardRequest) => {
      if (!isApiAvailable) return;
      await updateCardInStore(id, data);
    },
    [updateCardInStore]
  );

  const archiveCard = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await archiveCardInStore(id);
    },
    [archiveCardInStore]
  );

  const lookupCard = useCallback(
    async (cardNumber: string) => {
      if (!isApiAvailable) return null;
      return lookupCardFromStore(cardNumber);
    },
    [lookupCardFromStore]
  );

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
      if (!isApiAvailable || (data.type !== 'INCOME' && data.type !== 'EXPENSE')) return;
      const validation = validateTransaction(data, accounts);
      if (!validation.valid) throw new Error(validation.error);
      await createTransactionInStore({
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        categoryId: data.category,
        description: data.description ?? data.title,
        date: data.date,
      });
      await fetchAccountsFromStore();
      await loadBudgetStatus();
    },
    [accounts, createTransactionInStore, fetchAccountsFromStore, loadBudgetStatus]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      if (!isApiAvailable) return;
      await updateTransactionInStore(id, {
        accountId: data.accountId,
        amount: data.amount,
        categoryId: data.category,
        description: data.description,
        date: data.date,
      });
      await fetchAccountsFromStore();
      await loadBudgetStatus();
    },
    [updateTransactionInStore, fetchAccountsFromStore, loadBudgetStatus]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await deleteTransactionInStore(id);
      await fetchAccountsFromStore();
      await loadBudgetStatus();
    },
    [deleteTransactionInStore, fetchAccountsFromStore, loadBudgetStatus]
  );

  const addTransfer = useCallback(
    async (params: {
      fromAccountId: string;
      toAccountId?: string;
      toCardNumber?: string;
      amount: number;
      description?: string;
      purpose?: string;
    }) => {
      if (!isApiAvailable) return;
      const { fromAccountId, toAccountId, toCardNumber, amount, description, purpose } = params;
      const rawAmount = Math.abs(amount);
      const validation = validateTransferRequest({
        fromAccountId,
        toAccountId,
        toCardNumber: toCardNumber != null && toCardNumber !== '' ? toCardNumber.replace(/\D/g, '') : undefined,
        amount: rawAmount,
        accounts,
      });
      if (!validation.valid) throw new Error(validation.error);
      await createTransferInStore({
        fromAccountId,
        toAccountId: toAccountId || undefined,
        toCardNumber: toCardNumber != null && toCardNumber !== '' ? toCardNumber.replace(/\D/g, '') : undefined,
        amount: rawAmount,
        description: description || 'Transfer',
        purpose: purpose || undefined,
      });
      await fetchTransfersFromStore();
      await fetchAccountsFromStore();
      await fetchCardsFromStore();
    },
    [accounts, createTransferInStore, fetchTransfersFromStore, fetchAccountsFromStore, fetchCardsFromStore]
  );

  const addBudget = useCallback(
    async (categoryName: string, limit: number) => {
      if (isApiAvailable) {
        const cat = expenseCategories.find((c) => c.name === categoryName) ?? expenseCategories[0];
        if (!cat) throw new Error('No expense category available for budget');
        const now = new Date();
        await createBudgetInStore({
          categoryId: String(cat.id),
          amount: limit,
          period: 'MONTHLY',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });
        return;
      }
      // Non-API mode: budget store not used; no-op
    },
    [expenseCategories, createBudgetInStore, isApiAvailable]
  );

  const updateBudget = useCallback(
    async (id: string, data: Partial<Budget>) => {
      if (isApiAvailable) {
        const existing = budgetsFromStore.find((b) => b.id === id);
        if (!existing) return;
        const cat =
          expenseCategories.find((c) => c.name === (data.category ?? existing.category)) ??
          expenseCategories[0];
        if (!cat) return;
        const [yearStr, monthStr] = existing.month.split('-');
        await updateBudgetInStore(id, {
          categoryId: String(cat.id),
          amount: data.limit ?? existing.limit,
          period: 'MONTHLY',
          year: Number(yearStr),
          month: Number(monthStr),
        });
        return;
      }
      // Non-API mode: no-op
    },
    [budgetsFromStore, expenseCategories, updateBudgetInStore, isApiAvailable]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await deleteBudgetInStore(id);
    },
    [deleteBudgetInStore, isApiAvailable]
  );

  const updateBudgetSpent = useCallback(
    (categoryId: string, _spent: number) => {
      if (isApiAvailable) fetchBudgetStatusFromStore();
    },
    [fetchBudgetStatusFromStore, isApiAvailable]
  );

  const addDebt = useCallback(
    async (
      personName: string,
      amount: number,
      direction: DebtDirection,
      date: string,
      dueDate?: string,
      notes?: string
    ) => {
      if (isApiAvailable) {
        await createDebtInStore({
          type: direction,
          personName,
          amount,
          currency: 'UZS',
          description: notes,
          date,
          dueDate,
        });
        return;
      }
      // Non-API: no local debt state
    },
    [createDebtInStore, isApiAvailable]
  );

  const updateDebt = useCallback(
    async (id: string, data: Partial<Debt>) => {
      if (isApiAvailable) {
        const existing = debtsFromStore.find((d) => d.id === id);
        if (!existing) return;
        await updateDebtInStore(id, {
          type: existing.direction,
          personName: data.personName ?? existing.personName,
          amount: data.amount ?? existing.amount,
          currency: existing.currency ?? 'UZS',
          description: data.notes ?? existing.notes,
          date: data.date ?? existing.date,
          dueDate: data.dueDate ?? existing.dueDate,
        });
        return;
      }
      // Non-API: no-op
    },
    [debtsFromStore, updateDebtInStore, isApiAvailable]
  );

  const markDebtClosed = useCallback(
    async (id: string) => {
      if (isApiAvailable) {
        await closeDebtInStore(id);
        return;
      }
      // Non-API: no-op
    },
    [closeDebtInStore, isApiAvailable]
  );

  const getTransactionsByTimeFilter = useCallback(
    (filter: TimeFilter) => selectTransactionsByTimeFilter(transactions, filter),
    [transactions]
  );

  const getExpenseByCategory = useCallback(
    (filter: TimeFilter) => selectExpenseByCategory(transactions, filter),
    [transactions]
  );

  const getIncomeVsExpense = useCallback(
    (filter: TimeFilter) => selectIncomeVsExpenseTimeline(transactions, filter),
    [transactions]
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      accounts,
      cards: cardsFromStore,
      transactions,
      transactionPagination,
      transactionFilters,
      categories,
      incomeCategories,
      expenseCategories,
      transferCategories,
      transfers,
      transferPagination,
      transferPurposes,
      budgets: budgetsFromStore,
      budgetStatus: budgetStatusFromStore,
      debts: debtsFromStore,
      debtSummary: debtSummaryFromStore,
      summaryStats: summaryStatsFromStore,
      timelineStats: timelineStatsFromStore,
      categoryStats: categoryStatsFromStore,
      incomeCategoryStats: incomeCategoryStatsFromStore,
      calendarStats: calendarStatsFromStore,
      topCategories: topCategoriesFromStore,
      loadingAccounts,
      loadingCards,
      loadingTransactions,
      loadingTransfers,
      loadingBudgets,
      loadingDebts,
      loadingStats,
      totalBalance,
      loadAccounts,
      loadCards,
      loadTransactions,
      setTransactionFilters,
      setTransactionPage,
      loadCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      loadBudgets,
      loadBudgetStatus,
      loadTransfers,
      loadTransferPurposes,
      loadDebts,
      loadDebtSummary,
      loadStats,
      addAccount,
      updateAccount,
      deleteAccount,
      archiveAccount,
      depositToAccount,
      withdrawFromAccount,
      getTotalBalance,
      createCard,
      updateCard,
      archiveCard,
      lookupCard,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addTransfer,
      addBudget,
      updateBudget,
      deleteBudget,
      updateBudgetSpent,
      addDebt,
      updateDebt,
      markDebtClosed,
      closeDebt: markDebtClosed,
      getTransactionsByTimeFilter,
      getExpenseByCategory,
      getIncomeVsExpense,
    }),
    [
      accounts,
      cardsFromStore,
      transactions,
      transactionPagination,
      transactionFilters,
      categories,
      incomeCategories,
      expenseCategories,
      transferCategories,
      transfers,
      transferPagination,
      transferPurposes,
      budgetsFromStore,
      budgetStatusFromStore,
      debtsFromStore,
      debtSummaryFromStore,
      summaryStatsFromStore,
      timelineStatsFromStore,
      categoryStatsFromStore,
      incomeCategoryStatsFromStore,
      calendarStatsFromStore,
      topCategoriesFromStore,
      loadingAccounts,
      loadingCards,
      loadingTransactions,
      loadingTransfers,
      loadingBudgets,
      loadingDebts,
      loadingStats,
      totalBalance,
      loadAccounts,
      loadCards,
      loadTransactions,
      setTransactionFilters,
      setTransactionPage,
      loadCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      loadBudgets,
      loadBudgetStatus,
      loadTransfers,
      loadTransferPurposes,
      loadDebts,
      loadDebtSummary,
      loadStats,
      addAccount,
      updateAccount,
      deleteAccount,
      archiveAccount,
      depositToAccount,
      withdrawFromAccount,
      getTotalBalance,
      createCard,
      updateCard,
      archiveCard,
      lookupCard,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addTransfer,
      addBudget,
      updateBudget,
      deleteBudget,
      updateBudgetSpent,
      addDebt,
      updateDebt,
      markDebtClosed,
      getTransactionsByTimeFilter,
      getExpenseByCategory,
      getIncomeVsExpense,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export { toDisplayAccountType };
