/**
 * Statistics service — summary, timeline, category, calendar, top categories.
 */

import * as statisticsApi from './statistics.api';
import type {
  SummaryStats,
  TimelineDataPoint,
  CategoryStatsItem,
  CalendarStatsItem,
  TopCategoryItem,
  StatsPeriod,
} from '../types/statistics.types';

export type {
  SummaryStats,
  TimelineDataPoint,
  CategoryStatsItem,
  CalendarStatsItem,
  TopCategoryItem,
  StatsPeriod,
} from '../types/statistics.types';

export async function fetchSummary(params?: {
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
}): Promise<SummaryStats> {
  return statisticsApi.getSummary(params);
}

export async function fetchTimeline(
  period: StatsPeriod,
  dateFrom?: string,
  dateTo?: string
): Promise<TimelineDataPoint[]> {
  return statisticsApi.getTimeline(period, dateFrom, dateTo);
}

export async function fetchCategoryStats(
  type: 'INCOME' | 'EXPENSE',
  dateFrom?: string,
  dateTo?: string
): Promise<CategoryStatsItem[]> {
  return statisticsApi.getCategoryStats(type, dateFrom, dateTo);
}

export async function fetchCalendarStats(
  dateFrom?: string,
  dateTo?: string
): Promise<CalendarStatsItem[]> {
  return statisticsApi.getCalendarStats(dateFrom, dateTo);
}

export async function fetchTopCategories(
  dateFrom?: string,
  dateTo?: string,
  limit?: number
): Promise<TopCategoryItem[]> {
  return statisticsApi.getTopCategories(dateFrom, dateTo, limit);
}
