import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CurrencyRate } from '../types/currency.types';
import * as currencyService from '../services/currency.service';

interface CurrencyState {
  currencyRates: CurrencyRate[];
  previousRates: CurrencyRate[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

interface CurrencyContextValue extends CurrencyState {
  fetchCurrencyRates: () => Promise<void>;
  clearError: () => void;
}

function ratesEqual(a: CurrencyRate[], b: CurrencyRate[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.rate !== y.rate) return false;
  }
  return true;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [previousRates, setPreviousRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fetchCurrencyRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await currencyService.fetchCurrencyRates();
      if (!isMountedRef.current) return;
      if (list.length === 0) {
        setLoading(false);
        return;
      }
      setCurrencyRates((current) => {
        if (ratesEqual(current, list)) {
          setLastUpdated(list[0]?.updatedAt ?? new Date().toISOString());
          return current;
        }
        setPreviousRates(current);
        setLastUpdated(list[0]?.updatedAt ?? new Date().toISOString());
        return list;
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load currency rates');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencyRates();
  }, [fetchCurrencyRates]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currencyRates,
      previousRates,
      loading,
      error,
      lastUpdated,
      fetchCurrencyRates,
      clearError,
    }),
    [currencyRates, previousRates, loading, error, lastUpdated, fetchCurrencyRates, clearError]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyRates(): CurrencyContextValue {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrencyRates must be used within CurrencyProvider');
  return ctx;
}
