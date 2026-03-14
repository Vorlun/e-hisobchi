/**
 * User profile API types.
 */

export interface User {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  defaultCurrency: string;
  emailVerified?: boolean;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  defaultCurrency?: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface VerifyEmailRequest {
  otp: string;
  type: string;
}

export interface ChangePhoneRequest {
  newPhone: string;
}

export interface VerifyPhoneRequest {
  otp: string;
  type: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
