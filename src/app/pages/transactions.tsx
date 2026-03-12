import React, { useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { AddTransactionModal } from '../components/add-transaction-modal';
import { Select } from '../components/select';
import { Search, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs, formatUzsSigned } from '../../utils/currency';
import type { Transaction } from '../../types';

export default function Transactions() {
  const {
    transactions,
    deleteTransaction,
    setTransactionFilters,
    incomeCategories,
    expenseCategories,
    transferCategories,
    loadingTransactions,
  } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const applyFiltersToStore = React.useCallback(
    (type: string, category: string) => {
      setTransactionFilters({
        type: type === 'all' ? undefined : type.toUpperCase(),
        categoryId: category === 'all' ? undefined : category,
      });
    },
    [setTransactionFilters]
  );

  const categoryFilterOptions = useMemo(() => {
    const allCats = [
      ...(expenseCategories ?? []),
      ...(incomeCategories ?? []),
      ...(transferCategories ?? []),
    ];
    const seen = new Set<string>();
    const opts = allCats
      .filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .map((c) => ({ value: c.id, label: c.name }));
    return [{ value: 'all', label: 'All Categories' }, ...opts];
  }, [incomeCategories, expenseCategories, transferCategories]);

  const categoryColorById = useMemo(() => {
    const map = new Map<string, string>();
    [...(expenseCategories ?? []), ...(incomeCategories ?? []), ...(transferCategories ?? [])].forEach((c) => {
      if (c.color) {
        map.set(c.id, c.color);
      }
    });
    return map;
  }, [incomeCategories, expenseCategories, transferCategories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesType = filterType === 'all' || tx.type.toLowerCase() === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, filterCategory, filterType]);

  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const totalExpense = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(t.amount), 0),
    [filteredTransactions]
  );
  const netBalance = totalIncome - totalExpense;

  const isIncome = (tx: Transaction) => tx.type === 'INCOME';
  const isExpense = (tx: Transaction) => tx.type === 'EXPENSE';

  return (
    <div className="p-8 space-y-6" aria-busy={loadingTransactions}>
      {loadingTransactions && <span className="sr-only" aria-live="polite">Loading transactions…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Transactions</h1>
          <p className="text-[#64748B] mt-1">View and manage all your financial transactions</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" aria-hidden />
            Add Transaction
          </Button>
          <Button type="button" variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <label htmlFor="transactions-search" className="sr-only">Search transactions</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
            <input
              id="transactions-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
              aria-label="Search transactions"
            />
          </div>
          <Select
            options={categoryFilterOptions}
            value={filterCategory}
            onChange={(e) => {
              const v = e.target.value;
              setFilterCategory(v);
              applyFiltersToStore(filterType, v);
            }}
            aria-label="Filter by category"
          />
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            value={filterType}
            onChange={(e) => {
              const v = e.target.value;
              setFilterType(v);
              applyFiltersToStore(v, filterCategory);
            }}
            aria-label="Filter by type"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-[#64748B] text-sm mb-1">Total Income</p>
            <h3 className="text-2xl font-bold text-[#10B981]">{formatUzs(totalIncome)}</h3>
            <p className="text-xs text-[#94A3B8] mt-1">This period</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-[#64748B] text-sm mb-1">Total Expense</p>
            <h3 className="text-2xl font-bold text-[#DC2626]">-{formatUzs(totalExpense)}</h3>
            <p className="text-xs text-[#94A3B8] mt-1">This period</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-[#64748B] text-sm mb-1">Net Balance</p>
            <h3 className="text-2xl font-bold text-[#1E40AF]">{formatUzs(netBalance)}</h3>
            <p className="text-xs text-[#94A3B8] mt-1">This period</p>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Description</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Category</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Date</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-[#0F172A]">Amount</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-[#0F172A]">Status</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-[#0F172A]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${
                    index !== filteredTransactions.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isIncome(transaction) ? 'bg-[#D1FAE5]' : 'bg-[#FEE2E2]'
                        }`}
                      >
                        <span className={isIncome(transaction) ? 'text-[#10B981]' : 'text-[#DC2626]'}>
                          {isIncome(transaction) ? '↑' : transaction.type === 'TRANSFER' ? '⇄' : '↓'}
                        </span>
                      </div>
                      <span className="font-medium text-[#0F172A]">{transaction.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant="default"
                      data-color={
                        categoryColorById.get(transaction.category) ??
                        (transaction.categoryId ? categoryColorById.get(transaction.categoryId) : undefined)
                      }
                    >
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={isIncome(transaction) ? 'success' : 'danger'}>
                      {transaction.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-[#64748B] text-sm">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    className={`py-4 px-6 text-right font-semibold ${
                      isIncome(transaction) ? 'text-[#10B981]' : 'text-[#DC2626]'
                    }`}
                  >
                    {transaction.type === 'TRANSFER'
                      ? formatUzs(transaction.amount)
                      : formatUzsSigned(isIncome(transaction) ? transaction.amount : -Math.abs(transaction.amount))}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge variant="success">Completed</Badge>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" aria-label={`Edit ${transaction.title}`}>
                        <Edit2 className="w-4 h-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        aria-label={`Delete ${transaction.title}`}
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-[#64748B]">
            Showing <span className="font-medium text-[#0F172A]">{filteredTransactions.length}</span> of{' '}
            <span className="font-medium text-[#0F172A]">{transactions.length}</span> transactions
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm">Previous</Button>
            <Button type="button" variant="secondary" size="sm">1</Button>
            <Button type="button" variant="primary" size="sm">2</Button>
            <Button type="button" variant="secondary" size="sm">3</Button>
            <Button type="button" variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </Card>

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
