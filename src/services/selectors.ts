/**
 * Pure selectors for derived financial metrics. Single place for all computed state.
 * Used by FinanceStore and can be reused by Dashboard, Analytics, Budget without duplicating logic.
 */

import type { Account, Transaction, Budget } from '../types';
import type { TimeFilter } from '../utils/dates';
import { getStartOfRange } from '../utils/dates';

const CHART_COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

/** Total balance across all accounts. */
export function selectTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

/** Transactions within the time filter (by date >= startDateStr). */
export function selectTransactionsByTimeFilter(
  transactions: Transaction[],
  filter: TimeFilter
): Transaction[] {
  const { startDateStr } = getStartOfRange(filter);
  return transactions.filter((t) => t.date >= startDateStr);
}

/** Income total for a given month (YYYY-MM). */
export function selectMonthlyIncome(transactions: Transaction[], month: string): number {
  return transactions
    .filter((t) => t.type === 'INCOME' && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Expense total for a given month (YYYY-MM). */
export function selectMonthlyExpense(transactions: Transaction[], month: string): number {
  return transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(month))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** Savings = income - expense for a period. */
export function selectSavings(income: number, expense: number): number {
  return income - expense;
}

/** Expense grouped by category for a time filter. Amounts are positive. */
export function selectExpenseByCategory(
  transactions: Transaction[],
  filter: TimeFilter
): { name: string; value: number; color: string }[] {
  const txs = selectTransactionsByTimeFilter(transactions, filter).filter(
    (t) => t.type === 'EXPENSE'
  );
  const byCategory: Record<string, number> = {};
  txs.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
  });
  return Object.entries(byCategory).map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Income grouped by category for a time filter. */
export function selectIncomeByCategory(
  transactions: Transaction[],
  filter: TimeFilter
): { name: string; value: number; color: string }[] {
  const txs = selectTransactionsByTimeFilter(transactions, filter).filter(
    (t) => t.type === 'INCOME'
  );
  const byCategory: Record<string, number> = {};
  txs.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  });
  return Object.entries(byCategory).map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Income vs expense by month (period = YYYY-MM). Last 6 months. */
export function selectIncomeVsExpenseTimeline(
  transactions: Transaction[],
  filter: TimeFilter
): { period: string; income: number; expense: number }[] {
  const txs = selectTransactionsByTimeFilter(transactions, filter);
  const byMonth: Record<string, { income: number; expense: number }> = {};
  txs.forEach((t) => {
    const key = t.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') byMonth[key].income += t.amount;
    else if (t.type === 'EXPENSE') byMonth[key].expense += t.amount;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([period, { income, expense }]) => ({ period, income, expense }));
}

/** Budgets for a given month. */
export function selectBudgetsByMonth(budgets: Budget[], month: string): Budget[] {
  return budgets.filter((b) => b.month === month);
}
