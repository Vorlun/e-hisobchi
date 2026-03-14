/**
 * Account service — single entry for account API. Delegates to accounts.api.
 */

import * as accountsApi from './accounts.api';
import type { Account, CreateAccountRequest, UpdateAccountRequest, DepositWithdrawRequest, TotalBalances } from '../types/account.types';

export type { Account, CreateAccountRequest, UpdateAccountRequest, DepositWithdrawRequest, TotalBalances } from '../types/account.types';

export async function fetchAccounts(): Promise<Account[]> {
  const list = await accountsApi.getAccounts();
  return list.map((a) => ({
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  }));
}

export async function fetchAccountById(id: string): Promise<Account> {
  const a = await accountsApi.getAccountById(id);
  return {
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  };
}

export async function createAccount(data: CreateAccountRequest): Promise<Account> {
  const a = await accountsApi.createAccount({
    name: data.name,
    type: data.type,
    currency: data.currency,
    initialBalance: data.initialBalance,
    color: data.color,
    cardExpiresAt: data.cardExpiresAt,
  });
  return {
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  };
}

export async function updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
  const a = await accountsApi.updateAccount(id, {
    name: data.name,
    type: data.type,
    color: data.color,
    cardExpiresAt: data.cardExpiresAt,
  });
  return {
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  };
}

export async function archiveAccount(id: string): Promise<void> {
  await accountsApi.archiveAccount(id);
}

export async function deposit(id: string, data: DepositWithdrawRequest): Promise<Account> {
  const a = await accountsApi.depositToAccount(id, { amount: data.amount, note: data.note });
  return {
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  };
}

export async function withdraw(id: string, data: DepositWithdrawRequest): Promise<Account> {
  const a = await accountsApi.withdrawFromAccount(id, { amount: data.amount, note: data.note });
  return {
    id: String(a.id),
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    initialBalance: a.initialBalance,
    color: a.color ?? '#1E40AF',
    archived: a.archived ?? false,
    createdAt: a.createdAt,
    cardExpiresAt: a.cardExpiresAt,
  };
}

export async function fetchTotalBalance(): Promise<TotalBalances> {
  const res = await accountsApi.getTotalBalance();
  return { balances: res.balances ?? {} };
}
