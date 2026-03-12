/**
 * Smart Alerts — analyzes transactions, budgets, accounts, debts and generates
 * helpful financial notifications. Rule-based; architecture prepared for future AI.
 */

import { formatUzs } from '../utils/currency';

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface FinancialAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  type?: 'unusual_spending' | 'budget_warning' | 'budget_exceeded' | 'spending_spike' | 'low_balance' | 'debt_advice' | 'category_advice';
}

interface TransactionLike {
  id: string;
  type: string;
  amount: number;
  date: string;
  categoryName?: string;
  category?: string;
  title?: string;
}

interface BudgetStatusLike {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  spentPercent: number;
  exceeded?: boolean;
  warning?: boolean;
}

interface AccountLike {
  balance: number;
}

function getWeekBounds(): { thisWeekStart: string; thisWeekEnd: string; lastWeekStart: string; lastWeekEnd: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    thisWeekStart: fmt(thisWeekStart),
    thisWeekEnd: fmt(thisWeekEnd),
    lastWeekStart: fmt(lastWeekStart),
    lastWeekEnd: fmt(lastWeekEnd),
  };
}

function inRange(dateStr: string, from: string, to: string): boolean {
  return dateStr >= from && dateStr <= to;
}

let alertId = 0;
function nextId(): string {
  return `alert-${++alertId}-${Date.now()}`;
}

export interface GenerateAlertsParams {
  transactions: TransactionLike[];
  budgetStatus: BudgetStatusLike[];
  accounts: AccountLike[];
  totalBalance: number;
  monthlyIncome: number;
  totalDebtsOwed: number;
}

/**
 * Generates smart financial alerts from current data.
 * Run when transactions, budgetStatus, accounts, or debts change; cache result in state.
 */
export function generateSmartAlerts(params: GenerateAlertsParams): FinancialAlert[] {
  const { transactions, budgetStatus, accounts, totalBalance, monthlyIncome, totalDebtsOwed } = params;
  const alerts: FinancialAlert[] = [];

  const expenses = transactions.filter((t) => t.type === 'EXPENSE');
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const expenseCount = expenses.length;

  // --- Alert Type 1: Unusual spending (this week vs last week) ---
  const weeks = getWeekBounds();
  const thisWeekExpenses = expenses.filter((t) => inRange(t.date.slice(0, 10), weeks.thisWeekStart, weeks.thisWeekEnd));
  const lastWeekExpenses = expenses.filter((t) => inRange(t.date.slice(0, 10), weeks.lastWeekStart, weeks.lastWeekEnd));
  const thisWeekTotal = thisWeekExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastWeekTotal = lastWeekExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);

  if (lastWeekTotal > 0 && thisWeekTotal > lastWeekTotal * 1.4) {
    const pct = Math.round(((thisWeekTotal / lastWeekTotal) * 100 - 100));
    alerts.push({
      id: nextId(),
      severity: 'warning',
      title: 'Spending Alert',
      message: `You spent ${pct}% more this week than last week.`,
      type: 'unusual_spending',
    });
  }

  // By category: compare this week vs last week per category
  const categorySpendThis = new Map<string, number>();
  const categorySpendLast = new Map<string, number>();
  for (const t of thisWeekExpenses) {
    const cat = t.categoryName || t.category || 'Other';
    categorySpendThis.set(cat, (categorySpendThis.get(cat) ?? 0) + Math.abs(t.amount));
  }
  for (const t of lastWeekExpenses) {
    const cat = t.categoryName || t.category || 'Other';
    categorySpendLast.set(cat, (categorySpendLast.get(cat) ?? 0) + Math.abs(t.amount));
  }
  for (const [cat, thisVal] of categorySpendThis) {
    const lastVal = categorySpendLast.get(cat) ?? 0;
    if (lastVal > 0 && thisVal > lastVal * 1.4) {
      const pct = Math.round(((thisVal / lastVal) * 100 - 100));
      alerts.push({
        id: nextId(),
        severity: 'warning',
        title: 'Unusual Spending',
        message: `You spent ${pct}% more on ${cat} this week than usual.`,
        type: 'unusual_spending',
      });
    }
  }

  // --- Alert Type 2: Budget warning (spentPercent > 80 or > 100) ---
  for (const b of budgetStatus) {
    if (b.spentPercent >= 100) {
      alerts.push({
        id: nextId(),
        severity: 'danger',
        title: 'Budget Exceeded',
        message: `You exceeded your ${b.categoryName} budget.`,
        type: 'budget_exceeded',
      });
    } else if (b.spentPercent > 80) {
      alerts.push({
        id: nextId(),
        severity: 'warning',
        title: 'Budget Warning',
        message: `You have used ${Math.round(b.spentPercent)}% of your ${b.categoryName} budget.`,
        type: 'budget_warning',
      });
    }
  }

  // --- Alert Type 3: Large transaction spike ---
  const avgTransaction = expenseCount > 0 ? totalExpense / expenseCount : 0;
  for (const t of expenses) {
    const amt = Math.abs(t.amount);
    if (avgTransaction > 0 && amt > avgTransaction * 3) {
      alerts.push({
        id: nextId(),
        severity: 'info',
        title: 'Large Expense',
        message: `Large expense detected: ${formatUzs(amt)}`,
        type: 'spending_spike',
      });
      break;
    }
  }

  // --- Alert Type 4: Low balance ---
  if (monthlyIncome > 0 && totalBalance < monthlyIncome * 0.1) {
    alerts.push({
      id: nextId(),
      severity: 'warning',
      title: 'Low Balance',
      message: 'Your balance is running low.',
      type: 'low_balance',
    });
  }

  // --- AI-style recommendations ---
  if (totalDebtsOwed > 0 && monthlyIncome > 0 && totalDebtsOwed > monthlyIncome * 0.5) {
    alerts.push({
      id: nextId(),
      severity: 'warning',
      title: 'Debt Advice',
      message: 'Try to reduce outstanding debt this month.',
      type: 'debt_advice',
    });
  }

  const foodSpent = expenses
    .filter((t) => {
      const c = (t.categoryName || t.category || '').toLowerCase();
      return c.includes('food') || c.includes('ovqat') || c.includes('restaurant') || c.includes('grocery');
    })
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  if (foodSpent > totalExpense * 0.35 && totalExpense > 0) {
    alerts.push({
      id: nextId(),
      severity: 'info',
      title: 'Spending Tip',
      message: 'You may want to reduce restaurant and food spending.',
      type: 'category_advice',
    });
  }

  const transportSpent = expenses
    .filter((t) => {
      const c = (t.categoryName || t.category || '').toLowerCase();
      return c.includes('transport') || c.includes('taxi') || c.includes('fuel') || c.includes('avto');
    })
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  if (transportSpent > totalExpense * 0.25 && totalExpense > 0) {
    alerts.push({
      id: nextId(),
      severity: 'info',
      title: 'Spending Tip',
      message: 'Consider optimizing your transport costs.',
      type: 'category_advice',
    });
  }

  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.title}:${a.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

/**
 * Placeholder for future AI-powered insights.
 * Can replace or augment rule-based alerts when an AI API is available.
 */
export function generateFinancialInsights(transactions: TransactionLike[]): FinancialAlert[] {
  return generateSmartAlerts({
    transactions,
    budgetStatus: [],
    accounts: [],
    totalBalance: 0,
    monthlyIncome: 0,
    totalDebtsOwed: 0,
  });
}
