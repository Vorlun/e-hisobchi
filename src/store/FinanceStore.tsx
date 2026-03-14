import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account, AccountType, Transaction, Budget, Debt, DebtDirection, Category } from '../types';
import { createTransaction } from '../services/transactions';
import { createAccount, toAccountType, toDisplayAccountType, generateId } from '../services/accounts';
import { createBudget as createBudgetRecord, getCurrentMonth } from '../services/budgets';
import { createDebt as createDebtRecord } from '../services/debts';
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
import { validateTransaction, validateTransfer } from '../services/validation';
import { getTodayString, getStatsDateRange } from '../utils/dates';
import type { TimeFilter } from '../utils/dates';
import { isApiAvailable } from '../services/api';
import { useAccounts } from './accountStore';
import { useTransactions } from './transactionStore';
import { useTransfers } from './transferStore';
import type { BankCard, CreateCardRequest, UpdateCardRequest } from '../services/cards.api';
import * as cardsApi from '../services/cards.api';
import type { TransactionFilters } from '../types/transaction.types';
import * as categoriesApi from '../services/categories.api';
import * as budgetsApi from '../services/budgets.api';
import type { Transfer } from '../services/transfers.api';
import type { TransferPagination, TransferPurpose } from '../types/transfer.types';
import * as debtsApi from '../services/debts.api';
import * as statisticsApi from '../services/statistics.api';
import type { TransactionType } from '../types';

/** Normalize category for comparison (budgets may use display names; transactions use ids). */
function categoryMatches(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

function mapApiCategoryTypeToLocal(type: string): Category['type'] {
  const lower = type.toLowerCase();
  if (lower === 'income') return 'income';
  if (lower === 'expense') return 'expense';
  if (lower === 'transfer') return 'transfer';
  return 'expense';
}

function mapApiCategoryToCategory(apiCat: categoriesApi.Category): Category {
  return {
    id: apiCat.id,
    name: apiCat.name,
    type: mapApiCategoryTypeToLocal(apiCat.type),
    color: apiCat.color,
    isDefault: apiCat.isDefault,
  };
}

function mapApiDebtToDebt(apiDebt: debtsApi.Debt): Debt {
  return {
    id: apiDebt.id,
    personName: apiDebt.personName,
    amount: apiDebt.amount,
    direction: apiDebt.type,
    status: apiDebt.status,
    date: apiDebt.date,
    dueDate: apiDebt.dueDate,
    notes: apiDebt.description,
    createdAt: apiDebt.date,
    personPhone: apiDebt.personPhone,
    currency: apiDebt.currency,
    overdue: apiDebt.overdue,
  };
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
  cards: BankCard[];
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
  budgetStatus: budgetsApi.BudgetStatus[];
  debts: Debt[];
  debtSummary: debtsApi.DebtSummary | null;
  summaryStats: statisticsApi.SummaryStats | null;
  timelineStats: statisticsApi.TimelineDataPoint[];
  categoryStats: statisticsApi.CategoryStatsItem[];
  incomeCategoryStats: statisticsApi.CategoryStatsItem[];
  calendarStats: statisticsApi.CalendarStatsItem[];
  topCategories: statisticsApi.TopCategoryItem[];
  loadingAccounts: boolean;
  loadingTransactions: boolean;
  loadingTransfers: boolean;
  loadingBudgets: boolean;
  loadingDebts: boolean;
  loadingStats: boolean;
}

export interface DebtFilters {
  type?: debtsApi.DebtType;
  status?: debtsApi.DebtStatus;
}

interface FinanceContextValue extends FinanceState {
  totalBalance: number;
  loadAccounts: () => Promise<void>;
  loadCards: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  setTransactionFilters: (filters: Partial<TransactionFilters>) => void;
  setTransactionPage: (page: number) => void;
  loadCategories: () => Promise<void>;
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
  addTransfer: (fromAccountId: string, toAccountId: string, amount: number, title?: string, purpose?: string) => void | Promise<void>;
  addBudget: (category: string, limit: number) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
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
  const [cards, setCards] = useState<BankCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [transferCategories, setTransferCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<budgetsApi.BudgetStatus[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtSummary, setDebtSummary] = useState<debtsApi.DebtSummary | null>(null);
  const [summaryStats, setSummaryStats] = useState<statisticsApi.SummaryStats | null>(null);
  const [timelineStats, setTimelineStats] = useState<statisticsApi.TimelineDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<statisticsApi.CategoryStatsItem[]>([]);
  const [incomeCategoryStats, setIncomeCategoryStats] = useState<statisticsApi.CategoryStatsItem[]>([]);
  const [calendarStats, setCalendarStats] = useState<statisticsApi.CalendarStatsItem[]>([]);
  const [topCategories, setTopCategories] = useState<statisticsApi.TopCategoryItem[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const lastDebtFiltersRef = useRef<DebtFilters>({});
  const statsRequestIdRef = useRef(0);
  const debtsRequestIdRef = useRef(0);

  const totalBalance = useMemo(() => selectTotalBalance(accounts), [accounts]);

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
    setLoadingBudgets(true);
    try {
      const list = await budgetsApi.getBudgets();
      // Map backend budgets to local Budget shape for UI compatibility.
      const mapped: Budget[] = list.map((b) => ({
        id: b.id,
        category: b.categoryName,
        limit: b.amount,
        spent: 0, // will be filled from budgetStatus
        month: `${b.year}-${String(b.month).padStart(2, '0')}`,
        createdAt: new Date().toISOString(),
      }));
      setBudgets(mapped);
    } catch {
      // handled by api()
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  const loadBudgetStatus = useCallback(async () => {
    if (!isApiAvailable) return;
    try {
      const status = await budgetsApi.getBudgetStatus();
      setBudgetStatus(status);
      // Also sync "spent" into local budgets for components that still read it.
      setBudgets((prev) =>
        prev.map((b) => {
          const s = status.find((st) => st.budgetId === b.id || st.categoryName === b.category);
          if (!s) return b;
          return { ...b, spent: s.spentAmount, limit: s.budgetAmount };
        })
      );
    } catch {
      // handled by api()
    }
  }, []);

  useEffect(() => {
    if (isApiAvailable) {
      loadBudgets();
      loadBudgetStatus();
    }
  }, [loadBudgets, loadBudgetStatus]);

  const loadCategories = useCallback(async () => {
    if (!isApiAvailable) return;
    try {
      const all = await categoriesApi.getCategories();
      const mapped = all.map(mapApiCategoryToCategory);
      setCategories(mapped);
      setIncomeCategories(mapped.filter((c) => c.type === 'income'));
      setExpenseCategories(mapped.filter((c) => c.type === 'expense'));
      setTransferCategories(mapped.filter((c) => c.type === 'transfer'));
    } catch {
      // 401 etc. handled by api()
    }
  }, []);

  useEffect(() => {
    if (isApiAvailable) {
      loadCategories();
    }
  }, [loadCategories]);

  const loadTransfers = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchTransfersFromStore();
  }, [fetchTransfersFromStore]);

  const loadTransferPurposes = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchTransferPurposesFromStore();
  }, [fetchTransferPurposesFromStore]);

  const loadDebts = useCallback(async (filters?: DebtFilters) => {
    if (!isApiAvailable) return;
    debtsRequestIdRef.current += 1;
    const requestId = debtsRequestIdRef.current;
    setLoadingDebts(true);
    try {
      const next = filters ?? lastDebtFiltersRef.current;
      if (filters) lastDebtFiltersRef.current = next;
      const list = await debtsApi.getDebts(next);
      if (debtsRequestIdRef.current !== requestId) return;
      setDebts(list.map(mapApiDebtToDebt));
    } catch {
      // 401 etc. handled by api()
    } finally {
      setLoadingDebts(false);
    }
  }, []);

  const loadDebtSummary = useCallback(async () => {
    if (!isApiAvailable) return;
    try {
      const summary = await debtsApi.getDebtSummary();
      setDebtSummary(summary);
    } catch {
      // 401 etc. handled by api()
    }
  }, []);

  useEffect(() => {
    if (isApiAvailable) {
      loadDebtSummary();
    }
  }, [loadDebtSummary]);

  const timeFilterToPeriod = useCallback((filter: TimeFilter): statisticsApi.StatsPeriod => {
    const map: Record<TimeFilter, statisticsApi.StatsPeriod> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      yearly: 'YEARLY',
    };
    return map[filter];
  }, []);

  const loadStats = useCallback(
    async (filter: TimeFilter) => {
      if (!isApiAvailable) return;
      statsRequestIdRef.current += 1;
      const requestId = statsRequestIdRef.current;
      setLoadingStats(true);
      try {
        const { dateFrom, dateTo } = getStatsDateRange(filter);
        const period = timeFilterToPeriod(filter);
        const [summary, timeline, byCategoryExpense, byCategoryIncome, calendar, top] = await Promise.all([
          statisticsApi.getSummary({ dateFrom, dateTo, currency: 'UZS' }),
          statisticsApi.getTimeline(period, dateFrom, dateTo),
          statisticsApi.getCategoryStats('EXPENSE', dateFrom, dateTo),
          statisticsApi.getCategoryStats('INCOME', dateFrom, dateTo),
          statisticsApi.getCalendarStats(dateFrom, dateTo),
          statisticsApi.getTopCategories(dateFrom, dateTo, 5),
        ]);
        if (statsRequestIdRef.current !== requestId) return;
        setSummaryStats(summary);
        setTimelineStats(timeline);
        setCategoryStats(byCategoryExpense);
        setIncomeCategoryStats(byCategoryIncome);
        setCalendarStats(calendar);
        setTopCategories(top);
      } catch {
        // 401 etc. handled by api()
      } finally {
        setLoadingStats(false);
      }
    },
    [timeFilterToPeriod]
  );

  const loadAccounts = useCallback(async () => {
    if (!isApiAvailable) return;
    await fetchAccountsFromStore();
  }, [fetchAccountsFromStore]);

  const loadCards = useCallback(async () => {
    if (!isApiAvailable) return;
    try {
      const list = await cardsApi.getCards();
      setCards(list);
    } catch {
      // 401 etc. handled by api()
    }
  }, []);

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
      await cardsApi.createCard(data);
      await loadCards();
    },
    [loadCards]
  );

  const updateCard = useCallback(
    async (id: string, data: UpdateCardRequest) => {
      if (!isApiAvailable) return;
      await cardsApi.updateCard(id, data);
      await loadCards();
    },
    [loadCards]
  );

  const archiveCard = useCallback(
    async (id: string) => {
      if (!isApiAvailable) return;
      await cardsApi.archiveCard(id);
      await loadCards();
    },
    [loadCards]
  );

  const lookupCard = useCallback(async (cardNumber: string) => {
    if (!isApiAvailable) return null;
    try {
      return await cardsApi.lookupCard(cardNumber);
    } catch {
      return null;
    }
  }, []);

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
    async (fromAccountId: string, toAccountId: string, amount: number, title = 'Transfer', purpose?: string) => {
      if (!isApiAvailable) return;
      const validation = validateTransfer(fromAccountId, toAccountId, amount, accounts);
      if (!validation.valid) throw new Error(validation.error);
      await createTransferInStore({
        fromAccountId,
        toAccountId,
        amount: Math.abs(amount),
        description: title,
        purpose: purpose || undefined,
      });
      await fetchTransfersFromStore();
      await fetchAccountsFromStore();
    },
    [accounts, createTransferInStore, fetchTransfersFromStore, fetchAccountsFromStore]
  );

  const addBudget = useCallback(
    async (categoryName: string, limit: number) => {
      if (isApiAvailable) {
        // Find matching expense category by name; backend expects categoryId.
        const cat = expenseCategories.find((c) => c.name === categoryName) ?? expenseCategories[0];
        if (!cat) throw new Error('No expense category available for budget');
        const now = new Date();
        await budgetsApi.createBudget({
          categoryId: cat.id,
          amount: limit,
          period: 'MONTHLY',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });
        await loadBudgets();
        await loadBudgetStatus();
        return;
      }
      const month = getCurrentMonth();
      setBudgets((prev) => {
        const existing = prev.find(
          (b) => categoryMatches(b.category, categoryName) && b.month === month
        );
        const spent = existing?.spent ?? 0;
        const newBudget = createBudgetRecord(categoryName, limit, spent);
        return [...prev, newBudget];
      });
    },
    [expenseCategories, loadBudgets, loadBudgetStatus]
  );

  const updateBudget = useCallback(
    async (id: string, data: Partial<Budget>) => {
      if (isApiAvailable) {
        const existing = budgets.find((b) => b.id === id);
        if (!existing) return;
        const cat =
          expenseCategories.find((c) => c.name === (data.category ?? existing.category)) ??
          expenseCategories[0];
        if (!cat) return;
        const [yearStr, monthStr] = existing.month.split('-');
        await budgetsApi.updateBudget(id, {
          categoryId: cat.id,
          amount: data.limit ?? existing.limit,
          period: 'MONTHLY',
          year: Number(yearStr),
          month: Number(monthStr),
        });
        await loadBudgets();
        await loadBudgetStatus();
        return;
      }
      setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    },
    [budgets, expenseCategories, loadBudgets, loadBudgetStatus]
  );

  const updateBudgetSpent = useCallback((categoryId: string, spent: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === categoryId ? { ...b, spent } : b))
    );
  }, []);

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
        await debtsApi.createDebt({
          type: direction,
          personName,
          amount,
          currency: 'UZS',
          description: notes,
          date,
          dueDate,
        });
        await loadDebts();
        await loadDebtSummary();
        return;
      }
      const newDebt = createDebtRecord(personName, amount, direction, date, dueDate, notes);
      setDebts((prev) => [...prev, newDebt]);
    },
    [loadDebts, loadDebtSummary]
  );

  const updateDebt = useCallback(
    async (id: string, data: Partial<Debt>) => {
      if (isApiAvailable) {
        const existing = debts.find((d) => d.id === id);
        if (!existing) return;
        await debtsApi.updateDebt(id, {
          type: existing.direction,
          personName: data.personName ?? existing.personName,
          amount: data.amount ?? existing.amount,
          currency: existing.currency ?? 'UZS',
          description: data.notes ?? existing.notes,
          date: data.date ?? existing.date,
          dueDate: data.dueDate ?? existing.dueDate,
        });
        await loadDebts();
        await loadDebtSummary();
        return;
      }
      setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
    },
    [debts, loadDebts, loadDebtSummary]
  );

  const markDebtClosed = useCallback(
    async (id: string) => {
      if (isApiAvailable) {
        await debtsApi.closeDebt(id);
        await loadDebts();
        await loadDebtSummary();
        return;
      }
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'CLOSED' as const } : d))
      );
    },
    [loadDebts, loadDebtSummary]
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
      cards,
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
      budgets,
      budgetStatus,
      debts,
      debtSummary,
      summaryStats,
      timelineStats,
      categoryStats,
      incomeCategoryStats,
      calendarStats,
      topCategories,
      loadingAccounts,
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
      cards,
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
      budgets,
      budgetStatus,
      debts,
      debtSummary,
      summaryStats,
      timelineStats,
      categoryStats,
      incomeCategoryStats,
      calendarStats,
      topCategories,
      loadingAccounts,
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
