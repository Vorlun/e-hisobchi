import React, { useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Modal } from '../components/modal';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { SpendingInsightCard } from '../components/spending-insight-card';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Plus, Edit2 } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';

const CATEGORY_ICONS: Record<string, string> = {
  'Food': '🍔',
  'Food & Dining': '🍔',
  'Transport': '🚗',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Housing': '⚡',
  'Bills & Utilities': '⚡',
  'Health': '🏥',
  'Healthcare': '🏥',
  'Education': '📚',
  'Other': '📌',
};
const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#1E40AF',
  'Food & Dining': '#1E40AF',
  'Transport': '#10B981',
  'Transportation': '#10B981',
  'Shopping': '#F59E0B',
  'Entertainment': '#8B5CF6',
  'Housing': '#EC4899',
  'Bills & Utilities': '#EC4899',
  'Health': '#06B6D4',
  'Healthcare': '#06B6D4',
  'Education': '#06B6D4',
  'Other': '#64748B',
};

export default function Budget() {
  const { budgets, transactions, expenseCategories, budgetStatus, addBudget, loadingBudgets } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [incomeGoal, setIncomeGoal] = useState(19_050_000);
  const [addForm, setAddForm] = useState({ category: '', limit: '' });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === currentMonth), [budgets, currentMonth]);

  const monthBudgetStatus = useMemo(() => {
    // Map by budget/category name for convenience.
    const byCategory = new Map<string, typeof budgetStatus[number]>();
    budgetStatus.forEach((s) => {
      byCategory.set(s.categoryName, s);
    });
    return { byCategory };
  }, [budgetStatus]);

  const totalBudget = useMemo(() => {
    if (budgetStatus.length) {
      return budgetStatus.reduce((sum, s) => sum + s.budgetAmount, 0);
    }
    return monthBudgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgetStatus, monthBudgets]);

  const totalSpent = useMemo(() => {
    if (budgetStatus.length) {
      return budgetStatus.reduce((sum, s) => sum + s.spentAmount, 0);
    }
    return monthBudgets.reduce((sum, b) => sum + b.spent, 0);
  }, [budgetStatus, monthBudgets]);

  const remaining = totalBudget - totalSpent;

  const actualIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'INCOME' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, currentMonth]);

  const getPercentage = (spent: number, limit: number) => (limit ? Math.round((spent / limit) * 100) : 0);
  const getStatus = (percentage: number) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const budgetCategoryOptions = useMemo(() => {
    const base = [{ value: '', label: 'Select category' }];
    const opts =
      expenseCategories?.map((c) => {
        const icon = CATEGORY_ICONS[c.name] ?? '📌';
        return { value: c.id, label: `${icon} ${c.name}` };
      }) ?? [];
    return [...base, ...opts];
  }, [expenseCategories]);

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Math.round(parseFloat(addForm.limit) || 0);
    if (!limit) return;
    const label = budgetCategoryOptions.find((o) => o.value === addForm.category)?.label ?? addForm.category;
    const categoryName = label.replace(/^[^\s]+\s/, '').trim();
    addBudget(categoryName, limit);
    setAddForm({ category: '', limit: '' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="p-8 space-y-6" aria-busy={loadingBudgets}>
      {loadingBudgets && <span className="sr-only" aria-live="polite">Loading budgets…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Budget & Planning</h1>
          <p className="text-[#64748B] mt-1">Set limits and track your spending goals</p>
        </div>
        <Button type="button" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-5 h-5" aria-hidden />
          Add Budget
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-[#1E40AF] to-[#10B981] text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 mb-1">Monthly Income Goal</p>
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-4xl font-bold">{formatUzs(incomeGoal)}</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold">{formatUzs(actualIncome)}</span>
                <span className="text-sm text-white/80">actual</span>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.min((actualIncome / incomeGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-white/80">
                {Math.round((actualIncome / incomeGoal) * 100)}% of goal
              </span>
              {actualIncome >= incomeGoal ? (
                <Badge className="bg-white/20 text-white border-white/30">✓ Goal Achieved</Badge>
              ) : (
                <span className="text-sm text-white/80">
                  {formatUzs(incomeGoal - actualIncome)} remaining
                </span>
              )}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center ml-6">
            <TrendingUp className="w-8 h-8" aria-hidden />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Budget</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalBudget)}</h3>
              <p className="text-xs text-[#94A3B8] mt-2">Monthly limit</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
              <Target className="w-6 h-6 text-[#1E40AF]" aria-hidden />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Spent</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{formatUzs(totalSpent)}</h3>
              <p className="text-xs text-[#94A3B8] mt-2">
                {totalBudget ? `${Math.round((totalSpent / totalBudget) * 100)}% of budget` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#DC2626]" aria-hidden />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Remaining</p>
              <h3 className={`text-2xl font-bold ${remaining >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                {formatUzs(Math.abs(remaining))}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-2">{remaining >= 0 ? 'Under budget' : 'Over budget'}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                remaining >= 0 ? 'bg-[#D1FAE5]' : 'bg-[#FEE2E2]'
              }`}
            >
              {remaining >= 0 ? (
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" aria-hidden />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[#DC2626]" aria-hidden />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">AI Spending Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingInsightCard
            insight={{
              category: 'Food & Dining',
              currentPercentage: actualIncome ? Math.round(((monthBudgets.find((b) => b.category === 'Food')?.spent ?? 0) / actualIncome) * 100) : 0,
              recommendedPercentage: 15,
              amount: monthBudgets.find((b) => b.category === 'Food')?.spent ?? 0,
              income: actualIncome,
              trend: 'up',
              status: 'warning',
            }}
          />
          <SpendingInsightCard
            insight={{
              category: 'Shopping',
              currentPercentage: actualIncome ? Math.round(((monthBudgets.find((b) => b.category === 'Shopping')?.spent ?? 0) / actualIncome) * 100) : 0,
              recommendedPercentage: 10,
              amount: monthBudgets.find((b) => b.category === 'Shopping')?.spent ?? 0,
              income: actualIncome,
              trend: 'up',
              status: 'danger',
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Category Budgets</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthBudgets.map((budget) => {
            const statusEntry = monthBudgetStatus.byCategory.get(budget.category);
            const used = statusEntry?.spentPercent ?? getPercentage(budget.spent, budget.limit);
            const status = getStatus(used);
            const budgetAmount = statusEntry?.budgetAmount ?? budget.limit;
            const spentAmount = statusEntry?.spentAmount ?? budget.spent;
            const remainingCat = budgetAmount - spentAmount;
            const icon = CATEGORY_ICONS[budget.category] ?? '📌';
            const color = CATEGORY_COLORS[budget.category] ?? '#64748B';
            return (
              <Card key={budget.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0F172A]">{budget.category}</h4>
                      <p className="text-sm text-[#64748B]">
                        {formatUzs(spentAmount)} / {formatUzs(budgetAmount)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status}>{used}%</Badge>
                </div>
                <div className="space-y-3">
                  <div className="w-full bg-[#E2E8F0] rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'danger' ? 'bg-[#DC2626]' : status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${Math.min(used, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    {remainingCat >= 0 ? (
                      <>
                        <span className="text-[#10B981] font-medium">{formatUzs(remainingCat)} remaining</span>
                        <span className="text-[#64748B]">Under budget</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#DC2626] font-medium">{formatUzs(Math.abs(remainingCat))} over</span>
                        <span className="text-[#DC2626]">⚠️ Exceeded</span>
                      </>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="w-full flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" aria-hidden />
                    Edit Budget
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Budget vs Actual Overview</h3>
        <div className="space-y-4">
          {monthBudgets.map((budget) => {
            const statusEntry = monthBudgetStatus.byCategory.get(budget.category);
            const budgetAmount = statusEntry?.budgetAmount ?? budget.limit;
            const spentAmount = statusEntry?.spentAmount ?? budget.spent;
            const percentage = statusEntry?.spentPercent ?? getPercentage(spentAmount, budgetAmount);
            const icon = CATEGORY_ICONS[budget.category] ?? '📌';
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="font-medium text-[#0F172A]">{budget.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-[#64748B]">Budget: {formatUzs(budgetAmount)}</p>
                      <p className="text-sm font-medium text-[#0F172A]">Spent: {formatUzs(spentAmount)}</p>
                    </div>
                    <Badge variant={getStatus(percentage)}>{percentage}%</Badge>
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                  <div
                    className="bg-[#10B981] rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                  <div className="bg-[#E2E8F0] rounded-full flex-1" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Budget Category" size="md">
        <form onSubmit={handleAddBudget} className="space-y-4">
          <Select
            label="Category"
            options={budgetCategoryOptions}
            value={addForm.category}
            onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
          />
          <Input
            label="Monthly Budget Limit"
            type="number"
            step="1"
            placeholder="0"
            value={addForm.limit}
            onChange={(e) => setAddForm({ ...addForm, limit: e.target.value })}
            required
          />
          <div className="bg-[#DBEAFE] rounded-xl p-4 border border-[#1E40AF]/20">
            <p className="text-sm text-[#64748B] mb-1">Current Spending</p>
            <p className="text-xs text-[#64748B]">
              Your actual spending will be tracked automatically from transactions
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
