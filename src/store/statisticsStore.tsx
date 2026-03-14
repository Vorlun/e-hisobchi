import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';
import type { TimeFilter } from '../utils/dates';
import { getStatsDateRange } from '../utils/dates';
import type {
  SummaryStats,
  TimelineDataPoint,
  CategoryStatsItem,
  CalendarStatsItem,
  TopCategoryItem,
  StatsPeriod,
} from '../types/statistics.types';
import * as statisticsService from '../services/statistics.service';

function timeFilterToPeriod(filter: TimeFilter): StatsPeriod {
  const map: Record<TimeFilter, StatsPeriod> = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
  };
  return map[filter];
}

interface StatisticsState {
  summaryStats: SummaryStats | null;
  timelineStats: TimelineDataPoint[];
  categoryStats: CategoryStatsItem[];
  incomeCategoryStats: CategoryStatsItem[];
  calendarStats: CalendarStatsItem[];
  topCategories: TopCategoryItem[];
  loading: boolean;
  error: string | null;
}

interface StatisticsContextValue extends StatisticsState {
  loadStats: (filter: TimeFilter) => Promise<void>;
  clearError: () => void;
}

const StatisticsContext = createContext<StatisticsContextValue | null>(null);

export function StatisticsProvider({ children }: { children: React.ReactNode }) {
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [timelineStats, setTimelineStats] = useState<TimelineDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStatsItem[]>([]);
  const [incomeCategoryStats, setIncomeCategoryStats] = useState<CategoryStatsItem[]>([]);
  const [calendarStats, setCalendarStats] = useState<CalendarStatsItem[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  const loadStats = useCallback(async (filter: TimeFilter) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const { dateFrom, dateTo } = getStatsDateRange(filter);
      const period = timeFilterToPeriod(filter);
      const [summary, timeline, byCategoryExpense, byCategoryIncome, calendar, top] = await Promise.all([
        statisticsService.fetchSummary({ dateFrom, dateTo, currency: 'UZS' }),
        statisticsService.fetchTimeline(period, dateFrom, dateTo),
        statisticsService.fetchCategoryStats('EXPENSE', dateFrom, dateTo),
        statisticsService.fetchCategoryStats('INCOME', dateFrom, dateTo),
        statisticsService.fetchCalendarStats(dateFrom, dateTo),
        statisticsService.fetchTopCategories(dateFrom, dateTo, 5),
      ]);
      if (requestIdRef.current !== requestId) return;
      setSummaryStats(summary);
      setTimelineStats(timeline);
      setCategoryStats(byCategoryExpense);
      setIncomeCategoryStats(byCategoryIncome);
      setCalendarStats(calendar);
      setTopCategories(top);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      setSummaryStats(null);
      setTimelineStats([]);
      setCategoryStats([]);
      setIncomeCategoryStats([]);
      setCalendarStats([]);
      setTopCategories([]);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, []);

  const value = useMemo<StatisticsContextValue>(
    () => ({
      summaryStats,
      timelineStats,
      categoryStats,
      incomeCategoryStats,
      calendarStats,
      topCategories,
      loading,
      error,
      loadStats,
      clearError,
    }),
    [
      summaryStats,
      timelineStats,
      categoryStats,
      incomeCategoryStats,
      calendarStats,
      topCategories,
      loading,
      error,
      loadStats,
      clearError,
    ]
  );

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
}

export function useStatistics(): StatisticsContextValue {
  const ctx = React.useContext(StatisticsContext);
  if (!ctx) throw new Error('useStatistics must be used within StatisticsProvider');
  return ctx;
}
