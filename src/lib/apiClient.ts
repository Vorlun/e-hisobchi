/**
 * Central API client for backend requests.
 * - baseURL from VITE_API_URL
 * - Authorization header for protected routes
 * - Automatic token refresh on 401 and retry
 * - Normalized errors (400, 401, 403, 404, 409, 429, 5xx) with toast notifications
 */
export { api, isApiAvailable, getBaseUrl } from '../services/api';
