import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { CircleDollarSign, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrencyRates } from '../../hooks/useCurrencyRates';
import type { CurrencyRate } from '../../types/currency.types';

function formatLastUpdated(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  } catch {
    return iso;
  }
}

function getRateDirection(
  current: CurrencyRate,
  previousRates: CurrencyRate[]
): 'up' | 'down' | null {
  const prev = previousRates.find((p) => p.id === current.id);
  if (!prev || prev.rate === current.rate) return null;
  return current.rate > prev.rate ? 'up' : 'down';
}

export default function Currency() {
  const {
    currencyRates,
    previousRates,
    loading,
    error,
    lastUpdated,
    fetchCurrencyRates,
  } = useCurrencyRates();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCurrencyRates();
  }, [fetchCurrencyRates]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchCurrencyRates();
    }, 60_000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchCurrencyRates]);

  const handleRefresh = useCallback(() => {
    fetchCurrencyRates();
  }, [fetchCurrencyRates]);

  const hasRates = currencyRates && currencyRates.length > 0;
  const showFallbackWarning = Boolean(error && hasRates);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Valyuta kurslari</h1>
          <p className="text-[#64748B] mt-1">Current currency exchange rates</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdated && (
            <p className="text-sm text-[#64748B]">
              Yangilangan: {formatLastUpdated(lastUpdated)}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Yangilash
          </Button>
        </div>
      </div>

      {loading && !hasRates && (
        <p className="text-sm text-[#64748B]" aria-busy>
          Loading rates…
        </p>
      )}

      {showFallbackWarning && (
        <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl" role="alert">
          <p className="text-sm text-[#B45309]">{error}</p>
          <p className="text-xs text-[#64748B] mt-1">Showing last available rates.</p>
        </div>
      )}

      {!loading && !hasRates && !showFallbackWarning && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!hasRates && !loading && !showFallbackWarning && (
        <Card className="p-8 text-center">
          <CircleDollarSign className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" aria-hidden />
          <p className="text-[#64748B]">No currency rates available.</p>
        </Card>
      )}

      {hasRates && (
        <div className="overflow-x-auto">
          <table className="w-full border border-[#E2E8F0] rounded-xl overflow-hidden">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-[#0F172A]">Currency</th>
                <th className="text-right p-3 text-sm font-medium text-[#0F172A]">Rate</th>
                <th className="text-left p-3 text-sm font-medium text-[#0F172A]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {currencyRates.map((r) => (
                <CurrencyRateRow
                  key={r.id}
                  rate={r}
                  previousRates={previousRates}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CurrencyRateRow({
  rate,
  previousRates,
}: {
  rate: CurrencyRate;
  previousRates: CurrencyRate[];
}) {
  const direction = useMemo(
    () => getRateDirection(rate, previousRates),
    [rate, previousRates]
  );

  return (
    <tr>
      <td className="p-3 text-[#0F172A]">{rate.currency}</td>
      <td className="p-3 text-right font-medium text-[#0F172A]">
        <span className="inline-flex items-center gap-1 justify-end">
          {direction === 'up' && (
            <TrendingUp className="w-4 h-4 text-[#10B981]" aria-label="Increased" />
          )}
          {direction === 'down' && (
            <TrendingDown className="w-4 h-4 text-[#DC2626]" aria-label="Decreased" />
          )}
          {rate.rate}
        </span>
      </td>
      <td className="p-3 text-sm text-[#64748B]">{rate.rateDate ?? '—'}</td>
    </tr>
  );
}
