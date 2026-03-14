import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Debt } from '../types';
import type {
  DebtApi,
  DebtSummary,
  DebtFilters,
  CreateDebtRequest,
  UpdateDebtRequest,
} from '../types/debt.types';
import * as debtService from '../services/debt.service';

function mapApiToDebt(api: DebtApi): Debt {
  return {
    id: api.id,
    personName: api.personName,
    amount: api.amount,
    direction: api.type,
    status: api.status,
    date: api.date,
    dueDate: api.dueDate,
    notes: api.description,
    createdAt: api.date,
    personPhone: api.personPhone,
    currency: api.currency,
    overdue: api.overdue,
  };
}

interface DebtState {
  debts: Debt[];
  summary: DebtSummary | null;
  loading: boolean;
  error: string | null;
}

interface DebtContextValue extends DebtState {
  fetchDebts: (filters?: DebtFilters) => Promise<void>;
  fetchDebtSummary: () => Promise<void>;
  createDebt: (data: CreateDebtRequest) => Promise<DebtApi>;
  updateDebt: (id: string, data: UpdateDebtRequest) => Promise<DebtApi>;
  closeDebt: (id: string) => Promise<DebtApi>;
  clearError: () => void;
}

const DebtContext = createContext<DebtContextValue | null>(null);

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFiltersRef = useRef<DebtFilters>({});

  const clearError = useCallback(() => setError(null), []);

  const fetchDebts = useCallback(async (filters?: DebtFilters) => {
    setLoading(true);
    setError(null);
    const next = filters ?? lastFiltersRef.current;
    if (filters) lastFiltersRef.current = next;
    try {
      const list = await debtService.fetchDebts(next);
      setDebts(list.map(mapApiToDebt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debts');
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDebtSummary = useCallback(async () => {
    setError(null);
    try {
      const data = await debtService.fetchDebtSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    fetchDebtSummary();
  }, [fetchDebtSummary]);

  const createDebt = useCallback(async (data: CreateDebtRequest): Promise<DebtApi> => {
    setError(null);
    try {
      const created = await debtService.createDebt(data);
      setDebts((prev) => [...prev, mapApiToDebt(created)]);
      await fetchDebtSummary();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create debt';
      setError(message);
      throw err;
    }
  }, [fetchDebtSummary]);

  const updateDebt = useCallback(async (id: string, data: UpdateDebtRequest): Promise<DebtApi> => {
    setError(null);
    try {
      const updated = await debtService.updateDebt(id, data);
      setDebts((prev) => prev.map((d) => (d.id === id ? mapApiToDebt(updated) : d)));
      await fetchDebtSummary();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update debt';
      setError(message);
      throw err;
    }
  }, [fetchDebtSummary]);

  const closeDebt = useCallback(async (id: string): Promise<DebtApi> => {
    setError(null);
    try {
      const updated = await debtService.closeDebt(id);
      setDebts((prev) => prev.map((d) => (d.id === id ? mapApiToDebt(updated) : d)));
      await fetchDebtSummary();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close debt';
      setError(message);
      throw err;
    }
  }, [fetchDebtSummary]);

  const value = useMemo<DebtContextValue>(
    () => ({
      debts,
      summary,
      loading,
      error,
      fetchDebts,
      fetchDebtSummary,
      createDebt,
      updateDebt,
      closeDebt,
      clearError,
    }),
    [debts, summary, loading, error, fetchDebts, fetchDebtSummary, createDebt, updateDebt, closeDebt, clearError]
  );

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}

export function useDebts(): DebtContextValue {
  const ctx = React.useContext(DebtContext);
  if (!ctx) throw new Error('useDebts must be used within DebtProvider');
  return ctx;
}
