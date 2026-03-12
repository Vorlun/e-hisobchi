/**
 * Predictive Insights — analyzes historical expenses and predicts future spending
 * by category. Rule-based; generatePredictionInsights() can later be replaced by AI.
 */

export interface CategoryPrediction {
  category: string;
  predicted: number;
  currentMonthSpend: number;
  avgWeeklySpend: number;
  /** True if predicted exceeds budget (when budgetStatus is provided). */
  exceedsBudget?: boolean;
  budgetAmount?: number;
}

export interface PredictionResult {
  predictions: CategoryPrediction[];
  totalPredicted: number;
  /** Advice message when spending is high or budget at risk. */
  advice: string | null;
  /** Warning when predicted exceeds budget. */
  budgetWarning: string | null;
}

interface TransactionLike {
  type: string;
  amount: number;
  date: string;
  categoryName?: string;
  category?: string;
}

interface BudgetStatusLike {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
}

/** Get start of week (Monday) for a date string YYYY-MM-DD. */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

/** Group expense amounts by category and by week. */
function groupExpensesByCategoryAndWeek(transactions: TransactionLike[]): Map<string, Map<string, number>> {
  const byCategory = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    if (t.type !== 'EXPENSE') continue;
    const dateStr = t.date.slice(0, 10);
    const category = t.categoryName || t.category || 'Other';
    const amount = Math.abs(t.amount);
    let weekMap = byCategory.get(category);
    if (!weekMap) {
      weekMap = new Map<string, number>();
      byCategory.set(category, weekMap);
    }
    const week = getWeekKey(dateStr);
    weekMap.set(week, (weekMap.get(week) ?? 0) + amount);
  }
  return byCategory;
}

/** Current month YYYY-MM. */
function getThisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Number of days left in the current month (including today). */
export function getRemainingDaysInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, last.getDate() - now.getDate() + 1);
}

export interface GeneratePredictionsParams {
  transactions: TransactionLike[];
  budgetStatus?: BudgetStatusLike[];
}

const WEEKS_IN_MONTH = 4;
const MIN_WEEKS_FOR_AVG = 1;

/**
 * Generates category spending predictions from historical transactions.
 * Uses average weekly spend per category and extrapolates to monthly (avg * 4).
 * Optionally refines with remaining-days logic: currentMonthSpend + avgDaily * remainingDays.
 */
export function generatePredictions(params: GeneratePredictionsParams): PredictionResult {
  const { transactions, budgetStatus = [] } = params;
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');
  const byCategoryWeek = groupExpensesByCategoryAndWeek(expenses);
  const thisMonth = getThisMonth();
  const budgetByCategory = new Map<string, number>(budgetStatus.map((b) => [b.categoryName, b.budgetAmount]));

  const predictions: CategoryPrediction[] = [];
  let totalPredicted = 0;

  for (const [category, weekMap] of byCategoryWeek) {
    const weekTotals = Array.from(weekMap.values());
    const totalSpent = weekTotals.reduce((s, v) => s + v, 0);
    const numWeeks = weekTotals.length;
    const avgWeeklySpend = numWeeks >= MIN_WEEKS_FOR_AVG ? totalSpent / numWeeks : 0;

    const currentMonthSpend = expenses
      .filter((t) => (t.categoryName || t.category || 'Other') === category && t.date.startsWith(thisMonth))
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const remainingDays = getRemainingDaysInMonth();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsed = new Date().getDate();
    const avgDailySpend = daysElapsed > 0 ? currentMonthSpend / daysElapsed : avgWeeklySpend / 7;
    const predicted =
      numWeeks >= MIN_WEEKS_FOR_AVG
        ? currentMonthSpend + avgDailySpend * remainingDays
        : currentMonthSpend > 0
          ? (currentMonthSpend / daysElapsed) * daysInMonth
          : avgWeeklySpend * WEEKS_IN_MONTH;

    const budgetAmount = budgetByCategory.get(category);
    const exceedsBudget = Boolean(budgetAmount && predicted > budgetAmount);

    predictions.push({
      category,
      predicted: Math.round(predicted),
      currentMonthSpend,
      avgWeeklySpend: Math.round(avgWeeklySpend),
      exceedsBudget: exceedsBudget || undefined,
      budgetAmount,
    });
    totalPredicted += Math.round(predicted);
  }

  predictions.sort((a, b) => b.predicted - a.predicted);

  let advice: string | null = null;
  let budgetWarning: string | null = null;

  const exceeded = predictions.filter((p) => p.exceedsBudget);
  if (exceeded.length > 0) {
    const names = exceeded.map((p) => p.category).join(', ');
    budgetWarning =
      exceeded.length === 1
        ? `If your current spending continues, you may exceed your ${exceeded[0].category} budget.`
        : `If your current spending continues, you may exceed your budgets (${names}).`;
  }

  const topCategory = predictions[0];
  if (topCategory && topCategory.predicted > 0) {
    const name = topCategory.category.toLowerCase();
    if (name.includes('food') || name.includes('restaurant') || name.includes('ovqat')) {
      advice = 'You may want to reduce restaurant spending to stay within your monthly budget.';
    } else if (name.includes('transport') || name.includes('taxi') || name.includes('avto')) {
      advice = 'Consider optimizing your transport costs to stay on track.';
    } else if (topCategory.exceedsBudget) {
      advice = `You may want to reduce ${topCategory.category} spending to stay within your monthly budget.`;
    }
  }

  return { predictions, totalPredicted, advice, budgetWarning };
}

/**
 * Entry point for prediction insights. Use existing transaction data.
 * Can later be replaced with an AI model that takes the same inputs.
 */
export function generatePredictionInsights(transactions: TransactionLike[]): PredictionResult {
  return generatePredictions({ transactions });
}
