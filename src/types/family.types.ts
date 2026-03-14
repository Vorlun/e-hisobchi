/**
 * Family financial management — domain and API types.
 */

export interface FamilyMember {
  id: string;
  userId?: string;
  fullName: string;
  email?: string;
  role: 'OWNER' | 'MEMBER' | 'admin' | 'member';
  joinedAt: string;
  status?: 'active' | 'pending';
}

export interface Family {
  id: string;
  name: string;
  inviteToken?: string;
  inviteTokenExpiresAt?: string;
  owner?: { id?: string; fullName: string; email?: string };
  memberCount: number;
  createdAt: string;
  members?: FamilyMember[];
}

export interface MemberExpense {
  memberId?: string;
  memberName: string;
  expense?: number;
  income?: number;
  transactionCount?: number;
}

export interface FamilyStats {
  totalBalance: number;
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  memberExpenses?: MemberExpense[];
}

export interface FamilyTransaction {
  id?: string;
  memberName: string;
  accountName: string;
  type: string;
  amount: number;
  currency: string;
  categoryName: string;
  description?: string;
  date: string;
}

export interface FamilyTransactionsPagination {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}
