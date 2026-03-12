# e-Hisobchi — Technical Improvements (No UI Changes)

This document lists technical fixes and improvements applied to the frontend. **No visual design, layout, colors, or UX were changed.**

---

## 1. Bug fixes

### Time filter (store)

- **File:** `src/store/FinanceStore.tsx`
- **Issue:** `getTransactionsByTimeFilter` compared `t.date` (YYYY-MM-DD) to full ISO string `startStr`, so the filter could include or exclude transactions incorrectly.
- **Fix:** Use a single date string for the start of the range: `startDateStr = start.toISOString().slice(0, 10)` and filter with `t.date >= startDateStr`.

### Category filter (transactions)

- **File:** `src/app/pages/transactions.tsx`
- **Issue:** `categoryFilterOptions` merged expense and income categories without deduplication; "other" appeared twice (expense + income).
- **Fix:** Build the combined list and deduplicate by `value` so each category appears once in the dropdown.

---

## 2. Code quality

- **Documentation:** Added `docs/ARCHITECTURE.md` (project overview, tech stack, folder structure, components, routing, data, state, API readiness) and `docs/BACKEND_INTEGRATION.md` (expected endpoints, request/response shapes, where to plug API calls).
- **Types:** All domain models live in `src/types/index.ts`; enums and interfaces are used consistently across store and services.
- **No intentional UI changes:** Only logic, types, and docs were touched; styling and layout were not modified.

---

## 3. Architecture clarification (for backend)

- **State:** Single React Context (`FinanceProvider`) holds accounts, transactions, budgets, debts; no Zustand/Redux.
- **Data flow:** Pages use `useFinance()`; actions and getters are defined in `FinanceStore.tsx`; API integration should replace or wrap these actions and initial state loading.
- **API entry point:** `src/services/api.ts` with `api<T>(path, options)` and `VITE_API_URL`; new endpoints can be called from the store or from new service modules that the store uses.

---

## 4. Build and tooling

- **Build:** `pnpm run build` completes successfully (Vite).
- **Lint:** No new lint or TypeScript errors introduced by these changes.

---

## Summary

| Category        | Change                                                                 |
|----------------|-------------------------------------------------------------------------|
| Bug fix        | Time filter date comparison in `getTransactionsByTimeFilter`           |
| Bug fix        | Duplicate "other" in transactions category filter dropdown             |
| Documentation  | `docs/ARCHITECTURE.md` — full frontend architecture                     |
| Documentation  | `docs/BACKEND_INTEGRATION.md` — API contract and integration guide     |
| Documentation  | `docs/IMPROVEMENTS.md` — this list of improvements                     |

The UI remains visually identical to the original; the app is better documented and ready for production backend integration.

---

## 5. Architecture alignment (implementation vs docs)

- **Date handling:** Added `utils/dates.ts` with `getTodayString()`, `getMonthString()`, `getStartOfRange(filter)` so time filtering and transaction dates use a single convention (YYYY-MM-DD / YYYY-MM). `FinanceStore` uses these for transfer dates and `getTransactionsByTimeFilter`.
- **Edit transaction:** `updateTransaction` now recalculates balance impact (reverse old, apply new) and budget spent (subtract old expense, add new expense) so edits keep state consistent.
- **Delete transaction:** When deleting an expense, budget spent for that category and month is decreased.
- **Budget category matching:** Budget-to-expense category comparison is case-insensitive (`categoryMatches`) so "Food" and "food" match; supports both display names and category ids.
- **Balance deltas:** Added `mergeBalanceDeltas()` in `services/transactions.ts` to combine reverse + new deltas in one pass for `updateTransaction`.
- **API client:** `api.ts` documents `VITE_API_URL` as the single env entry for the base URL.

---

## 6. Production-grade architecture

- **Domain model:** `types/index.ts` — strict types; const arrays (`TRANSACTION_TYPES`, `ACCOUNT_TYPES`, `DEBT_DIRECTIONS`, `DEBT_STATUSES`, `CATEGORY_TYPES`) and type guards (`isTransactionType`, `isAccountType`, etc.) for validation and iteration.
- **Balance consistency:** `services/balance.ts` — single source for balance logic: `computeDeltasForTransaction`, `mergeDeltas`, `applyDeltasToAccounts`, `reverseDeltas`. Store uses these for add/update/delete transaction and transfer; no duplicate logic.
- **Derived metrics:** `services/selectors.ts` — pure selectors: `selectTotalBalance`, `selectMonthlyIncome`, `selectMonthlyExpense`, `selectSavings`, `selectExpenseByCategory`, `selectIncomeByCategory`, `selectIncomeVsExpenseTimeline`, `selectTransactionsByTimeFilter`. Store and pages use these; no duplicated calculation.
- **Validation:** `services/validation.ts` — `validateTransaction`, `validateTransfer`, `validateAccountExists`, `validateTransactionAmount`, `validateTransferAmount`. Store actions validate before mutating; invalid ops throw so callers can surface errors.
- **API layer:** `services/*.api.ts` — transport-only: `accounts.api.ts`, `transactions.api.ts`, `budgets.api.ts`, `debts.api.ts`. Store can switch from mock state to these calls without UI changes.
- **State structure:** FinanceStore exposes `updateBudget(id, data)`, `closeDebt(id)` (alias for `markDebtClosed`). Selectors used for getters; actions remain predictable.
- **Error resilience:** `api.ts` — catch fetch failures, parse error body for message, handle 204 No Content. Validation errors thrown from store for future toast/banner handling.
- **Budgets dates:** `getCurrentMonth()` in `budgets.ts` uses `getMonthString()` from `utils/dates` for consistency.

---

## 7. Transactions API integration (Income / Expense)

- **Service:** `src/services/transactions.api.ts` — backend transport: `Transaction` (id, accountId, accountName, type, amount, currency, categoryId, categoryName, description, date, transferToAccountId/Name), `getTransactions(filters?, page?, size?)` with paginated response (`content`, `page`, `size`, `totalElements`, `totalPages`, `last`), `getTransactionById`, `createTransaction`, `updateTransaction`, `deleteTransaction`. Filters: `type`, `categoryId`, `accountId`, `dateFrom`, `dateTo`.
- **Types:** `src/types/index.ts` — `Transaction` extended with optional `accountName`, `categoryId`, `categoryName`, `transferToAccountId`, `transferToAccountName` for API mapping.
- **Store:** `FinanceStore` — state: `transactionPagination`, `transactionFilters`; `loadTransactions()` fetches from API when `isApiAvailable` and sets `transactions` + pagination; `setTransactionFilters(partial)`, `setTransactionPage(page)`; on mount when API available, `loadTransactions()` runs; `addTransaction` / `updateTransaction` / `deleteTransaction` when API: call API then `loadTransactions()` + `loadAccounts()` (backend updates balances); local mode unchanged.
- **Category mapping:** API response `categoryId` / `categoryName` mapped to store `Transaction`; `title` from `description` or `categoryName`.
- **Transactions page:** Filter dropdowns (type, category) call `setTransactionFilters` so API reloads with filters; no UI layout/style changes.
- **AddTransactionModal:** Submit awaits `addTransaction` / `addTransfer` so API errors are caught and shown.
- **Error handling:** `success=false` from API throws; 401 handled by `api.ts` (refresh / redirect).

---

## 8. Transfers API integration

- **Service:** `src/services/transfers.api.ts` — backend transport: `Transfer` (id, fromAccountId, fromAccountName, toAccountId?, toAccountName?, toCardNumber?, fromAmount, toAmount, fromCurrency, toCurrency, exchangeRate?, purpose?, purposeNameUz?, description?, external?, date), `getTransfers(dateFrom?, dateTo?, page?, size?)` with paginated response, `getTransferById`, `createTransfer(fromAccountId, toAccountId?, toCardNumber?, amount, purpose?, description?)`, `getTransferPurposes()` returning `{ code, nameUz, nameRu, nameEn }[]`.
- **Store:** `FinanceStore` — state: `transfers`, `transferPagination`, `transferPurposes`; `loadTransfers()` and `loadTransferPurposes()` on mount when API available; `addTransfer` when API: calls `createTransfer` then `loadTransfers()` + `loadAccounts()` (backend updates balances); local mode unchanged.
- **Transfer page:** Uses `transfers` from store for "Recent Transfers" when API data present (from/to/amount/date/currency from Transfer); otherwise falls back to transaction-based list. Submit awaits `addTransfer` for error handling; no UI layout or styling changes.
- **External transfers:** API supports `toCardNumber` for external transfers; store and form currently use `toAccountId` for internal transfers; purposes loaded for future dropdown use.
- **Error handling:** `success=false` throws; 401 handled by `api.ts`.

---

## 9. Debts API integration

- **Service:** `src/services/debts.api.ts` — backend transport: `Debt` (id, type LENT|BORROWED, personName, personPhone?, amount, currency, description?, date, dueDate?, status OPEN|CLOSED, overdue), `DebtSummary` (totalBorrowed, totalLent, openCount, overdueCount); `getDebts({ type?, status? })`, `getDebtById`, `createDebt`, `updateDebt`, `closeDebt` (PATCH /debts/{id}/close), `getDebtSummary()`.
- **Types:** `src/types/index.ts` — `Debt` extended with optional `personPhone`, `currency`, `overdue` for API mapping.
- **Store:** `FinanceStore` — state: `debtSummary`; `loadDebts(filters?)` (stores last filter in ref, fetches with type/status); `loadDebtSummary()` on mount when API available; `addDebt` / `updateDebt` / `markDebtClosed` when API: call API then `loadDebts()` + `loadDebtSummary()`; local mode unchanged.
- **Debts page:** Calls `loadDebts({ type: debtType })` on mount and when tab (given/owed) changes; list is API-filtered (no frontend filter on full list); summary cards use `debtSummary.totalLent` / `totalBorrowed` for "Total Lent/Borrowed", show `overdueCount` in Total Open subtitle; open debt cards show "Overdue" badge when `debt.overdue` from backend; submit awaits `addDebt`; no layout/styling changes.
- **Overdue:** Backend `overdue` used directly; no frontend overdue calculation.
- **Error handling:** `success=false` throws; 401 handled by `api.ts`.

---

## 10. Statistics and Analytics API integration

- **Service:** `src/services/statistics.api.ts` — `getSummary(dateFrom?, dateTo?, currency?)` → `SummaryStats` (totalIncome, totalExpense, netBalance, currency, dateFrom, dateTo); `getTimeline(period DAILY|WEEKLY|MONTHLY|YEARLY, dateFrom?, dateTo?)` → `TimelineDataPoint[]` (label, income, expense); `getCategoryStats(type INCOME|EXPENSE, dateFrom?, dateTo?)` → `CategoryStatsItem[]`; `getCalendarStats(dateFrom?, dateTo?)` → `CalendarStatsItem[]`; `getTopCategories(dateFrom?, dateTo?, limit?)` → `TopCategoryItem[]`.
- **Dates:** `src/utils/dates.ts` — `getStatsDateRange(filter: TimeFilter)` returns `{ dateFrom, dateTo }` for stats API.
- **Store:** `FinanceStore` — state: `summaryStats`, `timelineStats`, `categoryStats`, `incomeCategoryStats`, `calendarStats`, `topCategories`; `loadStats(filter: TimeFilter)` derives date range and period, calls all five endpoints in parallel, stores results (cache: reload when filter changes).
- **Analytics page:** On mount and when `timeFilter` changes, calls `loadStats(timeFilter)`; uses `timelineStats` for Income vs Expense trend (month: label, income, expense, savings); uses `categoryStats` (EXPENSE) for category breakdown and comparison chart; uses `summaryStats` for total income/expense/net and savings rate when present; uses `incomeCategoryStats` for Income Sources section; falls back to existing `getIncomeVsExpense` / `getExpenseByCategory` and local calculations when API stats are empty. Chart components and layout unchanged.
- **Error handling:** `success=false` throws; 401 handled by `api.ts`.

---

## 11. Production stabilization pass

- **API layer (`api.ts`):** 403 → throw permission error; 5xx → throw server error message; 401 after failed refresh → clearTokens + dispatch `auth:sessionExpired`; optional `signal` passed to `fetch` for abort support.
- **Session expiry:** AuthProvider listens for `auth:sessionExpired` and clears user state + redirects to `/login`.
- **Token storage:** Comment added that sessionStorage is used; localStorage can be used for “remember me”.
- **Store sync:** `updateTransaction` (API mode) also calls `loadBudgetStatus()` after update.
- **Loading states:** FinanceStore exposes `loadingAccounts`, `loadingTransactions`, `loadingTransfers`, `loadingBudgets`, `loadingDebts`, `loadingStats`; each load* sets loading true/false in finally. Dashboard, Accounts, Transactions, Transfer, Budget, Debts, Analytics use `aria-busy` and sr-only “Loading…” for a11y without layout change.
- **Race conditions:** `loadStats` and `loadDebts` use a request-id ref so only the latest response updates state when filter/tab changes quickly.
