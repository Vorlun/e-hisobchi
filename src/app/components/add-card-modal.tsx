import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { useFinance } from '../../store/FinanceStore';
import { toast } from 'sonner';

const CARD_TYPE_OPTIONS = [
  { value: '', label: 'Tanlang...' },
  { value: 'VISA', label: 'VISA' },
  { value: 'MASTERCARD', label: 'Mastercard' },
  { value: 'HUMO', label: 'HUMO' },
  { value: 'UZCARD', label: 'UzCard' },
];

const CURRENCY_OPTIONS = [
  { value: 'UZS', label: 'UZS - O\'zbek so\'mi' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const COLOR_OPTIONS = [
  { value: '#1E40AF', label: 'Ko\'k' },
  { value: '#059669', label: 'Yashil' },
  { value: '#7C3AED', label: 'Binafsha' },
  { value: '#DC2626', label: 'Qizil' },
  { value: '#D97706', label: 'Qora' },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const mm = String(i + 1).padStart(2, '0');
  return { value: mm, label: mm };
});

function getCurrentYear(): number {
  return new Date().getFullYear();
}

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const y = getCurrentYear() + i;
  const yy = String(y).slice(-2);
  return { value: yy, label: yy };
});

/** Format card number for display: "1234 5678 9012 3456", digits only, max 16. */
function formatCardNumberDisplay(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** Strip spaces for raw card number (for API). */
function getRawCardNumber(displayValue: string): string {
  return displayValue.replace(/\D/g, '');
}

export interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM = {
  name: '',
  cardNumberDisplay: '',
  cardholderName: '',
  cardType: '',
  expiryMonth: '',
  expiryYear: '',
  currency: 'UZS',
  color: '#1E40AF',
};

export function AddCardModal({ isOpen, onClose }: AddCardModalProps) {
  const { createCard, loadCards, lookupCard } = useFinance();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupDoneRef = useRef(false);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    lookupDoneRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const rawCardNumber = getRawCardNumber(form.cardNumberDisplay);

  useEffect(() => {
    if (!isOpen || rawCardNumber.length !== 16 || lookupDoneRef.current) return;
    lookupDoneRef.current = true;
    setLookupLoading(true);
    lookupCard(rawCardNumber)
      .then((res) => {
        if (res?.cardType) setForm((prev) => ({ ...prev, cardType: res.cardType }));
        if (res?.cardholderName) setForm((prev) => ({ ...prev, cardholderName: res.cardholderName }));
      })
      .catch(() => {})
      .finally(() => setLookupLoading(false));
  }, [isOpen, rawCardNumber, lookupCard]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = formatCardNumberDisplay(e.target.value);
    if (next.length < form.cardNumberDisplay.length) lookupDoneRef.current = false;
    setForm((prev) => ({ ...prev, cardNumberDisplay: next }));
    setErrors((prev) => ({ ...prev, cardNumber: undefined }));
  };

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (rawCardNumber.length !== 16) next.cardNumber = 'Card number must be 16 digits';
    if (!form.cardholderName.trim()) next.cardholderName = 'Cardholder name is required';
    if (!form.expiryMonth) next.expiryMonth = 'Expiry month is required';
    if (!form.expiryYear) next.expiryYear = 'Expiry year is required';
    if (!form.currency) next.currency = 'Currency is required';
    if (!form.cardType) next.cardType = 'Card type is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form.cardholderName, form.cardType, form.expiryMonth, form.expiryYear, form.currency, rawCardNumber.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await createCard({
        name: form.name.trim() || undefined,
        cardNumber: rawCardNumber,
        cardholderName: form.cardholderName.trim(),
        cardType: form.cardType || 'VISA',
        currency: form.currency,
        initialBalance: 0,
        color: form.color,
      });
      await loadCards();
      toast.success('Karta muvaffaqiyatli qo\'shildi');
      onClose();
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create card';
      setErrors((prev) => ({ ...prev, submit: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    rawCardNumber.length === 16 &&
    form.cardholderName.trim().length > 0 &&
    form.cardType &&
    form.expiryMonth &&
    form.expiryYear &&
    form.currency;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Karta qo'shish" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Card Name (ixtiyoriy)"
          placeholder="e.g. Asosiy karta"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          label="Card Number"
          placeholder="1234 5678 9012 3456"
          value={form.cardNumberDisplay}
          onChange={handleCardNumberChange}
          maxLength={19}
          inputMode="numeric"
          autoComplete="cc-number"
          error={errors.cardNumber}
          disabled={lookupLoading}
        />
        {lookupLoading && rawCardNumber.length === 16 && (
          <p className="text-sm text-[#64748B]">Karta ma'lumotlari yuklanmoqda…</p>
        )}
        <Input
          label="Cardholder Name"
          placeholder="Ism Familiya"
          value={form.cardholderName}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, cardholderName: e.target.value }));
            setErrors((prev) => ({ ...prev, cardholderName: undefined }));
          }}
          error={errors.cardholderName}
        />
        <Select
          label="Card Type"
          options={CARD_TYPE_OPTIONS}
          value={form.cardType}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, cardType: e.target.value }));
            setErrors((prev) => ({ ...prev, cardType: undefined }));
          }}
        />
        {errors.cardType && <p className="text-sm text-[#DC2626] -mt-2">{errors.cardType}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Expiry Month (MM)"
            options={MONTH_OPTIONS}
            value={form.expiryMonth}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, expiryMonth: e.target.value }));
              setErrors((prev) => ({ ...prev, expiryMonth: undefined }));
            }}
          />
          <Select
            label="Expiry Year (YY)"
            options={YEAR_OPTIONS}
            value={form.expiryYear}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, expiryYear: e.target.value }));
              setErrors((prev) => ({ ...prev, expiryYear: undefined }));
            }}
          />
        </div>
        <Select
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={form.currency}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, currency: e.target.value }));
            setErrors((prev) => ({ ...prev, currency: undefined }));
          }}
        />
        <Select
          label="Color"
          options={COLOR_OPTIONS}
          value={form.color}
          onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
        />
        {errors.submit && (
          <p className="text-sm text-[#DC2626]" role="alert">
            {errors.submit}
          </p>
        )}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </Button>
          <Button type="submit" className="flex-1" disabled={!isFormValid || submitting}>
            {submitting ? 'Saqlanmoqda…' : "Qo'shish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
