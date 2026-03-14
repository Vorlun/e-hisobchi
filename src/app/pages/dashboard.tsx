import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { AddTransactionModal } from '../components/add-transaction-modal';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreVertical,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
import { useAuth } from '../../store/authStore';
import { formatUzs, formatUzsSigned } from '../../utils/currency';
import type { TimeFilter } from '../../store/FinanceStore';
import { generateSmartAlerts } from '../../services/smartAlerts';
import { SmartAlertsPanel } from '../components/SmartAlertsPanel';
import { generatePredictions } from '../../services/predictiveInsights';
import { PredictiveInsightsWidget } from '../components/PredictiveInsightsWidget';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function formatPeriod(period: string): string {
  const [, month] = period.split('-');
  return MONTH_LABELS[month] ?? period;
}

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState<TimeFilter>('monthly');

  const {
    totalBalance,
    transactions,
    debts,
    budgetStatus,
    accounts,
    budgets,
    getExpenseByCategory,
    getIncomeVsExpense,
    loadingAccounts,
    loadingBudgets,
    loadingDebts,
    loadAccounts,
    loadBudgets,
    loadDebts,
    loadTransactions,
  } = useFinance();
  const { user } = useAuth();

  useEffect(() => {
    loadAccounts();
    loadBudgets();
    loadDebts();
    loadTransactions();
  }, [loadAccounts, loadBudgets, loadDebts, loadTransactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const incomeVsExpenseData = useMemo(() => {
    const raw = getIncomeVsExpense(chartFilter);
    return raw.map(({ period, income, expense }) => ({
      month: formatPeriod(period),
      periodKey: period,
      income,
      expense,
    }));
  }, [chartFilter, getIncomeVsExpense]);

  const chartPeriodTotals = useMemo(() => {
    const totalIncome = incomeVsExpenseData.reduce((s, d) => s + d.income, 0);
    const totalExpense = incomeVsExpenseData.reduce((s, d) => s + d.expense, 0);
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [incomeVsExpenseData]);

  const hasChartData = useMemo(
    () => incomeVsExpenseData.some((d) => d.income > 0 || d.expense > 0),
    [incomeVsExpenseData]
  );

  const expenseByCategory = useMemo(() => getExpenseByCategory(chartFilter), [chartFilter, getExpenseByCategory]);

  const monthlyIncome = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((t) => t.type === 'INCOME' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalDebtsOwed = useMemo(
    () => debts.filter((d) => d.direction === 'BORROWED' && d.status === 'OPEN').reduce((s, d) => s + d.amount, 0),
    [debts]
  );

  const smartAlerts = useMemo(() => {
    return generateSmartAlerts({
      transactions,
      budgetStatus: budgetStatus ?? [],
      accounts: [],
      totalBalance,
      monthlyIncome: monthlyIncome || 0,
      totalDebtsOwed,
    });
  }, [transactions, budgetStatus, totalBalance, monthlyIncome, totalDebtsOwed]);

  const predictionResult = useMemo(
    () =>
      generatePredictions({
        transactions,
        budgetStatus: budgetStatus ?? [],
      }),
    [transactions, budgetStatus]
  );

  const financialRiskScore = useMemo(() => {
    const income = monthlyIncome || 1;
    const expense = monthlyExpense;
    const debtAmount = totalDebtsOwed;
    const savingsBalance = totalBalance;
    let score = 100;
    if (expense > income) score -= 40;
    if (debtAmount > income * 0.5) score -= 30;
    if (savingsBalance < income * 0.2) score -= 20;
    if (income > expense * 1.5) score += 10;
    score = Math.max(0, Math.min(100, score));
    let label: string;
    let recommendation: string;
    let color: string;
    if (score >= 80) {
      label = 'Excellent';
      recommendation = 'Your finances are in great shape. Keep saving and tracking.';
      color = '#10B981';
    } else if (score >= 60) {
      label = 'Good';
      recommendation = 'Your spending is slightly high compared to income. Consider trimming non-essentials.';
      color = '#059669';
    } else if (score >= 40) {
      label = 'Moderate';
      recommendation = 'Expenses or debt are elevated. Focus on reducing spending and paying down debt.';
      color = '#D97706';
    } else {
      label = 'High Risk';
      recommendation = 'Income does not cover expenses or debt is high. Prioritize a budget and debt repayment.';
      color = '#DC2626';
    }
    return { score, label, recommendation, color };
  }, [monthlyIncome, monthlyExpense, totalDebtsOwed, totalBalance]);

  const isIncome = (type: string) => type === 'INCOME';
  const isExpense = (type: string) => type === 'EXPENSE';

  return (
    <div className="p-8 space-y-6" aria-busy={loadingAccounts}>
      {loadingAccounts && <span className="sr-only" aria-live="polite">Updating balance…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="text-[#64748B] mt-1">Welcome back! Here&apos;s your financial overview.</p>
        </div>
        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
          aria-label="Add transaction"
        >
          <Plus className="w-5 h-5" aria-hidden />
          Add Transaction
        </Button>
      </div>

      {user?.emailVerified === false && (
        <div className="rounded-xl border border-dashed border-[#FBBF24] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          Please verify your email to unlock all features.
        </div>
      )}

      {/* Empty states when no API data */}
      {!loadingAccounts && accounts.length === 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
          No accounts yet. Add your first account to get started.
        </div>
      )}
      {!loadingBudgets && budgets.length === 0 && budgetStatus.length === 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
          No budgets created yet.
        </div>
      )}
      {!loadingDebts && debts.length === 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
          No debts yet.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Balance</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalBalance)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#1E40AF]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Monthly Income</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(monthlyIncome)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Monthly Expense</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(monthlyExpense)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-[#DC2626]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Debts</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalDebtsOwed)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <SmartAlertsPanel alerts={smartAlerts} />
      )}

      {/* Predictive Insights */}
      {predictionResult.predictions.length > 0 && (
        <Card>
          <PredictiveInsightsWidget result={predictionResult} />
        </Card>
      )}

      {/* Financial Risk Score */}
      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Financial Risk Score</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: financialRiskScore.color }}
              aria-label={`Score ${financialRiskScore.score}`}
            >
              {financialRiskScore.score}
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Score: {financialRiskScore.score}</p>
              <p className="font-semibold text-[#0F172A]" style={{ color: financialRiskScore.color }}>
                {financialRiskScore.label}
              </p>
            </div>
          </div>
          <p className="text-sm text-[#64748B] max-w-md">{financialRiskScore.recommendation}</p>
        </div>
      </Card>

      {/* Chart period summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!py-4">
          <p className="text-sm text-[#64748B] mb-1">Total Income</p>
          <p className="text-xl font-bold text-[#16a34a]">{formatUzs(chartPeriodTotals.totalIncome)}</p>
          <p className="text-xs text-[#94A3B8] mt-1">so&apos;m · chart period</p>
        </Card>
        <Card className="!py-4">
          <p className="text-sm text-[#64748B] mb-1">Total Expense</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatUzs(chartPeriodTotals.totalExpense)}</p>
          <p className="text-xs text-[#94A3B8] mt-1">so&apos;m · chart period</p>
        </Card>
        <Card className="!py-4">
          <p className="text-sm text-[#64748B] mb-1">Net Balance</p>
          <p className={`text-xl font-bold ${chartPeriodTotals.netBalance >= 0 ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
            {formatUzsSigned(chartPeriodTotals.netBalance)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">so&apos;m · chart period</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">Income vs Expense</h3>
              <p className="text-sm text-[#64748B]">
                {chartFilter === 'yearly' ? 'Last 12 months' : 'Last 6 months'}
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-[#F1F5F9] p-1" role="tablist" aria-label="Chart period">
              <button
                type="button"
                role="tab"
                aria-selected={chartFilter === 'monthly'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'monthly' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                onClick={() => setChartFilter('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartFilter === 'yearly'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'yearly' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                onClick={() => setChartFilter('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
          {!hasChartData ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[#64748B] text-center">No transactions available for this period.</p>
              <p className="text-sm text-[#94A3B8] mt-1 text-center">Add income or expense transactions to see trends.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={incomeVsExpenseData}
                id="dashboard-income-expense-chart"
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} tickFormatter={(v) => formatUzs(v, { compact: true })} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.month ?? ''}
                  formatter={(value: number, name: string) => [formatUzs(value), name === 'income' ? 'Income' : 'Expense']}
                  labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '8px' }}
                  formatter={(value) => <span className="text-sm text-[#64748B]">{value === 'income' ? 'Income' : 'Expense'}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ fill: '#16a34a', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={400}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="expense"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ fill: '#ef4444', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={400}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Expense by Category</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[#64748B] text-sm text-center">No expense data for this period.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart id="dashboard-expense-category-chart">
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={400}
                    animationEasing="ease-out"
                    label={({ name, percent }) => (percent != null ? `${name} ${percent.toFixed(0)}%` : name)}
                    labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number, _, props: { payload?: { name: string; percent?: number } }) => [
                      `${formatUzs(value)}${props.payload?.percent != null ? ` (${props.payload.percent.toFixed(0)}%)` : ''}`,
                      props.payload?.name ?? '',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseByCategory.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-[#64748B]">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-[#0F172A]">
                      {formatUzs(category.value)}
                      {category.percentage != null ? ` (${category.percentage}%)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Recent Transactions</h3>
            <p className="text-sm text-[#64748B]">Your latest financial activities</p>
          </div>
          <Button type="button" variant="ghost" aria-label="View all transactions">
            View All
          </Button>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-[#64748B] text-sm">
            No data yet. Add transactions to see them here.
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748B]">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-medium text-[#0F172A]">{transaction.title}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={isIncome(transaction.type) ? 'success' : 'default'}>
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-[#64748B] text-sm">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-semibold ${
                      isIncome(transaction.type) ? 'text-[#10B981]' : 'text-[#DC2626]'
                    }`}
                  >
                    {transaction.type === 'TRANSFER'
                      ? formatUzs(transaction.amount)
                      : formatUzsSigned(isIncome(transaction.type) ? transaction.amount : -transaction.amount)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      className="text-[#64748B] hover:text-[#0F172A] p-1"
                      aria-label="Transaction actions"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
