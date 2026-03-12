import React, { useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Badge } from '../components/badge';
import { ArrowRight, ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';
import { getTodayString } from '../../utils/dates';

const PURPOSE_OTHER = '__other__';

export default function Transfer() {
  const { accounts, transactions, transfers, transferPurposes, addTransfer, loadTransferPurposes, loadingTransfers } = useFinance();
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [transferDate, setTransferDate] = useState(getTodayString());
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    void loadTransferPurposes();
  }, [loadTransferPurposes]);

  const fromAccData = accounts.find((acc) => acc.id === fromAccount);
  const toAccData = accounts.find((acc) => acc.id === toAccount);
  const isDifferentCurrency = fromAccData && toAccData && fromAccData.currency !== toAccData.currency;
  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(exchangeRate) || 1;
  const convertedAmount = isDifferentCurrency ? amountNum * rateNum : amountNum;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amountNum) return;
    const purposeToSend = customPurpose.trim() || (purpose === PURPOSE_OTHER ? undefined : purpose) || undefined;
    try {
      await addTransfer(fromAccount, toAccount, amountNum, description || 'Transfer', purposeToSend);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFromAccount('');
        setToAccount('');
        setAmount('');
        setExchangeRate('');
        setPurpose('');
        setCustomPurpose('');
        setDescription('');
        setTransferDate(getTodayString());
      }, 2000);
    } catch {
      // Error surfaced by store / API; keep form state
    }
  };

  const recentTransfers = useMemo(() => {
    if (transfers.length > 0) {
      return transfers.slice(0, 5).map((t) => {
        const toLabel = t.toAccountName || t.toCardNumber || '—';
        return {
          id: t.id,
          from: t.fromAccountName ?? '—',
          to: toLabel,
          amount: t.fromAmount,
          date: t.date,
          currency: t.fromCurrency ?? 'UZS',
          purpose: t.purposeNameUz ?? t.purpose ?? null,
        };
      });
    }
    const transferTxs = transactions.filter((t) => t.type === 'TRANSFER').slice(0, 5);
    return transferTxs.map((t) => {
      const from = accounts.find((a) => a.id === t.accountId);
      const to = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;
      return {
        id: t.id,
        from: from?.name ?? '—',
        to: to?.name ?? '—',
        amount: t.amount,
        date: t.date,
        currency: from?.currency ?? 'UZS',
        purpose: null as string | null,
      };
    });
  }, [transfers, transactions, accounts]);

  const fromOptions = useMemo(
    () => [
      { value: '', label: 'Select source account' },
      ...accounts.map((acc) => ({ value: acc.id, label: `${acc.name} (${formatUzs(acc.balance)})` })),
    ],
    [accounts]
  );
  const toOptions = useMemo(
    () => [
      { value: '', label: 'Select destination account' },
      ...accounts
        .filter((acc) => acc.id !== fromAccount)
        .map((acc) => ({ value: acc.id, label: `${acc.name} (${formatUzs(acc.balance)})` })),
    ],
    [accounts, fromAccount]
  );

  return (
    <div className="p-8 space-y-6" aria-busy={loadingTransfers}>
      {loadingTransfers && <span className="sr-only" aria-live="polite">Loading transfers…</span>}
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Transfer Between Accounts</h1>
        <p className="text-[#64748B] mt-1">Move money between your accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-6">New Transfer</h3>
          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <Select
                label="From Account"
                options={fromOptions}
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                required
              />
              {fromAccData && (
                <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg">
                  <p className="text-sm text-[#64748B]">Available Balance</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{formatUzs(fromAccData.balance)}</p>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white">
                <ArrowRight className="w-6 h-6" aria-hidden />
              </div>
            </div>
            <div>
              <Select
                label="To Account"
                options={toOptions}
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                required
              />
              {toAccData && (
                <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg">
                  <p className="text-sm text-[#64748B]">Current Balance</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{formatUzs(toAccData.balance)}</p>
                </div>
              )}
            </div>
            <Input
              label="Transfer Amount"
              type="number"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">Purpose</label>
              <Select
                options={[
                  { value: '', label: 'Select purpose' },
                  ...(transferPurposes ?? []).map((p) => ({
                    value: p.code,
                    label: p.nameUz || p.nameEn || p.nameRu || p.code,
                  })),
                  { value: PURPOSE_OTHER, label: 'Other (type below)' },
                ]}
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  if (e.target.value !== PURPOSE_OTHER) setCustomPurpose('');
                }}
                aria-label="Purpose"
              />
              {purpose === PURPOSE_OTHER && (
                <Input
                  label=""
                  type="text"
                  placeholder="e.g. Rent payment"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">Description (Optional)</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                rows={3}
                placeholder="Add transfer notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Input
              label="Date"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
            {isDifferentCurrency && (
              <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B]/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[#D97706]">
                  <AlertCircle className="w-5 h-5" aria-hidden />
                  <span className="font-medium">Currency Conversion Required</span>
                </div>
                <Input
                  label={`Exchange Rate (1 ${fromAccData.currency} = ? ${toAccData.currency})`}
                  type="number"
                  step="0.0001"
                  placeholder="Enter exchange rate"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  required
                />
                {exchangeRate && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-[#64748B] mb-1">Converted Amount</p>
                    <p className="text-xl font-bold text-[#0F172A]">
                      {toAccData.currency} {formatUzs(convertedAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full flex items-center justify-center gap-2" size="lg">
              <ArrowLeftRight className="w-5 h-5" aria-hidden />
              Complete Transfer
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Transfer Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#64748B] mb-1">From</p>
                <p className="font-medium text-[#0F172A]">{fromAccData ? fromAccData.name : '—'}</p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#64748B]" aria-hidden />
                </div>
              </div>
              <div>
                <p className="text-sm text-[#64748B] mb-1">To</p>
                <p className="font-medium text-[#0F172A]">{toAccData ? toAccData.name : '—'}</p>
              </div>
              <div className="pt-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B] mb-1">Amount</p>
                <p className="text-2xl font-bold text-[#1E40AF]">
                  {amount ? `${fromAccData?.currency ?? ''} ${formatUzs(parseFloat(amount))}` : '—'}
                </p>
                {isDifferentCurrency && convertedAmount > 0 && (
                  <p className="text-sm text-[#64748B] mt-1">≈ {toAccData?.currency} {formatUzs(convertedAmount)}</p>
                )}
              </div>
            </div>
          </Card>
          {fromAccData && toAccData && amount && (
            <Card className="bg-[#DBEAFE] border-[#1E40AF]/20">
              <h4 className="font-semibold text-[#0F172A] mb-3">Balance Changes</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">{fromAccData.name}</span>
                  <div className="text-right">
                    <p className="text-sm line-through text-[#94A3B8">{formatUzs(fromAccData.balance)}</p>
                    <p className="font-semibold text-[#DC2626]">{formatUzs(fromAccData.balance - amountNum)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">{toAccData.name}</span>
                  <div className="text-right">
                    <p className="text-sm line-through text-[#94A3B8">{formatUzs(toAccData.balance)}</p>
                    <p className="font-semibold text-[#10B981]">{formatUzs(toAccData.balance + convertedAmount)}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Recent Transfers</h3>
        <div className="space-y-3">
          {recentTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center text-white">
                  <ArrowLeftRight className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">
                    {transfer.from} → {transfer.to}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    {new Date(transfer.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {transfer.purpose ? ` · ${transfer.purpose}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#0F172A]">{formatUzs(transfer.amount)}</p>
                <Badge variant="success" className="mt-1">Completed</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-white border border-[#10B981] rounded-xl shadow-lg p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-[#0F172A]">Transfer Successful!</p>
            <p className="text-sm text-[#64748B]">Money transferred between accounts</p>
          </div>
        </div>
      )}
    </div>
  );
}
