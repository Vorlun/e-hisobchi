/**
 * Validation for financial operations. Prevents invalid state.
 * Used by store actions before applying mutations.
 */

import type { Account, Transaction, TransactionType } from '../types';
import { isTransactionType } from '../types';

export interface ValidationResult {
  valid: true;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type Validation = ValidationResult | ValidationError;

export function validationError(message: string): ValidationError {
  return { valid: false, error: message };
}

/** Ensure account exists by id. */
export function validateAccountExists(accounts: Account[], accountId: string): Validation {
  const exists = accounts.some((a) => a.id === accountId);
  if (!exists) return validationError(`Account not found: ${accountId}`);
  return { valid: true };
}

/** Expense/income amount must be positive. */
export function validateTransactionAmount(amount: number, type: TransactionType): Validation {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return validationError('Amount must be a valid number');
  }
  if (amount <= 0) {
    return validationError('Amount must be greater than zero');
  }
  return { valid: true };
}

/** Transfer: source and destination must differ. */
export function validateTransferAccounts(
  fromAccountId: string,
  toAccountId: string
): Validation {
  if (!fromAccountId || !toAccountId) {
    return validationError('Source and destination accounts are required');
  }
  if (fromAccountId === toAccountId) {
    return validationError('Source and destination accounts must be different');
  }
  return { valid: true };
}

/** Transfer amount must be positive. */
export function validateTransferAmount(amount: number): Validation {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return validationError('Amount must be a valid number');
  }
  if (amount <= 0) {
    return validationError('Transfer amount must be greater than zero');
  }
  return { valid: true };
}

/** Full transaction validation: type, amount, account exists. */
export function validateTransaction(
  data: { type: TransactionType; amount: number; accountId: string; toAccountId?: string },
  accounts: Account[]
): Validation {
  if (!isTransactionType(data.type)) {
    return validationError('Invalid transaction type');
  }
  const amountCheck = validateTransactionAmount(data.amount, data.type);
  if (!amountCheck.valid) return amountCheck;
  const accountCheck = validateAccountExists(accounts, data.accountId);
  if (!accountCheck.valid) return accountCheck;
  if (data.type === 'TRANSFER') {
    if (!data.toAccountId) return validationError('Transfer requires a destination account');
    const transferCheck = validateTransferAccounts(data.accountId, data.toAccountId);
    if (!transferCheck.valid) return transferCheck;
    const toExists = validateAccountExists(accounts, data.toAccountId);
    if (!toExists.valid) return toExists;
  }
  return { valid: true };
}

/** Full transfer validation (internal: both account ids). */
export function validateTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  accounts: Account[]
): Validation {
  const accountsCheck = validateTransferAccounts(fromAccountId, toAccountId);
  if (!accountsCheck.valid) return accountsCheck;
  const amountCheck = validateTransferAmount(amount);
  if (!amountCheck.valid) return amountCheck;
  const fromExists = validateAccountExists(accounts, fromAccountId);
  if (!fromExists.valid) return fromExists;
  const toExists = validateAccountExists(accounts, toAccountId);
  if (!toExists.valid) return toExists;
  return { valid: true };
}

/** Transfer with either toAccountId (internal) or toCardNumber (external). */
export function validateTransferRequest(params: {
  fromAccountId: string;
  toAccountId?: string;
  toCardNumber?: string;
  amount: number;
  accounts: Account[];
}): Validation {
  const { fromAccountId, toAccountId, toCardNumber, amount, accounts } = params;
  const amountCheck = validateTransferAmount(amount);
  if (!amountCheck.valid) return amountCheck;
  if (!fromAccountId) return validationError('Source is required');
  const hasTo = toAccountId != null && toAccountId !== '' || (toCardNumber != null && toCardNumber.replace(/\D/g, '').length === 16);
  if (!hasTo) return validationError('Destination is required (select account/card or enter card number)');
  if (toCardNumber != null && toCardNumber.replace(/\D/g, '').length !== 16) {
    return validationError('Card number must be 16 digits');
  }
  if (toAccountId != null && toAccountId !== '') {
    if (fromAccountId === toAccountId) return validationError('Source and destination must be different');
  }
  return { valid: true };
}
