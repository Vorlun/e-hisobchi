import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Badge } from './badge';
import { Sparkles, Mic, Loader2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';
import { suggestCategory, getCategoryIdForSlug } from '../../services/autoCategory';

const DESCRIPTION_DEBOUNCE_MS = 300;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedTransaction {
  type: 'income' | 'expense' | 'transfer' | 'debt_given' | 'debt_taken';
  amount: string;
  category: string;
  account: string;
  toAccount?: string;
  person?: string;
  date: string;
  description: string;
  confidence: number;
}

const typeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'debt_given', label: 'Debt Given' },
  { value: 'debt_taken', label: 'Debt Taken' },
];

// Mock AI parsing function
const parseNaturalLanguage = (text: string): ParsedTransaction | null => {
  const lowerText = text.toLowerCase();
  
  // Extract amount
  const amountMatch = text.match(/(\d+(?:[\s,.]?\d+)*)\s*(ming|mln|million|k|thousand|dollar|som)?/i);
  let amount = 0;
  if (amountMatch) {
    const num = parseFloat(amountMatch[1].replace(/[,\s]/g, ''));
    const unit = amountMatch[2]?.toLowerCase();
    if (unit === 'ming' || unit === 'k' || unit === 'thousand') {
      amount = num * 1000;
    } else if (unit === 'mln' || unit === 'million') {
      amount = num * 1000000;
    } else {
      amount = num;
    }
  }
  
  // Detect type
  let type: ParsedTransaction['type'] = 'expense';
  let confidence = 85;
  
  if (lowerText.includes('maosh') || lowerText.includes('salary') || lowerText.includes('tushdi') || lowerText.includes('income') || lowerText.includes('received')) {
    type = 'income';
    confidence = 92;
  } else if (lowerText.includes('sarfladim') || lowerText.includes('spent') || lowerText.includes('bought') || lowerText.includes('paid')) {
    type = 'expense';
    confidence = 90;
  } else if (lowerText.includes('qarz') || lowerText.includes('debt') || lowerText.includes('loan')) {
    if (lowerText.includes('berdim') || lowerText.includes('gave') || lowerText.includes('lent')) {
      type = 'debt_given';
      confidence = 88;
    } else {
      type = 'debt_taken';
      confidence = 88;
    }
  } else if (lowerText.includes('transfer') || lowerText.includes('ko\'chirdim')) {
    type = 'transfer';
    confidence = 85;
  }
  
  // Detect category
  let category = 'other';
  if (lowerText.includes('ovqat') || lowerText.includes('food') || lowerText.includes('restaurant') || lowerText.includes('grocery')) {
    category = 'food';
  } else if (lowerText.includes('transport') || lowerText.includes('taxi') || lowerText.includes('fuel')) {
    category = 'transport';
  } else if (lowerText.includes('shopping') || lowerText.includes('clothes') || lowerText.includes('xarid')) {
    category = 'shopping';
  } else if (lowerText.includes('bill') || lowerText.includes('utility') || lowerText.includes('komunal')) {
    category = 'bills';
  } else if (lowerText.includes('maosh') || lowerText.includes('salary')) {
    category = 'salary';
  }
  
  // Extract person name if debt
  let person = undefined;
  if (type === 'debt_given' || type === 'debt_taken') {
    const personMatch = text.match(/(?:from|to|ga|dan)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (personMatch) {
      person = personMatch[1];
    }
  }
  
  if (!amount) {
    return null;
  }
  
  return {
    type,
    amount: amount.toString(),
    category,
    account: '1',
    person,
    date: new Date().toISOString().split('T')[0],
    description: text,
    confidence
  };
};

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { accounts, incomeCategories, expenseCategories, transferCategories, addTransaction, addTransfer, addDebt } =
    useFinance();
  const [entryMode, setEntryMode] = useState<'manual' | 'smart'>('manual');
  const [smartInput, setSmartInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categorySuggested, setCategorySuggested] = useState(false);
  const descriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formData, setFormData] = useState<ParsedTransaction>({
    type: 'expense',
    amount: '',
    category: '',
    account: '',
    toAccount: '',
    person: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    confidence: 0,
  });

  const categoryOptions = React.useMemo(() => {
    const base = [{ value: '', label: 'Select category' }];
    if (formData.type === 'income') {
      const opts =
        incomeCategories?.map((c) => ({ value: c.id, label: c.name })) ?? [];
      return [...base, ...opts];
    }
    if (formData.type === 'expense' || formData.type === 'transfer') {
      const source =
        formData.type === 'transfer'
          ? transferCategories && transferCategories.length > 0
            ? transferCategories
            : expenseCategories
          : expenseCategories;
      const opts = source?.map((c) => ({ value: c.id, label: c.name })) ?? [];
      return [...base, ...opts];
    }
    return base;
  }, [formData.type, incomeCategories, expenseCategories, transferCategories]);

  const applyCategorySuggestion = useCallback(
    (description: string, opts: { value: string; label: string }[]) => {
      const slug = suggestCategory(description);
      if (!slug) return;
      const id = getCategoryIdForSlug(slug, opts.filter((o) => o.value));
      if (id) {
        setFormData((prev) => ({ ...prev, category: id }));
        setCategorySuggested(true);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (descriptionDebounceRef.current) clearTimeout(descriptionDebounceRef.current);
    };
  }, []);

  const accountOptions = React.useMemo(() => {
    const opts = [{ value: '', label: 'Select account' }];
    accounts.forEach((acc) => {
      opts.push({ value: acc.id, label: `${acc.name} (${formatUzs(acc.balance)})` });
    });
    return opts;
  }, [accounts]);

  const handleModeSwitch = (mode: 'manual' | 'smart') => {
    setEntryMode(mode);
    if (mode === 'smart') {
      setAiParsed(false);
      setShowLowConfidence(false);
    }
  };

  const handleAnalyze = async () => {
    if (!smartInput.trim()) return;
    
    setIsAnalyzing(true);
    setShowLowConfidence(false);
    
    // Simulate AI processing
    setTimeout(() => {
      const result = parseNaturalLanguage(smartInput);
      if (result) {
        setFormData(result);
        setAiParsed(true);
        if (result.confidence < 70) {
          setShowLowConfidence(true);
        }
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const amountNum = Math.round(parseFloat(formData.amount) || 0);
    if (!amountNum) return;

    try {
      if (formData.type === 'debt_given' || formData.type === 'debt_taken') {
        addDebt(
          formData.person || 'Unknown',
          amountNum,
          formData.type === 'debt_given' ? 'LENT' : 'BORROWED',
          formData.date,
          undefined,
          formData.description || undefined
        );
      } else if (formData.type === 'transfer' && formData.toAccount) {
        await addTransfer({
          fromAccountId: formData.account,
          toAccountId: formData.toAccount,
          amount: amountNum,
          description: formData.description || 'Transfer',
        });
      } else {
        const txType = formData.type === 'income' ? 'INCOME' : formData.type === 'expense' ? 'EXPENSE' : 'TRANSFER';
        await addTransaction({
          title: formData.description || (formData.type === 'income' ? 'Income' : formData.type === 'expense' ? 'Expense' : 'Transfer'),
          amount: amountNum,
          type: txType,
          category: formData.category || 'other',
          accountId: formData.account,
          toAccountId: formData.type === 'transfer' ? formData.toAccount : undefined,
          date: formData.date,
          description: formData.description,
        });
      }
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleClose = () => {
    if (descriptionDebounceRef.current) {
      clearTimeout(descriptionDebounceRef.current);
      descriptionDebounceRef.current = null;
    }
    setSubmitError(null);
    setCategorySuggested(false);
    setEntryMode('manual');
    setSmartInput('');
    setAiParsed(false);
    setShowLowConfidence(false);
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      account: '',
      toAccount: '',
      person: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      confidence: 0,
    });
    onClose();
  };

  const updateField = (field: keyof ParsedTransaction, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Transaction"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl">
          <button
            type="button"
            onClick={() => handleModeSwitch('manual')}
            className={`flex-1 py-2.5 rounded-lg transition-all font-medium ${
              entryMode === 'manual'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={entryMode === 'manual'}
            aria-label="Manual entry mode"
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('smart')}
            className={`flex-1 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
              entryMode === 'smart'
                ? 'bg-white text-[#10B981] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={entryMode === 'smart'}
            aria-label="Smart AI entry mode"
          >
            <Sparkles className="w-4 h-4" aria-hidden />
            Smart AI Entry
          </button>
        </div>

        {/* Smart AI Entry Mode */}
        {entryMode === 'smart' && !aiParsed && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-[#DBEAFE] to-[#D1FAE5] rounded-xl border border-[#1E40AF]/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A] mb-1">AI Smart Assistant</p>
                  <p className="text-xs text-[#64748B]">
                    Describe your transaction naturally and AI will auto-fill the details
                  </p>
                </div>
              </div>
            </div>

            {!isAnalyzing ? (
              <>
                <div className="relative">
                  <textarea
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    placeholder="Masalan: 120 ming ovqatga sarfladim yoki 5 mln maosh tushdi"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all resize-none"
                    rows={4}
                  />
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                    aria-label="Voice input"
                  >
                    <Mic className="w-5 h-5 text-[#64748B]" aria-hidden />
                  </button>
                </div>
                
                <Button 
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!smartInput.trim()}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze with AI
                </Button>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-lg font-medium text-[#0F172A] mb-1">AI is analyzing...</p>
                <p className="text-sm text-[#64748B]">Detecting transaction details</p>
              </div>
            )}
          </div>
        )}

        {/* Form Fields (shown in manual mode or after AI parsing) */}
        {(entryMode === 'manual' || aiParsed) && (
          <div className="space-y-4">
            {aiParsed && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#D1FAE5] rounded-xl border border-[#10B981]/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#10B981]" />
                    <span className="text-sm font-medium text-[#0F172A]">AI Auto-filled</span>
                  </div>
                  <Badge variant={formData.confidence >= 80 ? 'success' : 'warning'}>
                    {formData.confidence}% confidence
                  </Badge>
                </div>

                {showLowConfidence && (
                  <div className="p-3 bg-[#FEF3C7] border border-[#F59E0B]/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Please review the details</p>
                      <p className="text-xs text-[#64748B]">
                        AI couldn't fully understand. Please verify all fields below.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Select
              label="Transaction Type"
              options={typeOptions}
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value)}
              required
            />

            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              required
            />

            <div>
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => {
                  updateField('category', e.target.value);
                  setCategorySuggested(false);
                }}
                required
              />
              {categorySuggested && (
                <p className="text-xs text-[#64748B] mt-1.5" role="status">
                  Suggested category based on description
                </p>
              )}
            </div>

            <Select
              label="Account"
              options={accountOptions}
              value={formData.account}
              onChange={(e) => updateField('account', e.target.value)}
              required
            />

            {formData.type === 'transfer' && (
              <Select
                label="To Account"
                options={accountOptions.filter((o) => o.value && o.value !== formData.account)}
                value={formData.toAccount || ''}
                onChange={(e) => updateField('toAccount', e.target.value)}
                required
              />
            )}

            {(formData.type === 'debt_given' || formData.type === 'debt_taken') && (
              <Input
                label="Person Name"
                placeholder="e.g., John Smith"
                value={formData.person || ''}
                onChange={(e) => updateField('person', e.target.value)}
              />
            )}

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              required
            />

            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField('description', value);
                  if (formData.type === 'income' || formData.type === 'expense' || formData.type === 'transfer') {
                    if (descriptionDebounceRef.current) clearTimeout(descriptionDebounceRef.current);
                    descriptionDebounceRef.current = setTimeout(() => {
                      applyCategorySuggestion(value, categoryOptions);
                      descriptionDebounceRef.current = null;
                    }, DESCRIPTION_DEBOUNCE_MS);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                rows={3}
                placeholder="Add notes..."
              />
            </div>

            {formData.account && (
              <div className={`p-4 rounded-xl ${
                formData.type === 'income' ? 'bg-[#D1FAE5]' : 
                formData.type === 'expense' ? 'bg-[#FEE2E2]' : 
                'bg-[#DBEAFE]'
              }`}>
                <p className="text-sm text-[#64748B] mb-1">Account Balance Will:</p>
                <p className={`font-semibold ${
                  formData.type === 'income' ? 'text-[#10B981]' : 
                  formData.type === 'expense' ? 'text-[#DC2626]' : 
                  'text-[#1E40AF]'
                }`}>
                  {formData.type === 'income' && '↑ Increase'}
                  {formData.type === 'expense' && '↓ Decrease'}
                  {formData.type === 'transfer' && '⇄ Transfer'}
                  {(formData.type === 'debt_given' || formData.type === 'debt_taken') && '→ Track as Debt'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Validation/API error (internal; no layout change) */}
        {submitError && (
          <p className="text-sm text-[#DC2626]" role="alert">
            {submitError}
          </p>
        )}

        {/* Action Buttons */}
        {(entryMode === 'manual' || aiParsed) && (
          <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button 
              type="button"
              variant="secondary" 
              className="flex-1" 
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              Save Transaction
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
