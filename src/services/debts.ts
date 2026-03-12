import type { Debt, DebtDirection, DebtStatus } from '../types';
import { generateId } from './accounts';

export function createDebt(
  personName: string,
  amount: number,
  direction: DebtDirection,
  date: string,
  dueDate?: string,
  notes?: string
): Debt {
  return {
    id: generateId(),
    personName,
    amount,
    direction,
    status: 'OPEN',
    date,
    dueDate,
    notes,
    createdAt: new Date().toISOString(),
  };
}
