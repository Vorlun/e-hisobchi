/**
 * Accounts API — GET/POST/PUT/PATCH for accounts, deposit, withdraw, total balance.
 */

import { api } from './api';

/** Backend account response (Account data model). */
export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  initialBalance: number;
  color: string;
  archived: boolean;
  createdAt: string;
  cardExpiresAt?: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  color?: string;
  cardExpiresAt?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: string;
  color?: string;
  cardExpiresAt?: string;
}

export interface DepositWithdrawRequest {
  amount: number;
  note?: string;
}

export interface TotalBalanceResponse {
  balances: Record<string, number>;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getAccounts(): Promise<Account[]> {
  const res = await api<Account[] | { success: boolean; data?: Account[] }>('/accounts');
  const list = Array.isArray(res) ? res : (res as { data?: Account[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid accounts response');
  return list;
}

export async function getAccountById(id: string): Promise<Account> {
  const res = await api<Account | { success: boolean; data?: Account }>(`/accounts/${id}`);
  const acc = res && typeof res === 'object' && !Array.isArray(res) && 'id' in res
    ? (res as Account)
    : (res as { data?: Account }).data;
  if (!acc?.id) throw new Error('Invalid account response');
  return acc;
}

export async function createAccount(data: CreateAccountRequest): Promise<Account> {
  const res = await api<Account | { success: boolean; data?: Account }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const acc = (res as { data?: Account }).data ?? (res as Account);
  if (!acc?.id) throw new Error('Invalid create account response');
  return acc;
}

export async function updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
  const res = await api<Account | { success: boolean; data?: Account }>(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const acc = (res as { data?: Account }).data ?? (res as Account);
  if (!acc?.id) throw new Error('Invalid update account response');
  return acc;
}

export async function archiveAccount(id: string): Promise<void> {
  const res = await api<unknown>(`/accounts/${id}/archive`, { method: 'PATCH' });
  checkSuccess(res as { success?: boolean });
}

export async function depositToAccount(id: string, data: DepositWithdrawRequest): Promise<Account> {
  const res = await api<Account | { success: boolean; data?: Account }>(`/accounts/${id}/deposit`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const acc = (res as { data?: Account }).data ?? (res as Account);
  if (!acc?.id) throw new Error('Invalid deposit response');
  return acc;
}

export async function withdrawFromAccount(id: string, data: DepositWithdrawRequest): Promise<Account> {
  const res = await api<Account | { success: boolean; data?: Account }>(`/accounts/${id}/withdraw`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const acc = (res as { data?: Account }).data ?? (res as Account);
  if (!acc?.id) throw new Error('Invalid withdraw response');
  return acc;
}

export async function getTotalBalance(): Promise<TotalBalanceResponse> {
  const res = await api<TotalBalanceResponse | { success: boolean; data?: TotalBalanceResponse }>('/accounts/total-balance');
  checkSuccess(res as { success?: boolean });
  const data = (res as { data?: TotalBalanceResponse }).data ?? res;
  if (!data || typeof data.balances !== 'object') throw new Error('Invalid total balance response');
  return data as TotalBalanceResponse;
}
