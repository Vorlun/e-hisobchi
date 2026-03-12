/**
 * Centralized balance calculation — single source of truth for all balance-delta logic.
 * Used by FinanceStore for add/update/delete transaction and transfer.
 */

import type { Account, Transaction, TransactionType } from '../types';

export interface BalanceDelta {
  accountId: string;
  delta: number;
}

/**
 * Compute balance deltas for a single transaction.
 * EXPENSE: account balance decreases. INCOME: account balance increases.
 * TRANSFER: source decreases, destination increases.
 */
export function computeDeltasForTransaction(
  type: TransactionType,
  amount: number,
  accountId: string,
  toAccountId?: string
): BalanceDelta[] {
  const abs = Math.abs(amount);
  if (type === 'EXPENSE') {
    return [{ accountId, delta: -abs }];
  }
  if (type === 'INCOME') {
    return [{ accountId, delta: abs }];
  }
  if (type === 'TRANSFER' && toAccountId) {
    return [
      { accountId, delta: -abs },
      { accountId: toAccountId, delta: abs },
    ];
  }
  return [];
}

/**
 * Merge multiple delta lists by accountId (sum deltas). Used when reversing one tx and applying another (e.g. edit).
 */
export function mergeDeltas(...deltasList: BalanceDelta[][]): BalanceDelta[] {
  const byAccount = new Map<string, number>();
  for (const deltas of deltasList) {
    for (const { accountId, delta } of deltas) {
      byAccount.set(accountId, (byAccount.get(accountId) ?? 0) + delta);
    }
  }
  return Array.from(byAccount.entries()).map(([accountId, delta]) => ({ accountId, delta }));
}

/**
 * Apply deltas to a list of accounts. Pure function — returns new array; does not mutate.
 * Used by store to compute next account state after a transaction/transfer.
 */
export function applyDeltasToAccounts(
  accounts: Account[],
  deltas: BalanceDelta[]
): Account[] {
  if (deltas.length === 0) return accounts;
  const deltaMap = new Map(deltas.map((d) => [d.accountId, d.delta]));
  return accounts.map((acc) => {
    const delta = deltaMap.get(acc.id);
    return delta !== undefined ? { ...acc, balance: acc.balance + delta } : acc;
  });
}

/**
 * Get deltas for a transaction record (convenience for store).
 */
export function getTransactionDeltas(tx: {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string;
}): BalanceDelta[] {
  return computeDeltasForTransaction(tx.type, tx.amount, tx.accountId, tx.toAccountId);
}

/**
 * Reverse deltas (for undo/delete). Returns new array with negated deltas.
 */
export function reverseDeltas(deltas: BalanceDelta[]): BalanceDelta[] {
  return deltas.map((d) => ({ ...d, delta: -d.delta }));
}
