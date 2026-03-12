import type { Budget } from '../types';
import { getMonthString } from '../utils/dates';
import { generateId } from './accounts';

export function getCurrentMonth(): string {
  return getMonthString();
}

export function createBudget(
  category: string,
  limit: number,
  spent: number,
  month?: string
): Budget {
  return {
    id: generateId(),
    category,
    limit,
    spent: spent ?? 0,
    month: month ?? getCurrentMonth(),
    createdAt: new Date().toISOString(),
  };
}
