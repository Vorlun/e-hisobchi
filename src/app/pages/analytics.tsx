import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Badge } from '../components/badge';
import { Select } from '../components/select';
import { SpendingInsightCard } from '../components/spending-insight-card';
import { FinancialRiskScore } from '../components/financial-risk-score';
import { MonthlyForecast } from '../components/monthly-forecast';
import { AutoCategoryDetection } from '../components/auto-category-detection';
import { SpendingPrediction } from '../components/spending-prediction';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  Brain,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';
import type { TimeFilter } from '../../store/FinanceStore';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};
function formatPeriod(period: string): string {
  const [, m] = period.split('-');
  return MONTH_LABELS[m] ?? period;
}

const CATEGORY_CHART_COLORS = [
  '#1E40AF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B', '#84CC16',
];

export default function Analytics() {
  const {
    getIncomeVsExpense,
    getExpenseByCategory,
    transactions,
    accounts,
    summaryStats,
    timelineStats,
    categoryStats,
    incomeCategoryStats,
    loadStats,
    loadingStats,
  } = useFinance();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');

  useEffect(() => {
    loadStats(timeFilter);
  }, [loadStats, timeFilter]);

  const monthlyTrend = useMemo(() => {
    if (timelineStats.length > 0) {
      return timelineStats.map(({ label, income, expense }) => ({
        month: label,
        income,
        expense,
        savings: income - expense,
      }));
    }
    const raw = getIncomeVsExpense(timeFilter);
    return raw.map(({ period, income, expense }) => ({
      month: formatPeriod(period),
      income,
      expense,
      savings: income - expense,
    }));
  }, [timeFilter, getIncomeVsExpense, timelineStats]);

  const expenseByCategory = useMemo(() => {
    if (categoryStats.length > 0) {
      return categoryStats.map((c, i) => ({
        name: c.categoryName,
        value: c.amount,
        color: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
      }));
    }
    return getExpenseByCategory(timeFilter);
  }, [timeFilter, getExpenseByCategory, categoryStats]);

  const avgIncome = useMemo(() => {
    if (timelineStats.length > 0) {
      const sum = timelineStats.reduce((s, d) => s + d.income, 0);
      return sum / timelineStats.length;
    }
    if (summaryStats) return summaryStats.totalIncome;
    if (monthlyTrend.length === 0) return 0;
    return monthlyTrend.reduce((s, d) => s + d.income, 0) / monthlyTrend.length;
  }, [monthlyTrend, summaryStats, timelineStats]);
  const avgExpense = useMemo(() => {
    if (timelineStats.length > 0) {
      const sum = timelineStats.reduce((s, d) => s + d.expense, 0);
      return sum / timelineStats.length;
    }
    if (summaryStats) return summaryStats.totalExpense;
    if (monthlyTrend.length === 0) return 0;
    return monthlyTrend.reduce((s, d) => s + d.expense, 0) / monthlyTrend.length;
  }, [monthlyTrend, summaryStats, timelineStats]);
  const totalSavings = useMemo(() => {
    if (summaryStats) return summaryStats.netBalance;
    return monthlyTrend.reduce((s, d) => s + (d.income - d.expense), 0);
  }, [monthlyTrend, summaryStats]);
  const savingsRate = useMemo(() => {
    if (summaryStats && summaryStats.totalIncome) {
      return Math.round(((summaryStats.netBalance) / summaryStats.totalIncome) * 1000) / 10;
    }
    const totalIncome = monthlyTrend.reduce((s, d) => s + d.income, 0);
    const totalExpense = monthlyTrend.reduce((s, d) => s + d.expense, 0);
    return totalIncome ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10 : 0;
  }, [monthlyTrend, summaryStats]);

  const categoryComparison = useMemo(() => {
    return expenseByCategory.map((c) => ({
      category: c.name,
      current: c.value,
      previous: Math.round(c.value * 0.85),
    }));
  }, [expenseByCategory]);

  const savingsBreakdown = useMemo(
    () =>
      accounts.map((a) => ({ name: a.name, value: a.balance, color: a.color })),
    [accounts]
  );

  const incomeSourcesData = useMemo(() => {
    if (incomeCategoryStats.length > 0) {
      const total = incomeCategoryStats.reduce((s, c) => s + c.amount, 0);
      return incomeCategoryStats.map((c) => ({
        source: c.categoryName,
        amount: c.amount,
        percentage: c.percentage ?? (total ? Math.round((c.amount / total) * 100) : 0),
      }));
    }
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'INCOME')
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      });
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return Object.entries(byCategory).map(([source, amount]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      amount,
      percentage: total ? Math.round((amount / total) * 100) : 0,
    }));
  }, [transactions, incomeCategoryStats]);

  return (
    <div className="p-8 space-y-6" aria-busy={loadingStats}>
      {loadingStats && <span className="sr-only" aria-live="polite">Loading analytics…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-[#64748B] mt-1">Deep insights into your financial performance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                viewMode === 'chart'
                  ? 'bg-white text-[#1E40AF] shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Charts
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#1E40AF] shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Calendar
            </button>
          </div>
          <Select
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            className="w-40"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Avg Monthly Income</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(avgIncome)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">+14.2%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Avg Monthly Expense</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(avgExpense)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-[#DC2626]" />
                <span className="text-sm text-[#DC2626]">+8.7%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-[#DC2626]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Savings Rate</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{savingsRate}%</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">+5.3%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#1E40AF]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Savings</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalSavings)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">+22.1%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Income vs Expense vs Savings Trend */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#0F172A]">Financial Trend Analysis</h3>
          <p className="text-sm text-[#64748B]">Track your income, expenses, and savings over time</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyTrend} id="financial-trend-chart">
            <CartesianGrid key="grid-financial" strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis key="xaxis-financial" dataKey="month" stroke="#64748B" />
            <YAxis key="yaxis-financial" stroke="#64748B" tickFormatter={(v) => formatUzs(v, { compact: true })} />
            <Tooltip
              key="tooltip-financial"
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px',
              }}
              formatter={(value: number) => [formatUzs(value), '']}
            />
            <Legend key="legend-financial" />
            <Line 
              key="income-line"
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              key="expense-line"
              type="monotone" 
              dataKey="expense" 
              stroke="#DC2626" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              key="savings-line"
              type="monotone" 
              dataKey="savings" 
              stroke="#1E40AF" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Financial Insights - Premium Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">AI Financial Insights</h2>
                <p className="text-sm text-[#64748B]">Intelligent analytics powered by machine learning</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1E40AF]/10 to-[#10B981]/10 rounded-xl border border-[#1E40AF]/20">
            <Sparkles className="w-4 h-4 text-[#1E40AF]" />
            <span className="text-sm font-semibold text-[#1E40AF]">AI Powered</span>
          </div>
        </div>

        {/* Auto Category Detection */}
        <AutoCategoryDetection />

        {/* Spending Recommendations */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Smart Spending Recommendations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingInsightCard
              insight={{
                category: 'Food & Dining',
                currentPercentage: 38,
                recommendedPercentage: 30,
                amount: 2736000,
                income: 7200000,
                trend: 'up',
                status: 'warning'
              }}
            />
            <SpendingInsightCard
              insight={{
                category: 'Shopping',
                currentPercentage: 22,
                recommendedPercentage: 15,
                amount: 1584000,
                income: 7200000,
                trend: 'up',
                status: 'danger'
              }}
            />
          </div>
        </div>

        {/* Financial Risk Score */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Financial Risk Assessment</h3>
          <FinancialRiskScore 
            score={67}
            factors={[
              { name: 'Spending Ratio', impact: 'high', value: 'High food expenses (17%)' },
              { name: 'Active Debts', impact: 'high', value: '3 active debts' },
              { name: 'Budget Overruns', impact: 'medium', value: '2 categories over budget' },
              { name: 'Income Stability', impact: 'low', value: 'Stable income pattern' },
            ]}
          />
        </div>

        {/* Spending Prediction */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Balance Duration Forecast</h3>
          <SpendingPrediction 
            currentBalance={3200000}
            averageDailySpending={120000}
            currency="UZS"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2E8F0]"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#F8FAFC] px-4 text-sm text-[#64748B] font-medium">
            Traditional Analytics
          </span>
        </div>
      </div>

      {/* Category Comparison & Savings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#0F172A]">Category Spending Comparison</h3>
            <p className="text-sm text-[#64748B]">Current vs Previous Period</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryComparison} id="category-comparison-chart">
              <CartesianGrid key="grid-category" strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis key="xaxis-category" dataKey="category" stroke="#64748B" />
              <YAxis key="yaxis-category" stroke="#64748B" tickFormatter={(v) => formatUzs(v, { compact: true })} />
              <Tooltip
                key="tooltip-category"
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [formatUzs(value), '']}
              />
              <Legend key="legend-category" />
              <Bar key="previous-bar" dataKey="previous" fill="#CBD5E1" radius={[8, 8, 0, 0]} name="Previous Period" />
              <Bar key="current-bar" dataKey="current" fill="#1E40AF" radius={[8, 8, 0, 0]} name="Current Period" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#0F172A]">Savings Breakdown</h3>
            <p className="text-sm text-[#64748B]">Distribution of your savings</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart id="savings-breakdown-chart">
              <Pie
                key="pie-savings"
                data={savingsBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {savingsBreakdown.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="tooltip-savings"
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [formatUzs(value), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {savingsBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#64748B]">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-[#0F172A]">
                  {formatUzs(item.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Income Sources */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#0F172A]">Income Sources</h3>
          <p className="text-sm text-[#64748B]">Breakdown of your income streams</p>
        </div>
        <div className="space-y-4">
          {incomeSourcesData.map((source) => (
            <div key={source.source} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center text-white font-semibold">
                    {source.percentage}%
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A]">{source.source}</p>
                    <p className="text-sm text-[#64748B]">{formatUzs(source.amount)} per month</p>
                  </div>
                </div>
                <Badge variant="info">{source.percentage}%</Badge>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E40AF] to-[#10B981]"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Forecast */}
      <div>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Predictive Monthly Forecast</h3>
        <MonthlyForecast 
          currentMonthSpending={4100}
          predictedExpenses={[
            { category: 'Food & Dining', amount: 1280, confidence: 92, recurring: true },
            { category: 'Bills & Utilities', amount: 950, confidence: 95, recurring: true },
            { category: 'Transportation', amount: 820, confidence: 88, recurring: true },
            { category: 'Shopping', amount: 600, confidence: 72, recurring: false },
            { category: 'Entertainment', amount: 380, confidence: 65, recurring: false },
            { category: 'Healthcare', amount: 250, confidence: 58, recurring: false },
          ]}
          historicalData={[
            { month: 'Nov', actual: 3200, predicted: null },
            { month: 'Dec', actual: 3900, predicted: null },
            { month: 'Jan', actual: 3500, predicted: null },
            { month: 'Feb', actual: 4100, predicted: null },
            { month: 'Mar', actual: null, predicted: 4280 },
          ]}
        />
      </div>
    </div>
  );
}