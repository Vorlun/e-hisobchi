/**
 * Admin user management API types.
 */

export interface AdminUser {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  defaultCurrency: string;
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt: string;
  totalAccounts?: number;
  totalTransactions?: number;
  totalDebts?: number;
  totalBudgets?: number;
}

export interface AdminUsersFilters {
  query?: string;
  enabled?: boolean;
  locked?: boolean;
  page?: number;
  size?: number;
}

export interface PaginatedAdminUsers {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface BlockUserRequest {
  reason?: string;
}
