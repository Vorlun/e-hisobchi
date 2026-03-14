/**
 * Superadmin — admin management API types.
 */

export type AdminRole = 'SUPER_ADMIN' | string;

export interface Admin {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: AdminRole;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAdminRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminRequest {
  fullName?: string;
  email?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}
