/**
 * Single API client for backend integration.
 * Set VITE_API_URL in .env (e.g. VITE_API_URL=https://api.example.com/v1).
 * When empty, the app uses in-memory mock data only.
 * Throws on non-ok response so callers can catch and surface errors (e.g. toast, banner).
 * Attaches access token when present; on 401 attempts token refresh and retries once.
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.e-hisobchi.uz/api';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
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
  const data = (await res.json()) as RefreshResponse;
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
  if (accessToken) {
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
  if (res.status === 401 && !isRetryAfterRefresh && !path.includes('/auth/login')) {
    const refreshed = await attemptRefresh();
    if (refreshed) return api<T>(path, options, true);
    clearTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
    }
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
    if (res.status === 403) throw new Error(detail || 'You do not have permission to perform this action.');
    if (res.status >= 500) throw new Error(detail || 'Unexpected server error');
    throw new Error(detail || `Request failed (${res.status})`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const isApiAvailable = Boolean(API_BASE);
