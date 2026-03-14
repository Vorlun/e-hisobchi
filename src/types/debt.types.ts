/**
 * Debt API types — lent/borrowed tracking.
 */

export type DebtTypeApi = 'LENT' | 'BORROWED';
export type DebtStatusApi = 'OPEN' | 'CLOSED';

export interface DebtApi {
  id: string;
  type: DebtTypeApi;
  personName: string;
  personPhone?: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  dueDate?: string;
  status: DebtStatusApi;
  overdue: boolean;
}

export interface DebtSummary {
  totalBorrowed: number;
  totalLent: number;
  openCount: number;
  overdueCount: number;
}

export interface DebtFilters {
  type?: DebtTypeApi;
  status?: DebtStatusApi;
}

export interface CreateDebtRequest {
  type: DebtTypeApi;
  personName: string;
  personPhone?: string;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  dueDate?: string;
}

export type UpdateDebtRequest = CreateDebtRequest;
