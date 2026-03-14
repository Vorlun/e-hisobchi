import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Budget } from '../types';
import type { BudgetApi, BudgetStatus, CreateBudgetRequest, UpdateBudgetRequest } from '../types/budget.types';
import * as budgetService from '../services/budget.service';

function mapToLegacy(api: BudgetApi[], status: BudgetStatus[]): Budget[] {
  return api.map((b) => {
    const s = status.find((st) => st.budgetId === b.id || st.categoryName === b.categoryName);
    return {
      id: b.id,
      category: b.categoryName,
      limit: b.amount,
      spent: s?.spentAmount ?? 0,
      month: `${b.year}-${String(b.month).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
    };
  });
}

interface BudgetState {
  budgets: Budget[];
  budgetStatus: BudgetStatus[];
  loading: boolean;
  loadingStatus: boolean;
  error: string | null;
}

interface BudgetContextValue extends BudgetState {
  fetchBudgets: () => Promise<void>;
  fetchBudgetStatus: () => Promise<void>;
  createBudget: (data: CreateBudgetRequest) => Promise<BudgetApi>;
  updateBudget: (id: string, data: UpdateBudgetRequest) => Promise<BudgetApi>;
  deleteBudget: (id: string) => Promise<void>;
  clearError: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [apiBudgets, setApiBudgets] = useState<BudgetApi[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budgets = useMemo(() => mapToLegacy(apiBudgets, budgetStatus), [apiBudgets, budgetStatus]);

  const clearError = useCallback(() => setError(null), []);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await budgetService.fetchBudgets();
      setApiBudgets(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
      setApiBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBudgetStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const status = await budgetService.fetchBudgetStatus();
      setBudgetStatus(status);
    } catch {
      setBudgetStatus([]);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    fetchBudgetStatus();
  }, [fetchBudgetStatus]);

  const createBudget = useCallback(async (data: CreateBudgetRequest): Promise<BudgetApi> => {
    setError(null);
    try {
      const created = await budgetService.createBudget(data);
      setApiBudgets((prev) => [...prev, created]);
      await fetchBudgetStatus();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create budget';
      setError(message);
      throw err;
    }
  }, [fetchBudgetStatus]);

  const updateBudget = useCallback(async (id: string, data: UpdateBudgetRequest): Promise<BudgetApi> => {
    setError(null);
    try {
      const updated = await budgetService.updateBudget(id, data);
      setApiBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
      await fetchBudgetStatus();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update budget';
      setError(message);
      throw err;
    }
  }, [fetchBudgetStatus]);

  const deleteBudget = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await budgetService.deleteBudget(id);
      setApiBudgets((prev) => prev.filter((b) => b.id !== id));
      setBudgetStatus((prev) => prev.filter((s) => s.budgetId !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo<BudgetContextValue>(
    () => ({
      budgets,
      budgetStatus,
      loading,
      loadingStatus,
      error,
      fetchBudgets,
      fetchBudgetStatus,
      createBudget,
      updateBudget,
      deleteBudget,
      clearError,
    }),
    [budgets, budgetStatus, loading, loadingStatus, error, fetchBudgets, fetchBudgetStatus, createBudget, updateBudget, deleteBudget, clearError]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgets(): BudgetContextValue {
  const ctx = React.useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider');
  return ctx;
}
