/**
 * Single API client for backend integration.
 * - Attaches access token for protected endpoints
 * - Refreshes tokens on 401 and retries once
 * - Normalizes backend error responses and surfaces toast notifications
 */

import { toast } from 'sonner';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.e-hisobchi.uz/api';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

interface WrappedRefreshResponse {
  success?: boolean;
  data?: { accessToken: string; refreshToken: string; expiresIn?: number };
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const url = `${API_BASE}/auth/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const raw = (await res.json()) as RefreshResponse | WrappedRefreshResponse;
  const data = raw && typeof raw === 'object' && 'data' in raw && raw.data ? raw.data : (raw as RefreshResponse);
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
    return true;
  }
  return false;
}

export async function api<T>(
  path: string,
  options?: RequestInit,
  isRetryAfterRefresh = false
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  const isPublicAuthEndpoint =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/login/verify-otp') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/verify/email') ||
    path.startsWith('/auth/verify/email/send') ||
    path.startsWith('/auth/forgot-password') ||
    path.startsWith('/auth/reset-password');

  if (accessToken && !isPublicAuthEndpoint) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, signal: options?.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Request failed: ${message}`);
  }
  if (res.status === 401 && !isRetryAfterRefresh && !isPublicAuthEndpoint) {
    const refreshed = await attemptRefresh();
    if (refreshed) return api<T>(path, options, true);
    clearTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
    }
    toast.error('Session expired. Please sign in again.');
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const body = await res.text();
    let detail = res.statusText;
    try {
      const json = body ? JSON.parse(body) : null;
      if (json?.message) detail = json.message;
      else if (json?.error) detail = json.error;
    } catch {
      if (body) detail = body.slice(0, 200);
    }
    let message = detail || `Request failed (${res.status})`;
    if (res.status === 400) {
      message = detail || 'Invalid input. Please check the form and try again.';
      toast.error(message);
      throw new Error(message);
    }
    if (res.status === 401) {
      message = isPublicAuthEndpoint && path.includes('/auth/login') ? 'Invalid email or password' : (detail || 'Unauthorized');
      toast.error(message);
      throw new Error(message);
    }
    if (res.status === 403) {
      message = detail || 'You do not have permission to perform this action.';
      toast.error(message);
      throw new Error(message);
    }
    if (res.status === 409) {
      message = detail || 'Account already exists';
      toast.error(message);
      throw new Error(message);
    }
    if (res.status >= 500) {
      message = detail || 'Server error';
      toast.error(message);
      throw new Error(message);
    }
    toast.error(message);
    throw new Error(message);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const isApiAvailable = Boolean(API_BASE);
