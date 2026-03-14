import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { CurrencyRate } from '../types/currency.types';
import * as currencyService from '../services/currency.service';

interface CurrencyState {
  currencyRates: CurrencyRate[];
  loading: boolean;
  error: string | null;
}

interface CurrencyContextValue extends CurrencyState {
  fetchCurrencyRates: () => Promise<void>;
  clearError: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchCurrencyRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await currencyService.fetchCurrencyRates();
      setCurrencyRates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load currency rates');
      setCurrencyRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencyRates();
  }, [fetchCurrencyRates]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currencyRates,
      loading,
      error,
      fetchCurrencyRates,
      clearError,
    }),
    [currencyRates, loading, error, fetchCurrencyRates, clearError]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyRates(): CurrencyContextValue {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrencyRates must be used within CurrencyProvider');
  return ctx;
}
