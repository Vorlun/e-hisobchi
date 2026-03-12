import { useCallback } from 'react';
import { formatUzs, formatUzsSigned } from '../utils/currency';

export function useFormatCurrency() {
  const format = useCallback((amount: number, options?: { compact?: boolean; suffix?: 'so\'m' | 'UZS' }) => {
    return formatUzs(amount, options);
  }, []);
  const formatSigned = useCallback((amount: number, options?: { suffix?: 'so\'m' | 'UZS' }) => {
    return formatUzsSigned(amount, options);
  }, []);
  return { formatUzs: format, formatUzsSigned: formatSigned };
}
