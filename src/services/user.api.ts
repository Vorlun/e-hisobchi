/**
 * User profile and account settings API.
 */

import { api } from './api';

export interface UserProfile {
  id: string;
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

export async function getProfile(): Promise<UserProfile> {
  const res = await api<UserProfile>('/users/me');
  if (!res?.id) throw new Error('Invalid profile response');
  return res;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const res = await api<UserProfile>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res?.id) throw new Error('Invalid profile response');
  return res;
}

export async function deleteAccount(password: string): Promise<void> {
  const params = new URLSearchParams({ password });
  await api(`/users/me?${params.toString()}`, { method: 'DELETE' });
}

export async function changeEmail(newEmail: string): Promise<void> {
  await api('/users/me/email/change', {
    method: 'POST',
    body: JSON.stringify({ newEmail }),
  });
}

export async function verifyEmail(otp: string, type: string): Promise<void> {
  await api('/users/me/email/verify', {
    method: 'POST',
    body: JSON.stringify({ otp, type }),
  });
}

export async function changePhone(newPhone: string): Promise<void> {
  await api('/users/me/phone/change', {
    method: 'POST',
    body: JSON.stringify({ newPhone }),
  });
}

export async function verifyPhone(otp: string, type: string): Promise<void> {
  await api('/users/me/phone/verify', {
    method: 'POST',
    body: JSON.stringify({ otp, type }),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await api('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });
}
