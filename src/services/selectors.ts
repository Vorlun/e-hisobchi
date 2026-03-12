/**
 * Pure selectors for derived financial metrics. Single place for all computed state.
 * Used by FinanceStore and can be reused by Dashboard, Analytics, Budget without duplicating logic.
 */

import type { Account, Transaction, Budget } from '../types';
import type { TimeFilter } from '../utils/dates';
import { getStartOfRange } from '../utils/dates';

const CHART_COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

/** Category name to chart color (fintech-style palette). */
const CATEGORY_CHART_COLORS: Record<string, string> = {
  food: '#3B82F6',
  transport: '#8B5CF6',
  shopping: '#F97316',
  utilities: '#22C55E',
  health: '#EC4899',
  entertainment: '#EAB308',
  education: '#06B6D4',
  other: '#64748B',
};

/** Total balance across all accounts. */
export function selectTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

/** Normalize transaction date to YYYY-MM-DD for comparison (handles ISO strings). */
function toDateStr(d: string): string {
  return d.slice(0, 10);
}

/** Transactions within the time filter (by date >= startDateStr). */
export function selectTransactionsByTimeFilter(
  transactions: Transaction[],
  filter: TimeFilter
): Transaction[] {
  const { startDateStr } = getStartOfRange(filter);
  return transactions.filter((t) => toDateStr(t.date) >= startDateStr);
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

/** Expense grouped by category for a time filter. Amounts are positive. Includes percentage. */
export function selectExpenseByCategory(
  transactions: Transaction[],
  filter: TimeFilter
): { name: string; value: number; color: string; percentage?: number }[] {
  const txs = selectTransactionsByTimeFilter(transactions, filter).filter(
    (t) => t.type === 'EXPENSE'
  );
  const byCategory: Record<string, number> = {};
  txs.forEach((t) => {
    const name = t.categoryName || t.category || 'Other';
    byCategory[name] = (byCategory[name] ?? 0) + Math.abs(t.amount);
  });
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  return Object.entries(byCategory).map(([name, value], i) => {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    const color = CATEGORY_CHART_COLORS[key] ?? CHART_COLORS[i % CHART_COLORS.length];
    return {
      name,
      value,
      color,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    };
  });
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

/** Last N months as YYYY-MM (chronological for chart). */
function getLastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

/** Income vs expense by month. Monthly = last 6 months, Yearly = last 12 months. Fills missing months with 0. */
export function selectIncomeVsExpenseTimeline(
  transactions: Transaction[],
  filter: TimeFilter
): { period: string; income: number; expense: number }[] {
  const monthsCount = filter === 'yearly' ? 12 : 6;
  const monthKeys = getLastNMonthKeys(monthsCount);
  const today = new Date();
  const dateTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateFrom = monthKeys[0] + '-01';

  const byMonth: Record<string, { income: number; expense: number }> = {};
  monthKeys.forEach((k) => {
    byMonth[k] = { income: 0, expense: 0 };
  });

  transactions.forEach((t) => {
    const dateStr = toDateStr(t.date);
    if (dateStr < dateFrom || dateStr > dateTo) return;
    const key = dateStr.slice(0, 7);
    if (!byMonth[key]) return;
    if (t.type === 'INCOME') byMonth[key].income += t.amount;
    else if (t.type === 'EXPENSE') byMonth[key].expense += Math.abs(t.amount);
  });

  return monthKeys.map((period) => ({
    period,
    income: byMonth[period].income,
    expense: byMonth[period].expense,
  }));
}

/** Budgets for a given month. */
export function selectBudgetsByMonth(budgets: Budget[], month: string): Budget[] {
  return budgets.filter((b) => b.month === month);
}
