import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Modal } from '../components/modal';
import { Input } from '../components/input';
import { Badge } from '../components/badge';
import { Plus, User, CheckCircle2, Clock } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';

export default function Debts() {
  const { debts, debtSummary, loadDebts, addDebt, markDebtClosed, loadingDebts } = useFinance();
  const [activeTab, setActiveTab] = useState<'given' | 'owed'>('given');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    personName: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    notes: '',
  });

  const debtType = activeTab === 'given' ? ('LENT' as const) : ('BORROWED' as const);

  useEffect(() => {
    loadDebts({ type: debtType });
  }, [loadDebts, debtType]);

  const currentDebts = debts;
  const openDebts = useMemo(() => currentDebts.filter((d) => d.status === 'OPEN'), [currentDebts]);
  const closedDebts = useMemo(() => currentDebts.filter((d) => d.status === 'CLOSED'), [currentDebts]);
  const totalOpen = useMemo(() => openDebts.reduce((sum, d) => sum + d.amount, 0), [openDebts]);
  const totalClosed = useMemo(() => closedDebts.reduce((sum, d) => sum + d.amount, 0), [closedDebts]);
  const totalForTab = debtSummary
    ? activeTab === 'given'
      ? debtSummary.totalLent
      : debtSummary.totalBorrowed
    : totalOpen + totalClosed;

  const handleAddDebt = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const amountNum = Math.round(parseFloat(formData.amount) || 0);
      if (!formData.personName.trim() || !amountNum) return;
      try {
        await addDebt(
          formData.personName.trim(),
          amountNum,
          activeTab === 'given' ? 'LENT' : 'BORROWED',
          formData.date,
          formData.dueDate || undefined,
          formData.notes || undefined
        );
        setFormData({
          personName: '',
          amount: '',
          date: new Date().toISOString().slice(0, 10),
          dueDate: '',
          notes: '',
        });
        setIsAddModalOpen(false);
      } catch {
        // Error surfaced by store / API
      }
    },
    [formData, activeTab, addDebt]
  );

  return (
    <div className="p-8 space-y-6" aria-busy={loadingDebts}>
      {loadingDebts && <span className="sr-only" aria-live="polite">Loading debts…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Debts & Receivables</h1>
          <p className="text-[#64748B] mt-1">Track money you&apos;ve lent and borrowed</p>
        </div>
        <Button type="button" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-5 h-5" aria-hidden />
          Add Debt
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('given')}
          className={`px-6 py-3 rounded-lg transition-all font-medium ${
            activeTab === 'given'
              ? 'bg-white text-[#1E40AF] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Money Given (I Lent)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('owed')}
          className={`px-6 py-3 rounded-lg transition-all font-medium ${
            activeTab === 'owed'
              ? 'bg-white text-[#1E40AF] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Money Owed (I Borrowed)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Open</p>
              <h3 className="text-2xl font-bold text-[#F59E0B]">{formatUzs(totalOpen)}</h3>
              <p className="text-xs text-[#94A3B8] mt-2">
                {openDebts.length} pending
                {debtSummary != null && debtSummary.overdueCount > 0 && ` · ${debtSummary.overdueCount} overdue`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#F59E0B]" aria-hidden />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total Closed</p>
              <h3 className="text-2xl font-bold text-[#10B981]">{formatUzs(totalClosed)}</h3>
              <p className="text-xs text-[#94A3B8] mt-2">{closedDebts.length} completed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#10B981]" aria-hidden />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Total {activeTab === 'given' ? 'Lent' : 'Borrowed'}</p>
              <h3 className="text-2xl font-bold text-[#1E40AF]">{formatUzs(totalForTab)}</h3>
              <p className="text-xs text-[#94A3B8] mt-2">All time</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
              <User className="w-6 h-6 text-[#1E40AF]" aria-hidden />
            </div>
          </div>
        </Card>
      </div>

      {openDebts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Open Debts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openDebts.map((debt) => (
              <Card key={debt.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center text-white font-semibold">
                      {debt.personName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0F172A]">{debt.personName}</h4>
                      <p className="text-sm text-[#64748B]">
                        {new Date(debt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Open</Badge>
                    {debt.overdue && (
                      <Badge variant="danger" className="shrink-0">Overdue</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#64748B] mb-1">Amount</p>
                    <p className="text-2xl font-bold text-[#0F172A]">{formatUzs(debt.amount)}</p>
                  </div>
                  {debt.dueDate && (
                    <div>
                      <p className="text-sm text-[#64748B] mb-1">Due Date</p>
                      <p className="text-sm font-medium text-[#0F172A]">
                        {new Date(debt.dueDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => markDebtClosed(debt.id)}
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden />
                    Mark as Paid
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {closedDebts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Closed Debts</h3>
          <div className="space-y-3">
            {closedDebts.map((debt) => (
              <Card key={debt.id} className="bg-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#CBD5E1] flex items-center justify-center text-[#64748B] font-semibold">
                      {debt.personName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-medium text-[#0F172A]">{debt.personName}</h4>
                      <p className="text-sm text-[#64748B]">
                        {new Date(debt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0F172A]">{formatUzs(debt.amount)}</p>
                    <Badge variant="success" className="mt-1">Paid</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentDebts.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#94A3B8]" aria-hidden />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No Debts Found</h3>
          <p className="text-[#64748B] mb-6">
            {activeTab === 'given'
              ? "You haven't lent money to anyone yet"
              : "You don't owe money to anyone"}
          </p>
          <Button type="button" onClick={() => setIsAddModalOpen(true)}>
            Add First Debt
          </Button>
        </Card>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add ${activeTab === 'given' ? 'Money Lent' : 'Money Borrowed'}`}
        size="md"
      >
        <form onSubmit={handleAddDebt} className="space-y-4">
          <Input
            label="Person Name"
            placeholder="e.g., John Smith"
            value={formData.personName}
            onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
            required
          />
          <Input
            label="Amount"
            type="number"
            step="1"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <Input
            label="Date Given/Borrowed"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Due Date (Optional)"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Notes (Optional)</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
              rows={3}
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Debt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
