/**
 * Account management — domain and API types.
 */

export type AccountTypeApi = 'CASH' | 'CARD' | 'BANK' | 'WALLET';

export interface Account {
  id: string;
  name: string;
  type: AccountTypeApi | string;
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
  type: AccountTypeApi | string;
  currency: string;
  initialBalance: number;
  color?: string;
  cardExpiresAt?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountTypeApi | string;
  color?: string;
  cardExpiresAt?: string;
}

export interface DepositWithdrawRequest {
  amount: number;
  note?: string;
}

export interface TotalBalances {
  balances: Record<string, number>;
}
