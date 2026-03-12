import type { Account, AccountType } from '../types';

const COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

/** Map UI-friendly type to domain AccountType */
export function toAccountType(type: string): AccountType {
  const map: Record<string, AccountType> = {
    card: 'DEBIT_CARD',
    cash: 'CASH',
    bank: 'SAVINGS',
    DEBIT_CARD: 'DEBIT_CARD',
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    SAVINGS: 'SAVINGS',
    WALLET: 'WALLET',
  };
  return (map[type] ?? 'WALLET') as AccountType;
}

/** Map AccountType to UI display (for existing components) */
export function toDisplayAccountType(type: AccountType): 'card' | 'cash' | 'bank' {
  if (type === 'DEBIT_CARD' || type === 'CREDIT_CARD') return 'card';
  if (type === 'CASH' || type === 'WALLET') return 'cash';
  return 'bank';
}

export function createAccount(
  name: string,
  type: AccountType,
  balance: number,
  currency: string = 'UZS'
): Omit<Account, 'id' | 'createdAt'> {
  return {
    name,
    type,
    currency,
    balance,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
