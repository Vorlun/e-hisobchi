import type { Transaction } from '../types';
import { generateId } from './accounts';

export function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt'>
): Omit<Transaction, 'id' | 'createdAt'> & { id: string; createdAt: string } {
  return {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
}

// Balance/delta logic is in balance.ts; store uses that module directly.
