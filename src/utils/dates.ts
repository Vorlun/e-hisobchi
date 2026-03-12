/**
 * Centralized date handling for the app.
 * All transaction/budget dates use YYYY-MM-DD or YYYY-MM for consistency with API and filtering.
 */

/** Today's date as YYYY-MM-DD (local date, not UTC). */
export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Month of the given date (or current month) as YYYY-MM. */
export function getMonthString(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Start of range for analytics/time filter; returns date and YYYY-MM-DD string for comparison. */
export function getStartOfRange(filter: TimeFilter): { start: Date; startDateStr: string } {
  const now = new Date();
  let start: Date;
  if (filter === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === 'weekly') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (filter === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }
  const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return { start, startDateStr };
}

/** Date range for stats API from TimeFilter. Returns dateFrom and dateTo (YYYY-MM-DD). */
export function getStatsDateRange(filter: TimeFilter): { dateFrom: string; dateTo: string } {
  const { startDateStr } = getStartOfRange(filter);
  const dateTo = getTodayString();
  return { dateFrom: startDateStr, dateTo };
}
