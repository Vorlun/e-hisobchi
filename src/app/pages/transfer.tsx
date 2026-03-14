import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Badge } from '../components/badge';
import { ArrowRight, ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';
import { getTodayString } from '../../utils/dates';
import { toast } from 'sonner';

const PURPOSE_OTHER = '__other__';
const TO_INTERNAL = 'internal';
const TO_EXTERNAL = 'external';

const PREFIX_ACC = 'acc:';
const PREFIX_CARD = 'card:';

function formatCardNumberDisplay(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function getRawCardNumber(displayValue: string): string {
  return displayValue.replace(/\D/g, '');
}

export default function Transfer() {
  const {
    accounts,
    cards,
    transactions,
    transfers,
    transferPurposes,
    addTransfer,
    loadAccounts,
    loadCards,
    loadTransferPurposes,
    loadingTransfers,
  } = useFinance();

  const [fromSource, setFromSource] = useState('');
  const [toType, setToType] = useState<typeof TO_INTERNAL | typeof TO_EXTERNAL>(TO_INTERNAL);
  const [toDestination, setToDestination] = useState('');
  const [toCardNumberDisplay, setToCardNumberDisplay] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [transferDate, setTransferDate] = useState(getTodayString());
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadCards();
    loadTransferPurposes();
  }, [loadAccounts, loadCards, loadTransferPurposes]);

  const fromAccountId = useMemo(() => {
    if (!fromSource) return '';
    if (fromSource.startsWith(PREFIX_ACC)) return fromSource.slice(PREFIX_ACC.length);
    if (fromSource.startsWith(PREFIX_CARD)) return fromSource.slice(PREFIX_CARD.length);
    return fromSource;
  }, [fromSource]);

  const fromAccount = useMemo(
    () => accounts.find((a) => String(a.id) === fromAccountId),
    [accounts, fromAccountId]
  );
  const fromCard = useMemo(
    () => cards?.find((c) => String(c.id) === fromAccountId),
    [cards, fromAccountId]
  );
  const fromBalance = fromAccount?.balance ?? fromCard?.balance ?? 0;
  const fromCurrency = fromAccount?.currency ?? fromCard?.currency ?? 'UZS';
  const fromName = fromAccount?.name ?? fromCard?.name ?? '—';

  const toAccountId = useMemo(() => {
    if (!toDestination || toType !== TO_INTERNAL) return '';
    if (toDestination.startsWith(PREFIX_ACC)) return toDestination.slice(PREFIX_ACC.length);
    if (toDestination.startsWith(PREFIX_CARD)) return toDestination.slice(PREFIX_CARD.length);
    return toDestination;
  }, [toDestination, toType]);
  const toAccount = useMemo(
    () => accounts.find((a) => String(a.id) === toAccountId),
    [accounts, toAccountId]
  );
  const toCard = useMemo(
    () => cards?.find((c) => String(c.id) === toAccountId),
    [cards, toAccountId]
  );
  const toName = toAccount?.name ?? toCard?.name ?? '—';
  const toCurrency = toAccount?.currency ?? toCard?.currency ?? 'UZS';
  const toBalance = toAccount?.balance ?? toCard?.balance ?? 0;

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(exchangeRate) || 1;
  const isDifferentCurrency =
    toType === TO_INTERNAL && fromCurrency !== toCurrency && Boolean(toAccount ?? toCard);
  const convertedAmount = isDifferentCurrency ? amountNum * rateNum : amountNum;

  const fromOptions = useMemo(() => {
    const opts: { value: string; label: string; disabled?: boolean }[] = [
      { value: '', label: "Qayerdan (Select source)" },
      { value: '__acc__', label: '——— Hisoblar ———', disabled: true },
      ...accounts.map((acc) => ({
        value: `${PREFIX_ACC}${acc.id}`,
        label: `${acc.name} — ${formatUzs(acc.balance)} ${acc.currency}`,
      })),
      { value: '__cards__', label: '——— Kartalar ———', disabled: true },
      ...(cards ?? []).map((c) => ({
        value: `${PREFIX_CARD}${c.id}`,
        label: `${c.name} — **** ${String(c.cardNumber ?? '').slice(-4)}`,
      })),
    ];
    return opts;
  }, [accounts, cards]);

  const toOptions = useMemo(() => {
    if (toType !== TO_INTERNAL) return [];
    const exclude = fromSource;
    const opts: { value: string; label: string; disabled?: boolean }[] = [
      { value: '', label: "Qayerga (Select destination)" },
      { value: '__acc__', label: '——— Hisoblar ———', disabled: true },
      ...accounts
        .filter((a) => `${PREFIX_ACC}${a.id}` !== exclude)
        .map((a) => ({
          value: `${PREFIX_ACC}${a.id}`,
          label: `${a.name} — ${formatUzs(a.balance)} ${a.currency}`,
        })),
      { value: '__cards__', label: '——— Kartalar ———', disabled: true },
      ...(cards ?? [])
        .filter((c) => `${PREFIX_CARD}${c.id}` !== exclude)
        .map((c) => ({
          value: `${PREFIX_CARD}${c.id}`,
          label: `${c.name} — **** ${String(c.cardNumber ?? '').slice(-4)}`,
        })),
    ];
    return opts;
  }, [accounts, cards, fromSource, toType]);

  const isFormValid = useMemo(() => {
    if (!fromSource || amountNum <= 0) return false;
    if (toType === TO_INTERNAL) return Boolean(toDestination);
    return getRawCardNumber(toCardNumberDisplay).length === 16;
  }, [fromSource, toType, toDestination, toCardNumberDisplay, amountNum]);

  const handleTransfer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isFormValid) return;
      const purposeToSend =
        customPurpose.trim() || (purpose === PURPOSE_OTHER ? undefined : purpose) || undefined;
      setSubmitting(true);
      try {
        await addTransfer({
          fromAccountId,
          toAccountId: toType === TO_INTERNAL ? toAccountId : undefined,
          toCardNumber:
            toType === TO_EXTERNAL ? getRawCardNumber(toCardNumberDisplay) : undefined,
          amount: amountNum,
          description: description || 'Transfer',
          purpose: purposeToSend,
        });
        setShowSuccess(true);
        toast.success('O\'tkazma muvaffaqiyatli bajarildi');
        setTimeout(() => {
          setShowSuccess(false);
          setFromSource('');
          setToDestination('');
          setToCardNumberDisplay('');
          setAmount('');
          setExchangeRate('');
          setPurpose('');
          setCustomPurpose('');
          setDescription('');
          setTransferDate(getTodayString());
        }, 2000);
      } catch {
        // Error shown by store / toast
      } finally {
        setSubmitting(false);
      }
    },
    [
      isFormValid,
      fromAccountId,
      toType,
      toAccountId,
      toCardNumberDisplay,
      amountNum,
      description,
      customPurpose,
      purpose,
      addTransfer,
    ]
  );

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

  const purposeOptions = useMemo(
    () => [
      { value: '', label: "Maqsadni tanlang" },
      ...(transferPurposes ?? []).map((p) => ({
        value: p.code,
        label: p.nameUz || p.nameEn || p.nameRu || p.code,
      })),
      { value: PURPOSE_OTHER, label: 'Boshqa (pastda yozing)' },
    ],
    [transferPurposes]
  );

  return (
    <div className="p-8 space-y-6" aria-busy={loadingTransfers || submitting}>
      {(loadingTransfers || submitting) && (
        <span className="sr-only" aria-live="polite">
          {submitting ? 'O\'tkazma bajarilmoqda…' : 'Yuklanmoqda…'}
        </span>
      )}
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">O'tkazmalar</h1>
        <p className="text-[#64748B] mt-1">Move money between your accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-6">New Transfer</h3>
          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <Select
                label="Qayerdan (From)"
                options={fromOptions}
                value={fromSource}
                onChange={(e) => {
                  setFromSource(e.target.value);
                  if (toType === TO_INTERNAL && toDestination === e.target.value) setToDestination('');
                }}
                required
              />
              {(fromAccount ?? fromCard) && (
                <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg">
                  <p className="text-sm text-[#64748B]">Available Balance</p>
                  <p className="text-lg font-semibold text-[#0F172A]">{formatUzs(fromBalance)} {fromCurrency}</p>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white">
                <ArrowRight className="w-6 h-6" aria-hidden />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">Qayerga (To)</label>
              <Select
                options={[
                  { value: TO_INTERNAL, label: "O'z hisobiga" },
                  { value: TO_EXTERNAL, label: "Karta raqamiga" },
                ]}
                value={toType}
                onChange={(e) => {
                  setToType(e.target.value as typeof TO_INTERNAL | typeof TO_EXTERNAL);
                  setToDestination('');
                  setToCardNumberDisplay('');
                }}
                aria-label="Destination type"
              />
            </div>

            {toType === TO_INTERNAL && (
              <div>
                <Select
                  label="Hisob yoki karta"
                  options={toOptions}
                  value={toDestination}
                  onChange={(e) => setToDestination(e.target.value)}
                  required
                />
                {(toAccount ?? toCard) && (
                  <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg">
                    <p className="text-sm text-[#64748B]">Current Balance</p>
                    <p className="text-lg font-semibold text-[#0F172A]">{formatUzs(toBalance)} {toCurrency}</p>
                  </div>
                )}
              </div>
            )}

            {toType === TO_EXTERNAL && (
              <Input
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={toCardNumberDisplay}
                onChange={(e) => setToCardNumberDisplay(formatCardNumberDisplay(e.target.value))}
                maxLength={19}
                inputMode="numeric"
              />
            )}

            <Input
              label="Transfer Amount"
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">Purpose</label>
              <Select
                options={purposeOptions}
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
                  label={`Exchange Rate (1 ${fromCurrency} = ? ${toCurrency})`}
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
                      {toCurrency} {formatUzs(convertedAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              size="lg"
              disabled={!isFormValid || submitting}
            >
              {submitting ? (
                <>Saqlanmoqda…</>
              ) : (
                <>
                  <ArrowLeftRight className="w-5 h-5" aria-hidden />
                  Complete Transfer
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Transfer Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#64748B] mb-1">From</p>
                <p className="font-medium text-[#0F172A]">{fromName}</p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#64748B]" aria-hidden />
                </div>
              </div>
              <div>
                <p className="text-sm text-[#64748B] mb-1">To</p>
                <p className="font-medium text-[#0F172A]">
                  {toType === TO_EXTERNAL
                    ? (toCardNumberDisplay ? `**** ${getRawCardNumber(toCardNumberDisplay).slice(-4)}` : '—')
                    : toName}
                </p>
              </div>
              <div className="pt-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B] mb-1">Amount</p>
                <p className="text-2xl font-bold text-[#1E40AF]">
                  {amount ? `${fromCurrency} ${formatUzs(parseFloat(amount))}` : '—'}
                </p>
                {isDifferentCurrency && convertedAmount > 0 && (
                  <p className="text-sm text-[#64748B] mt-1">≈ {toCurrency} {formatUzs(convertedAmount)}</p>
                )}
              </div>
            </div>
          </Card>
          {fromSource && (toDestination || (toType === TO_EXTERNAL && toCardNumberDisplay)) && amount && (
            <Card className="bg-[#DBEAFE] border-[#1E40AF]/20">
              <h4 className="font-semibold text-[#0F172A] mb-3">Balance Changes</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">{fromName}</span>
                  <div className="text-right">
                    <p className="text-sm line-through text-[#94A3B8]">{formatUzs(fromBalance)}</p>
                    <p className="font-semibold text-[#DC2626]">{formatUzs(fromBalance - amountNum)}</p>
                  </div>
                </div>
                {toType === TO_INTERNAL && (toAccount ?? toCard) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">{toName}</span>
                    <div className="text-right">
                      <p className="text-sm line-through text-[#94A3B8]">{formatUzs(toBalance)}</p>
                      <p className="font-semibold text-[#10B981]">{formatUzs(toBalance + convertedAmount)}</p>
                    </div>
                  </div>
                )}
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
