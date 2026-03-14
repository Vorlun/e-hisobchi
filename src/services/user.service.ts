/**
 * User profile and security settings service.
 */

import * as userApi from './user.api';
import type {
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/user.types';

export type {
  User,
  UpdateProfileRequest,
  ChangeEmailRequest,
  VerifyEmailRequest,
  ChangePhoneRequest,
  VerifyPhoneRequest,
  ChangePasswordRequest,
} from '../types/user.types';

function toUser(profile: userApi.UserProfile): User {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    defaultCurrency: profile.defaultCurrency,
    emailVerified: profile.emailVerified,
  };
}

export async function fetchUser(): Promise<User> {
  const profile = await userApi.getProfile();
  return toUser(profile);
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const profile = await userApi.updateProfile(data);
  return toUser(profile);
}

export async function deleteAccount(password: string): Promise<void> {
  await userApi.deleteAccount(password);
}

export async function changeEmail(newEmail: string): Promise<void> {
  await userApi.changeEmail(newEmail);
}

export async function verifyEmail(otp: string, type: string): Promise<void> {
  await userApi.verifyEmail(otp, type);
}

export async function changePhone(newPhone: string): Promise<void> {
  await userApi.changePhone(newPhone);
}

export async function verifyPhone(otp: string, type: string): Promise<void> {
  await userApi.verifyPhone(otp, type);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await userApi.changePassword(
    data.currentPassword,
    data.newPassword,
    data.confirmPassword
  );
}
