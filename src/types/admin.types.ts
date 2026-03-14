/**
 * Admin dashboard API types.
 */

export interface AdminActivity {
  registrationsLast24h: number;
  loginsLast24h: number;
  transactionsLast24h: number;
}

export interface AdminGrowthPoint {
  month: string;
  newUsers: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  blockedUsers: number;
  totalAdmins: number;
  totalTransactionsToday: number;
  totalTransactionsThisMonth: number;
}
