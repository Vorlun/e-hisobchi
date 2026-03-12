import type { Account, Transaction, Budget, Debt } from '../types';

// All amounts in UZS (so'm)
const NOW = new Date().toISOString();
const MONTH = new Date().toISOString().slice(0, 7);

export const initialAccounts: Account[] = [
  { id: '1', name: 'Main Card', type: 'DEBIT_CARD', currency: 'UZS', balance: 67_056_000, color: '#1E40AF', createdAt: NOW },
  { id: '2', name: 'Cash Wallet', type: 'CASH', currency: 'UZS', balance: 5_715_000, color: '#10B981', createdAt: NOW },
  { id: '3', name: 'Savings Account', type: 'SAVINGS', currency: 'UZS', balance: 158_750_000, color: '#F59E0B', createdAt: NOW },
  { id: '4', name: 'Business Card', type: 'DEBIT_CARD', currency: 'UZS', balance: 41_656_000, color: '#8B5CF6', createdAt: NOW },
];

export const initialTransactions: Transaction[] = [
  { id: 't1', title: 'Salary Deposit', amount: 91_440_000, type: 'INCOME', category: 'salary', accountId: '1', date: '2026-02-20', createdAt: NOW },
  { id: 't2', title: 'Grocery Shopping', amount: 1_905_000, type: 'EXPENSE', category: 'food', accountId: '1', date: '2026-02-19', createdAt: NOW },
  { id: 't3', title: 'Freelance Project', amount: 10_160_000, type: 'INCOME', category: 'business', accountId: '1', date: '2026-02-18', createdAt: NOW },
  { id: 't4', title: 'Electric Bill', amount: 1_524_000, type: 'EXPENSE', category: 'housing', accountId: '1', date: '2026-02-17', createdAt: NOW },
  { id: 't5', title: 'Restaurant', amount: 1_079_500, type: 'EXPENSE', category: 'food', accountId: '1', date: '2026-02-16', createdAt: NOW },
];

export const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Food', limit: 19_050_000, spent: 15_240_000, month: MONTH, createdAt: NOW },
  { id: 'b2', category: 'Transport', limit: 7_620_000, spent: 5_715_000, month: MONTH, createdAt: NOW },
  { id: 'b3', category: 'Shopping', limit: 10_160_000, spent: 11_684_000, month: MONTH, createdAt: NOW },
  { id: 'b4', category: 'Entertainment', limit: 5_080_000, spent: 3_556_000, month: MONTH, createdAt: NOW },
  { id: 'b5', category: 'Housing', limit: 15_240_000, spent: 13_970_000, month: MONTH, createdAt: NOW },
  { id: 'b6', category: 'Health', limit: 6_350_000, spent: 1_905_000, month: MONTH, createdAt: NOW },
];

export const initialDebts: Debt[] = [
  { id: 'd1', personName: 'John Smith', amount: 6_350_000, direction: 'LENT', status: 'OPEN', date: '2026-01-15', dueDate: '2026-03-15', createdAt: NOW },
  { id: 'd2', personName: 'Sarah Johnson', amount: 2_540_000, direction: 'LENT', status: 'OPEN', date: '2026-02-01', dueDate: '2026-04-01', createdAt: NOW },
  { id: 'd3', personName: 'Mike Brown', amount: 1_905_000, direction: 'LENT', status: 'CLOSED', date: '2025-12-10', dueDate: '2026-02-10', createdAt: NOW },
  { id: 'd4', personName: 'Alice Cooper', amount: 10_160_000, direction: 'BORROWED', status: 'OPEN', date: '2026-01-20', dueDate: '2026-03-20', createdAt: NOW },
  { id: 'd5', personName: 'Bob Wilson', amount: 3_810_000, direction: 'BORROWED', status: 'OPEN', date: '2026-02-10', dueDate: '2026-05-10', createdAt: NOW },
  { id: 'd6', personName: 'Emma Davis', amount: 5_715_000, direction: 'BORROWED', status: 'CLOSED', date: '2025-11-15', dueDate: '2026-01-15', createdAt: NOW },
];
