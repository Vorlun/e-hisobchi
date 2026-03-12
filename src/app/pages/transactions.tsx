import React, { useMemo, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { AddTransactionModal } from '../components/add-transaction-modal';
import { Select } from '../components/select';
import { Search, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs, formatUzsSigned } from '../../utils/currency';
import { getQuickDateRange } from '../../utils/dates';
import type { Transaction } from '../../types';

export default function Transactions() {
  const {
    transactions,
    accounts,
    deleteTransaction,
    setTransactionFilters,
    setTransactionPage,
    transactionPagination,
    incomeCategories,
    expenseCategories,
    transferCategories,
    loadingTransactions,
  } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const applyFiltersToStore = useCallback(
    (opts: { type?: string; category?: string; accountId?: string; dateFrom?: string; dateTo?: string }) => {
      setTransactionFilters({
        type: opts.type === 'all' || !opts.type ? undefined : opts.type.toUpperCase(),
        categoryId: opts.category === 'all' || !opts.category ? undefined : opts.category,
        accountId: opts.accountId === 'all' || !opts.accountId ? undefined : opts.accountId,
        dateFrom: opts.dateFrom || undefined,
        dateTo: opts.dateTo || undefined,
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
    return [...transactions]
      .filter((tx) => {
        const matchesSearch = !searchTerm || tx.title.toLowerCase().includes(searchTerm.toLowerCase())
          || (tx.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const { page, size, totalPages, totalElements } = transactionPagination;
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 0 && newPage < totalPages) {
        setTransactionPage(newPage);
      }
    },
    [totalPages, setTransactionPage]
  );

  const exportToExcel = useCallback(() => {
    const rows = filteredTransactions.map((tx) => ({
      Date: new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      Type: tx.type,
      Category: tx.categoryName ?? tx.category ?? '',
      Account: tx.accountName ?? '',
      Amount: tx.type === 'EXPENSE' ? -Math.abs(tx.amount) : tx.amount,
      Currency: 'UZS',
      Description: tx.title || tx.description || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transactions.xlsx');
  }, [filteredTransactions]);

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
  const applyQuickRange = useCallback(
    (preset: 'today' | 'this_week' | 'this_month') => {
      const { dateFrom, dateTo } = getQuickDateRange(preset);
      setDateFrom(dateFrom);
      setDateTo(dateTo);
      applyFiltersToStore({ type: filterType, category: filterCategory, accountId: filterAccount, dateFrom, dateTo });
    },
    [applyFiltersToStore, filterType, filterCategory, filterAccount]
  );

  const typeFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
  ] as const;

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
          <Button type="button" variant="secondary" className="flex items-center gap-2" onClick={exportToExcel}>
            <Download className="w-4 h-4" aria-hidden />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#64748B]">Quick filters:</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyQuickRange('today')}
              aria-pressed={dateFrom === dateTo && dateFrom !== ''}
            >
              Today
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange('this_week')}>
              This Week
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange('this_month')}>
              This Month
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#64748B]">Type:</span>
            {typeFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setFilterType(opt.value);
                  applyFiltersToStore({ type: opt.value, category: filterCategory, accountId: filterAccount, dateFrom, dateTo });
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterType === opt.value
                    ? 'bg-[#1E40AF] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                }`}
                aria-pressed={filterType === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <label htmlFor="transactions-search" className="sr-only">Search description</label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
              <input
                id="transactions-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description..."
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                aria-label="Search description"
              />
            </div>
            <Select
              options={categoryFilterOptions}
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                applyFiltersToStore({ type: filterType, category: e.target.value, accountId: filterAccount, dateFrom, dateTo });
              }}
              aria-label="Filter by category"
            />
            <Select
              options={[
                { value: 'all', label: 'All Accounts' },
                ...(accounts ?? []).map((a) => ({ value: a.id, label: a.name })),
              ]}
              value={filterAccount}
              onChange={(e) => {
                setFilterAccount(e.target.value);
                applyFiltersToStore({ type: filterType, category: filterCategory, accountId: e.target.value, dateFrom, dateTo });
              }}
              aria-label="Filter by account"
            />
            <div>
              <label htmlFor="transactions-date-from" className="sr-only">Date from</label>
              <input
                id="transactions-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  applyFiltersToStore({ type: filterType, category: filterCategory, accountId: filterAccount, dateFrom: e.target.value, dateTo });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                aria-label="Date from"
              />
            </div>
            <div>
              <label htmlFor="transactions-date-to" className="sr-only">Date to</label>
              <input
                id="transactions-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  applyFiltersToStore({ type: filterType, category: filterCategory, accountId: filterAccount, dateFrom, dateTo: e.target.value });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                aria-label="Date to"
              />
            </div>
          </div>
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Category</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Account</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-[#0F172A]">Amount</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Description</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-[#0F172A]">Purpose</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-[#0F172A]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => {
                const typeColor =
                  transaction.type === 'INCOME'
                    ? { bg: 'bg-[#D1FAE5]', text: 'text-[#10B981]' }
                    : transaction.type === 'EXPENSE'
                      ? { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' }
                      : { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' };
                return (
                  <tr
                    key={transaction.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      index !== filteredTransactions.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                    }`}
                  >
                    <td className="py-4 px-6 text-[#64748B] text-sm">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColor.bg}`}>
                          <span className={typeColor.text}>
                            {transaction.type === 'INCOME' ? '↑' : transaction.type === 'TRANSFER' ? '⇄' : '↓'}
                          </span>
                        </div>
                        <span className={`font-medium ${typeColor.text}`}>{transaction.type}</span>
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
                        {transaction.categoryName ?? transaction.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#0F172A]">
                      {transaction.accountName ?? accounts?.find((a) => a.id === transaction.accountId)?.name ?? '—'}
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-semibold ${typeColor.text}`}
                    >
                      {transaction.type === 'TRANSFER'
                        ? formatUzs(transaction.amount)
                        : formatUzsSigned(
                            transaction.type === 'INCOME' ? transaction.amount : -Math.abs(transaction.amount)
                          )}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#64748B]">
                      {transaction.title || transaction.description || '—'}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#64748B]">
                      {transaction.type === 'TRANSFER'
                        ? transaction.transferPurposeName ?? transaction.description ?? '—'
                        : '—'}
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
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-[#64748B]">
            Showing <span className="font-medium text-[#0F172A]">{startItem}</span>–<span className="font-medium text-[#0F172A]">{endItem}</span> of{' '}
            <span className="font-medium text-[#0F172A]">{totalElements}</span> transactions
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="secondary" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 0}>
              Previous
            </Button>
            {(() => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const end = Math.min(totalPages, start + 5);
              return Array.from({ length: end - start }, (_, i) => start + i).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={p === page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => goToPage(p)}
                >
                  {p + 1}
                </Button>
              ));
            })()}
            <Button type="button" variant="secondary" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
