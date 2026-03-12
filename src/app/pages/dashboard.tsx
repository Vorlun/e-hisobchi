import React, { useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { AddTransactionModal } from '../components/add-transaction-modal';
import { Select } from '../components/select';
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
import { formatUzs, formatUzsSigned } from '../../utils/currency';
import type { TimeFilter } from '../../store/FinanceStore';

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
    getExpenseByCategory,
    getIncomeVsExpense,
    loadingAccounts,
  } = useFinance();

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const incomeVsExpenseData = useMemo(() => {
    const raw = getIncomeVsExpense(chartFilter);
    return raw.map(({ period, income, expense }) => ({
      month: formatPeriod(period),
      income,
      expense,
    }));
  }, [chartFilter, getIncomeVsExpense]);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Balance</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalBalance)}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">+12.5%</span>
                <span className="text-xs text-[#94A3B8]">vs last month</span>
              </div>
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
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">+8.2%</span>
                <span className="text-xs text-[#94A3B8]">vs last month</span>
              </div>
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
              <div className="flex items-center gap-1 mt-2">
                <ArrowDownRight className="w-4 h-4 text-[#DC2626]" />
                <span className="text-sm text-[#DC2626]">+15.3%</span>
                <span className="text-xs text-[#94A3B8]">vs last month</span>
              </div>
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
              <div className="flex items-center gap-1 mt-2">
                <ArrowDownRight className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#10B981]">-5.4%</span>
                <span className="text-xs text-[#94A3B8]">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">Income vs Expense</h3>
              <p className="text-sm text-[#64748B]">Last 6 months overview</p>
            </div>
            <Select
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              className="w-40"
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value as TimeFilter)}
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeVsExpenseData} id="dashboard-income-expense-chart">
              <CartesianGrid key="grid-dashboard" strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis key="xaxis-dashboard" dataKey="month" stroke="#64748B" />
              <YAxis key="yaxis-dashboard" stroke="#64748B" tickFormatter={(v) => formatUzs(v, { compact: true })} />
              <Tooltip
                key="tooltip-dashboard"
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px',
                }}
                formatter={(value: number) => [formatUzs(value), '']}
              />
              <Legend key="legend-dashboard" />
              <Line
                key="income-line-dashboard"
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
              />
              <Line
                key="expense-line-dashboard"
                type="monotone"
                dataKey="expense"
                stroke="#DC2626"
                strokeWidth={3}
                dot={{ fill: '#DC2626', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart id="dashboard-expense-category-chart">
              <Pie
                key="pie-dashboard"
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseByCategory.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="tooltip-dashboard-pie"
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [formatUzs(value), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {expenseByCategory.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-[#64748B]">{category.name}</span>
                </div>
                <span className="text-sm font-medium text-[#0F172A]">
                  {formatUzs(category.value)}
                </span>
              </div>
            ))}
          </div>
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
      </Card>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
