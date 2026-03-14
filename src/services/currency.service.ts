/**
 * Currency rates service — exchange rates for conversion and analytics.
 */

import { api } from './api';
import type { CurrencyRate } from '../types/currency.types';

export type { CurrencyRate } from '../types/currency.types';

export async function fetchCurrencyRates(): Promise<CurrencyRate[]> {
  const res = await api<CurrencyRate[] | { success?: boolean; data?: CurrencyRate[] }>('/currency-rates');
  const list = Array.isArray(res) ? res : (res as { data?: CurrencyRate[] }).data;
  if (!Array.isArray(list)) return [];
  return list;
}
