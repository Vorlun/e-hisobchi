/**
 * Statistics API — summary, timeline, by-category, calendar, top-categories.
 * Used by analytics page; cache by filter (dateFrom, dateTo, period, type).
 */

import { api } from './api';

export type StatsPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  currency: string;
  dateFrom: string;
  dateTo: string;
}

export interface TimelineDataPoint {
  label: string;
  income: number;
  expense: number;
}

export interface CategoryStatsItem {
  categoryId: string;
  categoryName: string;
  type: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface CalendarStatsItem {
  date: string;
  income: number;
  expense: number;
}

export interface TopCategoryItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface GetStatsParams {
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') search.set(k, v);
  });
  const q = search.toString();
  return q ? `?${q}` : '';
}

export async function getSummary(params?: GetStatsParams): Promise<SummaryStats> {
  const res = await api<SummaryStats | { success: boolean; data?: SummaryStats }>(
    `/stats/summary${buildQuery({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      currency: params?.currency,
    })}`
  );
  checkSuccess(res as { success?: boolean });
  const data = (res as { data?: SummaryStats }).data ?? (res as SummaryStats);
  if (data == null || typeof data.totalIncome !== 'number') throw new Error('Invalid summary response');
  return data;
}

export async function getTimeline(
  period: StatsPeriod,
  dateFrom?: string,
  dateTo?: string
): Promise<TimelineDataPoint[]> {
  const res = await api<TimelineDataPoint[] | { success: boolean; data?: TimelineDataPoint[] }>(
    `/stats/timeline${buildQuery({
      period,
      dateFrom,
      dateTo,
    })}`
  );
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: TimelineDataPoint[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid timeline response');
  return list;
}

export async function getCategoryStats(
  type: 'INCOME' | 'EXPENSE',
  dateFrom?: string,
  dateTo?: string
): Promise<CategoryStatsItem[]> {
  const res = await api<CategoryStatsItem[] | { success: boolean; data?: CategoryStatsItem[] }>(
    `/stats/by-category${buildQuery({
      type,
      dateFrom,
      dateTo,
    })}`
  );
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: CategoryStatsItem[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid by-category response');
  return list;
}

export async function getCalendarStats(dateFrom?: string, dateTo?: string): Promise<CalendarStatsItem[]> {
  const res = await api<CalendarStatsItem[] | { success: boolean; data?: CalendarStatsItem[] }>(
    `/stats/calendar${buildQuery({ dateFrom, dateTo })}`
  );
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: CalendarStatsItem[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid calendar response');
  return list;
}

export async function getTopCategories(
  dateFrom?: string,
  dateTo?: string,
  limit?: number
): Promise<TopCategoryItem[]> {
  const res = await api<TopCategoryItem[] | { success: boolean; data?: TopCategoryItem[] }>(
    `/stats/top-categories${buildQuery({
      dateFrom,
      dateTo,
      limit: limit != null ? String(limit) : undefined,
    })}`
  );
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: TopCategoryItem[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid top-categories response');
  return list;
}
