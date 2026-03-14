import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Account, AccountType } from '../types';
import { toAccountType } from '../services/accounts';
import * as accountService from '../services/account.service';
import type { CreateAccountRequest, UpdateAccountRequest, DepositWithdrawRequest, TotalBalances } from '../types/account.types';

interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  totalBalances: TotalBalances | null;
  loading: boolean;
  error: string | null;
}

interface AccountContextValue extends AccountState {
  fetchAccounts: () => Promise<void>;
  createAccount: (data: CreateAccountRequest) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountRequest) => Promise<Account>;
  archiveAccount: (id: string) => Promise<void>;
  deposit: (id: string, data: DepositWithdrawRequest) => Promise<Account>;
  withdraw: (id: string, data: DepositWithdrawRequest) => Promise<Account>;
  fetchTotalBalance: () => Promise<TotalBalances | null>;
  setSelectedAccount: (account: Account | null) => void;
  clearError: () => void;
}

function mapServiceAccountToDomain(a: accountService.Account): Account {
  return {
    id: String(a.id),
    name: a.name,
    type: toAccountType(a.type) as AccountType,
    currency: a.currency,
    balance: a.balance,
    color: a.color ?? '#1E40AF',
    createdAt: a.createdAt,
    initialBalance: a.initialBalance,
    archived: a.archived,
    cardExpiresAt: a.cardExpiresAt,
  };
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [totalBalances, setTotalBalances] = useState<TotalBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await accountService.fetchAccounts();
      setAccounts(list.map(mapServiceAccountToDomain));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTotalBalance = useCallback(async (): Promise<TotalBalances | null> => {
    try {
      const data = await accountService.fetchTotalBalance();
      setTotalBalances(data);
      return data;
    } catch {
      setTotalBalances(null);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = useCallback(async (data: CreateAccountRequest): Promise<Account> => {
    setError(null);
    try {
      const created = await accountService.createAccount(data);
      const domain = mapServiceAccountToDomain(created);
      setAccounts((prev) => [...prev, domain]);
      await fetchTotalBalance();
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      throw err;
    }
  }, [fetchTotalBalance]);

  const updateAccount = useCallback(async (id: string, data: UpdateAccountRequest): Promise<Account> => {
    setError(null);
    try {
      const updated = await accountService.updateAccount(id, data);
      const domain = mapServiceAccountToDomain(updated);
      setAccounts((prev) => prev.map((a) => (a.id === id ? domain : a)));
      if (selectedAccount?.id === id) setSelectedAccountState(domain);
      await fetchTotalBalance();
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update account';
      setError(message);
      throw err;
    }
  }, [selectedAccount?.id, fetchTotalBalance]);

  const archiveAccount = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await accountService.archiveAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAccount?.id === id) setSelectedAccountState(null);
      await fetchTotalBalance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive account';
      setError(message);
      throw err;
    }
  }, [selectedAccount?.id, fetchTotalBalance]);

  const deposit = useCallback(async (id: string, data: DepositWithdrawRequest): Promise<Account> => {
    setError(null);
    try {
      const updated = await accountService.deposit(id, data);
      const domain = mapServiceAccountToDomain(updated);
      setAccounts((prev) => prev.map((a) => (a.id === id ? domain : a)));
      if (selectedAccount?.id === id) setSelectedAccountState(domain);
      await fetchTotalBalance();
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deposit';
      setError(message);
      throw err;
    }
  }, [selectedAccount?.id, fetchTotalBalance]);

  const withdraw = useCallback(async (id: string, data: DepositWithdrawRequest): Promise<Account> => {
    setError(null);
    try {
      const updated = await accountService.withdraw(id, data);
      const domain = mapServiceAccountToDomain(updated);
      setAccounts((prev) => prev.map((a) => (a.id === id ? domain : a)));
      if (selectedAccount?.id === id) setSelectedAccountState(domain);
      await fetchTotalBalance();
      return domain;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw';
      setError(message);
      throw err;
    }
  }, [selectedAccount?.id, fetchTotalBalance]);

  const setSelectedAccount = useCallback((account: Account | null) => {
    setSelectedAccountState(account);
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      accounts,
      selectedAccount,
      totalBalances,
      loading,
      error,
      fetchAccounts,
      createAccount,
      updateAccount,
      archiveAccount,
      deposit,
      withdraw,
      fetchTotalBalance,
      setSelectedAccount,
      clearError,
    }),
    [
      accounts,
      selectedAccount,
      totalBalances,
      loading,
      error,
      fetchAccounts,
      createAccount,
      updateAccount,
      archiveAccount,
      deposit,
      withdraw,
      fetchTotalBalance,
      setSelectedAccount,
      clearError,
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccounts(): AccountContextValue {
  const ctx = React.useContext(AccountContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider');
  return ctx;
}
