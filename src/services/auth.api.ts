/**
 * Auth API — login (step 1), verify OTP (step 2), refresh, logout, get current user.
 */

import { api } from './api';
import { clearTokens } from './tokenStorage';

export interface LoginRequest {
  identifier: string;
  password: string;
}

/** Login response: sessionToken and emailVerified. User must complete OTP at /verify-login. */
export interface LoginResponse {
  sessionToken: string;
  emailVerified?: boolean;
  maskedEmail?: string;
}

/** Backend wraps login response in { success, message?, data }. */
interface WrappedLoginResponse {
  success?: boolean;
  message?: string;
  data?: LoginResponse;
}

export interface VerifyOtpRequest {
  sessionToken: string;
  code: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: AuthUser;
}

/** Backend wraps success responses in { success, message?, data }. */
export interface WrappedVerifyOtpResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
    user?: AuthUser;
  };
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  defaultCurrency: string;
}

export interface GoogleUrlResponse {
  data?: string;
  url?: string;
}

interface GoogleUrlApiResponse {
  success: boolean;
  data: string;
}

export interface CompleteGoogleAuthRequest {
  email: string;
  googleId: string;
  fullName: string;
  phoneNumber: string;
  defaultCurrency: string;
  code: string;
}

export interface AuthWithTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function getOrCreateDeviceId(): string {
  const key = 'ehisobchi_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const deviceId = getOrCreateDeviceId();
  const res = await api<WrappedLoginResponse | LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, deviceId }),
  });
  const data =
    res && typeof res === 'object' && 'data' in res && (res as WrappedLoginResponse).data
      ? (res as WrappedLoginResponse).data
      : (res as LoginResponse);
  if (!data?.sessionToken) throw new Error('Invalid login response');
  return { sessionToken: data.sessionToken, emailVerified: data.emailVerified, maskedEmail: data.maskedEmail };
}

export async function verifyLoginOtp(
  sessionToken: string,
  code: string
): Promise<VerifyOtpResponse> {
  const res = await api<WrappedVerifyOtpResponse | VerifyOtpResponse>('/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ sessionToken, code }),
  });
  if (res && typeof res === 'object' && 'success' in res && (res as WrappedVerifyOtpResponse).success === false) {
    const r = res as WrappedVerifyOtpResponse & { message?: string };
    throw new Error(r.message || 'Verification failed');
  }
  const data =
    res && typeof res === 'object' && 'data' in res
      ? (res as WrappedVerifyOtpResponse).data
      : (res as VerifyOtpResponse);
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Invalid verify OTP response');
  }
  return data;
}

interface WrappedRefreshResponse {
  success?: boolean;
  data?: RefreshResponse;
}

export async function refreshToken(refreshTokenValue: string): Promise<RefreshResponse> {
  const res = await api<WrappedRefreshResponse | RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  const data =
    res && typeof res === 'object' && 'data' in res && (res as WrappedRefreshResponse).data
      ? (res as WrappedRefreshResponse).data
      : (res as RefreshResponse);
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Invalid refresh response');
  }
  return data;
}

export async function logout(refreshTokenValue: string): Promise<void> {
  try {
    await api('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await api<{ user?: AuthUser } | AuthUser>('/auth/me');
  const user = res && typeof res === 'object' && 'user' in res ? (res as { user: AuthUser }).user : (res as AuthUser);
  return user && typeof user === 'object' && user.id ? user : null;
}

export async function register(data: RegisterRequest): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res && typeof res === 'object' && res.success === false) {
    throw new Error(res.message || 'Registration failed');
  }
}

/** Send registration email verification OTP. */
export async function sendRegisterEmailVerification(email: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/verify/email/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (res && typeof res === 'object' && res.success === false) {
    throw new Error(res.message || 'Failed to send verification code');
  }
}

/** Verify registration email OTP. Body: { code }. On success redirect to /login. */
export async function verifyEmail(code: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/verify/email', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error((res as { message?: string }).message || 'Invalid verification code');
  }
}

/** Request password reset email. */
export async function forgotPassword(email: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error((res as { message?: string }).message || 'Failed to send reset email');
  }
}

/** Reset password with token from email. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error((res as { message?: string }).message || 'Password reset failed');
  }
}

/** Send phone verification OTP (e.g. after change phone). */
export async function sendPhoneVerification(phoneNumber: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/verify/phone/send', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
  });
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error((res as { message?: string }).message || 'Failed to send verification code');
  }
}

/** Verify phone OTP. */
export async function verifyPhoneCode(code: string): Promise<void> {
  const res = await api<{ success?: boolean; message?: string }>('/auth/verify/phone', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  });
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error((res as { message?: string }).message || 'Invalid verification code');
  }
}

export async function getGoogleUrl(): Promise<string> {
  const res = await api<GoogleUrlApiResponse | GoogleUrlResponse | string>('/auth/google/url');
  if (typeof res === 'string') {
    return res;
  }
  if (res && typeof res === 'object' && 'success' in res) {
    const r = res as GoogleUrlApiResponse;
    if (r.success && r.data) return r.data;
  }
  const simple = res as GoogleUrlResponse;
  if (simple?.data) return simple.data;
  if (simple?.url) return simple.url;
  throw new Error('Invalid Google URL response');
}

export async function completeGoogleAuth(data: CompleteGoogleAuthRequest): Promise<AuthWithTokensResponse> {
  const res = await api<AuthWithTokensResponse>('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res?.accessToken || !res?.refreshToken) {
    throw new Error('Invalid Google auth response');
  }
  return res;
}

export async function getMe(): Promise<AuthUser | null> {
  return getCurrentUser();
}

// Convenience alias matching prompt naming
export async function verifyOtp(sessionToken: string, code: string): Promise<VerifyOtpResponse> {
  return verifyLoginOtp(sessionToken, code);
}

export function logoutLocal(): void {
  clearTokens();
}
