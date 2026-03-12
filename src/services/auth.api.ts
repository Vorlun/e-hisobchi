/**
 * Auth API — login (step 1), verify OTP (step 2), refresh, logout, get current user.
 */

import { api } from './api';
import { clearTokens } from './tokenStorage';

export interface LoginRequest {
  identifier: string;
  password: string;
  deviceId: string;
}

export interface LoginDataSession {
  sessionToken: string;
  maskedEmail?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  otpRequired?: boolean;
}

export interface LoginDataDirect {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

/** Login response: either OTP required (sessionToken) or direct (accessToken + refreshToken). */
export type LoginData = LoginDataSession | LoginDataDirect;

function isLoginDirect(data: LoginData): data is LoginDataDirect {
  return 'accessToken' in data && 'refreshToken' in data;
}

// Legacy shape with success/data wrapper (kept for compatibility)
export interface LoginResponse {
  success: boolean;
  data: LoginDataSession | LoginDataDirect;
  message?: string;
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

export async function login(
  identifier: string,
  password: string,
  deviceId: string
): Promise<LoginData> {
  const res = await api<LoginResponse | LoginDataSession | LoginDataDirect>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, deviceId }),
  });

  if (res && typeof res === 'object' && 'success' in res && (res as LoginResponse).success === false) {
    const r = res as LoginResponse & { message?: string };
    throw new Error(r.message || 'Login failed');
  }

  let data: LoginData;
  if (res && typeof res === 'object' && 'data' in res) {
    data = (res as LoginResponse).data;
  } else if (res && typeof res === 'object') {
    data = res as LoginDataSession | LoginDataDirect;
  } else {
    throw new Error('Invalid login response');
  }

  if (isLoginDirect(data)) {
    if (!data.accessToken || !data.refreshToken) throw new Error('Invalid login response');
    return data;
  }
  if (!data.sessionToken) throw new Error('Invalid login response');
  return data;
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

export async function refreshToken(refreshTokenValue: string): Promise<RefreshResponse> {
  const res = await api<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  if (!res?.accessToken || !res?.refreshToken) {
    throw new Error('Invalid refresh response');
  }
  return res;
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
