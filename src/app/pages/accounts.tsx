import React, { useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Modal } from '../components/modal';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Plus, Edit2, Trash2, CreditCard, Wallet, Building2, DollarSign } from 'lucide-react';
import { useFinance, toDisplayAccountType } from '../../store/FinanceStore';
import { toAccountType } from '../../services/accounts';
import { formatUzs } from '../../utils/currency';
import type { Account } from '../../types';

export default function Accounts() {
  const { accounts, totalBalance, addAccount, updateAccount, deleteAccount, loadingAccounts } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'card',
    currency: 'UZS',
    balance: '',
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'card': return CreditCard;
      case 'cash': return Wallet;
      case 'bank': return Building2;
      default: return DollarSign;
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) return;
    const balance = parseFloat(formData.balance) || 0;
    if (balance < 0) return;
    addAccount(name, formData.type, balance, formData.currency);
    setIsAddModalOpen(false);
    setFormData({ name: '', type: 'card', currency: 'UZS', balance: '' });
  };

  const isAddFormValid = formData.name.trim().length > 0;

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const name = formData.name.trim();
    if (!name) return;
    updateAccount(editingAccount.id, {
      name,
      type: toAccountType(formData.type),
      currency: formData.currency,
    });
    setIsEditModalOpen(false);
    setEditingAccount(null);
    setFormData({ name: '', type: 'card', currency: 'UZS', balance: '' });
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      deleteAccount(id);
    }
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: toDisplayAccountType(account.type),
      currency: account.currency,
      balance: account.balance.toString(),
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6" aria-busy={loadingAccounts}>
      {loadingAccounts && <span className="sr-only" aria-live="polite">Loading accounts…</span>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Accounts & Cards</h1>
          <p className="text-[#64748B] mt-1">Manage your bank accounts, cards, and cash</p>
        </div>
        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" aria-hidden />
          Add Account
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-[#1E40AF] to-[#10B981] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold">{formatUzs(totalBalance)}</h2>
            <p className="text-white/80 mt-2">Across {accounts.length} accounts</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <DollarSign className="w-8 h-8" aria-hidden />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const displayType = toDisplayAccountType(account.type);
          const Icon = getAccountIcon(displayType);
          return (
            <Card key={account.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: account.color }}
              />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    <Icon className="w-6 h-6" aria-hidden />
                  </div>
                  <Badge variant="default" className="capitalize">
                    {displayType}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-1">{account.name}</h3>
                  <p className="text-sm text-[#64748B]">{account.currency}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">{formatUzs(account.balance)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Current Balance</p>
                </div>
                <div className="flex gap-2 pt-4 border-t border-[#E2E8F0]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => openEditModal(account)}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-center"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="w-4 h-4 text-[#DC2626]" aria-hidden />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Account"
        size="md"
      >
        <form onSubmit={handleAddAccount} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g., Main Card, Cash Wallet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Account Type"
            options={[
              { value: 'card', label: 'Bank Card' },
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank Account' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Select
            label="Currency"
            options={[
              { value: 'UZS', label: 'UZS - Uzbek so\'m' },
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
              { value: 'RUB', label: 'RUB - Russian Ruble' },
            ]}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
          <Input
            label="Initial Balance"
            type="number"
            step="1"
            placeholder="0"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!isAddFormValid}>
              Add Account
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingAccount(null); }}
        title="Edit Account"
        size="md"
      >
        <form onSubmit={handleEditAccount} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g., Main Card, Cash Wallet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Account Type"
            options={[
              { value: 'card', label: 'Bank Card' },
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank Account' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Select
            label="Currency"
            options={[
              { value: 'UZS', label: 'UZS - Uzbek so\'m' },
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
              { value: 'RUB', label: 'RUB - Russian Ruble' },
            ]}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-sm text-[#64748B] mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-[#0F172A]">
              {editingAccount ? formatUzs(editingAccount.balance) : '—'}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Balance is updated automatically based on transactions
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
