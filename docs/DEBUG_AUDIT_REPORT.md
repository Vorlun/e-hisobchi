# Frontend Production Debugging Audit Report

**Project:** e-Hisobchi fintech web application  
**Scope:** Full frontend codebase audit before production  
**Date:** Generated from codebase scan  
**Rule:** No code was modified; this report only identifies issues.

---

## CRITICAL

### C1. Add Transaction modal may send category slug instead of categoryId to API

**File:** `src/app/components/add-transaction-modal.tsx`  
**Description:** When the user uses "Smart" (NLP) entry mode, `parseNaturalLanguage()` sets `category` to slugs like `'food'`, `'other'`, `'transport'`. On submit, `formData.category` is sent as `categoryId` to the backend via `addTransaction({ ..., category: formData.category || 'other' })`. The backend expects `categoryId` to be a valid ID (e.g. UUID or number), not a slug. Manual entry uses `categoryOptions` with `value: c.id`, so manual flow is correct; only Smart mode can send an invalid categoryId.  
**Recommended fix:** Before calling `addTransaction`, resolve slug to categoryId (e.g. map `'food'` → first matching expense/income category id by name or slug), or ensure Smart mode sets `formData.category` to a real category id from `expenseCategories`/`incomeCategories` instead of a slug.

---

### C2. Tokens stored in localStorage (XSS exposure)

**File:** `src/services/tokenStorage.ts`  
**Description:** Access token, refresh token, session token, and user data are stored in `localStorage`. If the site is vulnerable to XSS, an attacker can read these and impersonate the user. For fintech, sensitive tokens are often stored in httpOnly cookies or memory-only with refresh in secure cookie.  
**Recommended fix:** Prefer httpOnly cookies for refresh token (and access token if backend supports it); keep access token in memory only and refresh from cookie when needed. If cookies are not an option, document the risk and ensure strict CSP and XSS hardening.

---

### C3. Delete account sends password in query string

**File:** `src/services/user.api.ts` (around line 90–92)  
**Description:** `deleteAccount(password)` sends the password as a query parameter: `DELETE /users/me?password=...`. Query strings are often logged in server access logs, proxies, and browser history, exposing the password.  
**Recommended fix:** Send password in request body, e.g. `body: JSON.stringify({ password })`, and use `DELETE` with body if the backend supports it, or use `POST /users/me/delete` with body. Confirm backend contract and change accordingly.

---

## HIGH

### H1. Stale auth context state after 401 refresh in api.ts

**File:** `src/services/api.ts`, `src/store/authStore.tsx`  
**Description:** When a request returns 401, `api.ts` calls `attemptRefresh()`, then `setTokens()` in tokenStorage. The auth store’s in-memory state (`accessTokenState`, `refreshTokenState`) is not updated. Components that read `useAuth().accessToken` (if any) would see the old value until the next `loadUser()` or page reload. Currently the app relies on `getAccessToken()` from storage for the next request, so API calls are correct, but any UI that displays or depends on context token state could be inconsistent.  
**Recommended fix:** After a successful refresh in `api.ts`, dispatch a custom event (e.g. `auth:tokensRefreshed`) and have `AuthProvider` listen and call `setAccessTokenState` / `setRefreshTokenState` from storage, or expose a `syncTokensFromStorage()` and call it from the api layer after refresh.

---

### H2. Transaction store: no request cancellation or request ID (race condition)

**File:** `src/store/transactionStore.tsx`  
**Description:** `fetchTransactions` is called from a `useEffect` that depends on filters and pagination. If the user changes filters or page quickly, multiple requests can be in flight; the one that finishes last wins. There is no `requestId` or `AbortController` to ignore outdated responses or cancel previous requests.  
**Recommended fix:** Use a `requestIdRef` (increment on each fetch, ignore responses where `requestId !== requestIdRef.current`) as in `statisticsStore.tsx`, or pass an `AbortSignal` from an `AbortController` that is aborted when filters/page change, and pass `signal` into the API call.

---

### H3. Transfer store: same race condition as transactions

**File:** `src/store/transferStore.tsx`  
**Description:** Same pattern as H2: `fetchTransfers` runs in an effect when `transferPagination.page` or `size` changes; no request ID or cancellation. A slow response can overwrite a newer one.  
**Recommended fix:** Add request ID or `AbortController` as in H2.

---

### H4. Profile endpoint inconsistency (GET /auth/me vs GET /users/me)

**File:** `src/services/user.api.ts` (getProfile)  
**Description:** `getProfile()` calls `GET /auth/me`. Some backends expose profile at `GET /users/me`. If the backend only provides `GET /users/me`, profile loading will fail or return a different shape.  
**Recommended fix:** Confirm backend contract. If profile is only at `GET /users/me`, switch `getProfile()` to that endpoint and align response parsing (and ensure auth header is still sent).

---

### H5. Google callback duplicate getProfile and redundant call

**File:** `src/app/pages/google-callback.tsx`  
**Description:** After `completeGoogleAuth(payload)`, the code calls `await userApi.getProfile()` and then `await loadUser()`. `loadUser()` itself calls `userApi.getProfile()` and sets the user. So `getProfile()` is called twice; the first result is not used.  
**Recommended fix:** Remove the explicit `await userApi.getProfile()` and only call `await loadUser()` (and then navigate). Optionally keep a single getProfile if you need the result before calling loadUser for other reasons.

---

## MEDIUM

### M1. auth.api logout clears tokens inside the API function

**File:** `src/services/auth.api.ts` (logout)  
**Description:** `logout(refreshTokenValue)` calls `clearTokens()` in a `finally` block. The auth store’s `logout()` also calls `clearTokens()` in its `finally`. So tokens are cleared twice. Not a functional bug but duplicated logic and slightly confusing.  
**Recommended fix:** Either have only the auth store clear tokens after calling the API (remove `clearTokens()` from `auth.api.logout`), or have only the API clear and document that calling `authApi.logout` is enough. Prefer single responsibility in the store.

---

### M2. Add Transaction – transfer without “To Account” not validated

**File:** `src/app/components/add-transaction-modal.tsx` (handleSubmit)  
**Description:** For `formData.type === 'transfer'`, the code checks `formData.toAccount` before calling `addTransfer`. If `toAccount` is an empty string (e.g. user cleared the field or bypassed HTML5 validation), `addTransfer(formData.account, '', amountNum, ...)` could be called, sending an empty `toAccountId`.  
**Recommended fix:** Explicitly validate: if type is transfer, require `formData.toAccount` to be non-empty before calling `addTransfer`; otherwise set an error and return.

---

### M3. Family store: no request ID for loadTransactions / loadStats

**File:** `src/store/familyStore.tsx`  
**Description:** `loadStats` and `loadTransactions` are triggered when `family` is set. Rapid navigation or re-mounts could trigger overlapping requests; the last response wins. No request ID or cancellation.  
**Recommended fix:** Add a `requestIdRef` (or AbortController) for `loadStats` and `loadTransactions` and ignore or cancel outdated responses.

---

### M4. Admin user store: fetchUsers(filters) does not reset page when filters change

**File:** `src/store/adminUserStore.tsx`  
**Description:** When the admin changes `query`, `enabled`, or `locked`, they call `fetchUsers(filters)`. The store merges `filters` with existing pagination (`page: filters?.page ?? 0`). If the caller does not pass `page: 0` when filters change, the previous page index is reused and can show an empty or wrong page.  
**Recommended fix:** When filters (e.g. query, enabled, locked) change, reset `page` to 0 in the store or in the UI before calling `fetchUsers`. Optionally have the store detect “filter change” and reset page internally.

---

### M5. Budget add form uses category name for API while select value is id

**File:** `src/app/pages/budget.tsx` (handleAddBudget)  
**Description:** `addForm.category` holds the selected option value (category id). The code then looks up the option label, strips the icon to get `categoryName`, and calls `addBudget(categoryName, limit)`. The store resolves `categoryName` back to a category id. This works but is redundant and fragile if labels or names change.  
**Recommended fix:** Consider changing `addBudget` to accept `categoryId` and `limit` so the store does not need to resolve by name; then pass `addForm.category` (id) directly.

---

## LOW

### L1. isAuthenticated derived from both state and storage

**File:** `src/store/authStore.tsx`  
**Description:** `isAuthenticated = Boolean(accessTokenState || getAccessToken())`. So even if in-memory state is stale, reading from storage keeps it correct. Slightly redundant and can confuse when debugging.  
**Recommended fix:** Keep as is for resilience, or rely only on storage and document that `isAuthenticated` is “token present in storage” for consistency.

---

### L2. Device ID stored in localStorage

**File:** `src/services/auth.api.ts` (getOrCreateDeviceId)  
**Description:** Device id for login is stored in `localStorage`. Same XSS/visibility concerns as tokens, though device id is less sensitive.  
**Recommended fix:** Accept as low risk, or move to a cookie / backend-assigned id if required by security policy.

---

### L3. No AbortController usage for list fetches

**File:** Multiple stores (transactionStore, transferStore, familyStore, etc.)  
**Description:** None of the stores pass `signal` to the API. When the user navigates away or changes filters quickly, in-flight requests are not cancelled, wasting bandwidth and potentially updating unmounted or stale state.  
**Recommended fix:** In stores, create an `AbortController` per fetch, pass `signal` into the service/API, and abort the previous controller when filters/page change or on unmount. Ensure the API client supports `options.signal` (it does in `api.ts`).

---

### L4. Session token in localStorage

**File:** `src/services/tokenStorage.ts`  
**Description:** Session token (for OTP step) is stored in `localStorage` (via `SESSION_TOKEN_KEY`). Same storage exposure as other tokens.  
**Recommended fix:** If the session token is short-lived and required for the OTP step only, consider holding it in React state only (or sessionStorage) and not persisting across tabs; document the choice.

---

### L5. completeGoogleAuth response may be wrapped

**File:** `src/services/auth.api.ts` (completeGoogleAuth)  
**Description:** `completeGoogleAuth` expects `res?.accessToken` and `res?.refreshToken` directly. If the backend wraps the response in `{ success, data: { accessToken, refreshToken, user } }`, the current parsing would fail.  
**Recommended fix:** Check backend response shape. If wrapped, unwrap `data` before returning (same pattern as `verifyLoginOtp` and `refreshToken`).

---

## Summary Table

| Severity  | Count | Focus area                          |
|-----------|-------|-------------------------------------|
| CRITICAL  | 3     | CategoryId/slug, token storage, password in URL |
| HIGH      | 5     | Auth state after refresh, race conditions, profile endpoint, duplicate getProfile |
| MEDIUM    | 5     | Logout double-clear, transfer validation, family/admin races, budget category |
| LOW       | 5     | isAuthenticated derivation, device id, AbortController, session token, Google response wrap |

---

## Authentication Flow – Summary

- **Login:** Uses deviceId, sessionToken stored and used for OTP step; flow is consistent.
- **OTP verification:** Tokens and user are set; session token cleared; redirect to dashboard. Correct.
- **Refresh:** api.ts refreshes and updates storage; auth context state is not updated (H1).
- **Logout:** Tokens cleared in both auth.api and authStore (M1).
- **Session restore:** loadUser() on mount; getProfile() and token check; redirect to login on failure. Correct.
- **Token storage:** All in localStorage (C2, L4).

---

## API Request Validation – Summary

- Endpoints and request bodies are largely consistent with the described backend (auth, users, transactions, transfers, debts, budgets, categories, cards, family, devices, statistics, admin). The main risks are: profile endpoint (H4), delete account sending password in query (C3), and categoryId vs slug in add transaction (C1). Confirm all paths and body shapes against the actual backend spec.

---

## State Management – Summary

- Multiple context stores (auth, finance, account, transaction, transfer, card, budget, category, debt, device, statistics, user, adminUser, family, etc.) are used. FinanceStore orchestrates some of them. No duplicated “source of truth” for the same entity; possible issues are race conditions (H2, H3, M3) and stale auth state after refresh (H1). Pagination state (page, size, totalPages) is held in stores; admin user list pagination should reset page when filters change (M4).

---

## Forms – Summary

- **Login/register:** Validation present (email, password, phone for register). Good.
- **Add account:** Name and balance validation; button disabled when name empty. Good.
- **Add transaction:** Category can be slug in Smart mode (C1); transfer toAccount not strictly validated (M2).
- **Add budget:** Uses category id in select but passes name to addBudget (M5). Works but redundant.
- **Add debt:** personName and amount validated. Good.
- **Settings profile/password:** Uses user store and validation. Good.

---

## Pagination – Summary

- **Transactions:** Page/size/totalPages in transactionStore; effect refetches when filters or page change. Race condition (H2).
- **Transfers:** Same pattern; race condition (H3).
- **Admin users:** Pagination state in adminUserStore; fetchUsers accepts filters. Page should reset when filters change (M4).
- **Family transactions:** loadTransactions(page, size) with pagination state; no request ID (M3).

---

## Performance – Summary

- No unnecessary duplicate API calls except Google callback getProfile (H5).
- Statistics store uses requestId to avoid race; other list stores do not (H2, H3, M3).
- No obvious large-list rendering issues; tables use pagination.

---

## Security – Summary

- Tokens and session token in localStorage (C2, L4).
- Password sent in query string for delete account (C3).
- No sensitive data found in console.log (none in src).
- Auth header is attached by api.ts for non-public endpoints; refresh and retry on 401 are implemented.

---

## Next Steps

1. Fix CRITICAL items (C1–C3) before production.
2. Address HIGH items (H1–H5) for correctness and consistency.
3. Apply MEDIUM fixes for robustness and clarity.
4. Optionally apply LOW fixes for maintainability and best practice.
5. Re-run this audit after changes and run full regression (auth, dashboard, accounts, transactions, transfers, budgets, cards, categories, family, debts, statistics, profile, admin).
