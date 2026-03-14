/**
 * Financial statistics / analytics API types.
 */

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

export interface StatsParams {
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  type?: 'INCOME' | 'EXPENSE';
  period?: StatsPeriod;
  limit?: number;
}
