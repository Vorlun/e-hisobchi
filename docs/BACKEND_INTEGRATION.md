# e-Hisobchi — Backend Integration Guide

This document describes how to connect the e-Hisobchi frontend to a backend API. The app is built so that swapping mock state for API calls requires minimal UI changes.

---

## Environment

Set the API base URL:

```env
VITE_API_URL=https://api.example.com/v1
```

The frontend uses `import.meta.env.VITE_API_URL` in `src/services/api.ts`. If empty, the app runs with in-memory mock data only.

---

## API client

Location: `src/services/api.ts`

```ts
api<T>(path: string, options?: RequestInit): Promise<T>
```

- Uses `fetch` with `Content-Type: application/json`.
- Prepends `VITE_API_URL` to `path`.
- Returns `res.json()` as `Promise<T>`.
- Throws on non-ok response.

Use this (or a thin wrapper) for all backend calls so that base URL, headers, and error handling stay in one place.

---

## Expected endpoints and data shapes

Request/response bodies should align with the TypeScript types in `src/types/index.ts`. All monetary amounts are in **UZS** (integer, no decimals in API if possible).

---

### Authentication (future)

- **POST /auth/login**  
  - Request: `{ email: string; password: string }`  
  - Response: e.g. `{ token: string; user: { id: string; email: string; name?: string } }`  
  - The login page currently only navigates to `/`; you will add a call here and store the token (e.g. in memory or localStorage) and pass it in `Authorization` for other requests.

- **POST /auth/logout**  
  - Optional; clear token on frontend.

- **GET /auth/me**  
  - Response: current user.  
  - Use to restore session and protect routes.

---

### Accounts

- **GET /accounts**  
  - Response: `Account[]`  
  - Shape: `{ id: string; name: string; type: string; currency: string; balance: number; color?: string; createdAt: string }`  
  - Used to replace `store.accounts` on load and after mutations.

- **POST /accounts**  
  - Request: `Omit<Account, 'id' | 'createdAt'>` (name, type, currency, balance, color)  
  - Response: `Account` (with `id`, `createdAt`)  
  - Used when adding an account from the Accounts page.

- **PATCH /accounts/:id**  
  - Request: `Partial<Account>` (e.g. name, currency, type)  
  - Response: `Account`  
  - Used when editing an account (balance is usually updated via transactions).

- **DELETE /accounts/:id**  
  - Response: `204` or `{ success: true }`  
  - Used when deleting an account.

---

### Transactions

- **GET /transactions**  
  - Query: optional `?from=YYYY-MM-DD&to=YYYY-MM-DD&accountId=...&type=EXPENSE|INCOME|TRANSFER`  
  - Response: `Transaction[]`  
  - Shape: `{ id: string; title: string; amount: number; type: string; category: string; accountId: string; toAccountId?: string; date: string; description?: string; createdAt: string }`  
  - Used to replace `store.transactions` and for lists/filters.

- **POST /transactions**  
  - Request: `Omit<Transaction, 'id' | 'createdAt'>`  
  - Response: `Transaction`  
  - Used by Add Transaction modal (expense/income/transfer).  
  - Backend should apply balance updates (decrease account for expense, increase for income, transfer between two accounts).

- **PATCH /transactions/:id**  
  - Request: `Partial<Transaction>`  
  - Response: `Transaction`  
  - Used when editing a transaction (and optionally recalculating balances).

- **DELETE /transactions/:id**  
  - Response: `204` or `{ success: true }`  
  - Used when deleting a transaction. Backend should reverse balance impact.

---

### Transfers

The frontend treats a transfer as a **transaction with `type: 'TRANSFER'`** and `toAccountId` set. So either:

- Use **POST /transactions** with `type: 'TRANSFER'`, `accountId`, `toAccountId`, `amount`, `date`, etc., and let the backend update both accounts, or  
- Provide **POST /transfers** with body like `{ fromAccountId: string; toAccountId: string; amount: number; date?: string; description?: string }` and return a `Transaction` (or same shape).  
  - Then the frontend would call this instead of `addTransfer`-via-transaction when integrating.

---

### Budgets

- **GET /budgets**  
  - Query: optional `?month=YYYY-MM`  
  - Response: `Budget[]`  
  - Shape: `{ id: string; category: string; limit: number; spent: number; month: string; createdAt: string }`  
  - Used to replace `store.budgets` and for Budget page.

- **POST /budgets**  
  - Request: `Omit<Budget, 'id' | 'createdAt'>` or `{ category: string; limit: number; month?: string }`  
  - Response: `Budget`  
  - Used when adding a budget.  
  - Backend may compute `spent` from transactions or accept it.

- **PATCH /budgets/:id**  
  - Request: `Partial<Budget>` (e.g. limit, spent)  
  - Response: `Budget`  
  - Used when editing a budget or when backend pushes updated `spent`.

---

### Debts

- **GET /debts**  
  - Response: `Debt[]`  
  - Shape: `{ id: string; personName: string; amount: number; direction: 'LENT' | 'BORROWED'; status: 'OPEN' | 'CLOSED'; date: string; dueDate?: string; notes?: string; createdAt: string }`  
  - Used to replace `store.debts` on Debts page.

- **POST /debts**  
  - Request: `Omit<Debt, 'id' | 'createdAt'>` or `{ personName: string; amount: number; direction: string; date: string; dueDate?: string; notes?: string }`  
  - Response: `Debt`  
  - Used when adding a debt (lent/borrowed).

- **PATCH /debts/:id**  
  - Request: e.g. `{ status: 'CLOSED' }` or `Partial<Debt>`  
  - Response: `Debt`  
  - Used when marking a debt as paid/closed.

- **DELETE /debts/:id**  
  - Optional; response `204` or `{ success: true }`.

---

### Dashboard / analytics (optional)

The dashboard and analytics pages derive everything from **accounts**, **transactions**, **budgets**, and **debts**. So you can keep using GET for those and compute on the frontend, or add:

- **GET /dashboard/summary**  
  - Response: e.g. `{ totalBalance: number; monthlyIncome: number; monthlyExpense: number; totalDebtsOwed: number }`  
  - Used to replace local computations if you prefer server-side aggregation.

- **GET /analytics/income-vs-expense?filter=monthly|yearly**  
  - Response: `{ period: string; income: number; expense: number }[]`  
  - Same for **GET /analytics/expense-by-category**, etc., if you want server-side charts.

If you don’t add these, the current frontend logic (using `getTransactionsByTimeFilter`, `getExpenseByCategory`, `getIncomeVsExpense`) remains valid as long as you load transactions (and optionally budgets) from the API.

---

### Categories

- **GET /categories**  
  - Response: `Category[]`  
  - Shape: `{ id: string; name: string; type: 'expense' | 'income' }`  
  - Used to replace the static list in `src/types/categories.ts` for dropdowns and filters.

If you don’t implement this, the app keeps using the default categories from the frontend.

---

## Where to implement API calls in the frontend

1. **Central place (recommended)**  
   - In `src/store/FinanceStore.tsx`:  
     - On mount (or after login), call `api('/accounts')`, `api('/transactions')`, etc., and set state.  
     - For each action (e.g. `addTransaction`), call `POST /transactions`, then either replace the list with a fresh GET or append the returned item and update accounts/budgets from the response.  
   - Keep the same context shape so that all existing pages and components continue to use `useFinance()` without UI changes.

2. **Dedicated service layer**  
   - Add `src/services/accounts.api.ts`, `transactions.api.ts`, etc., that use `api()` and return typed data.  
   - Call these from `FinanceStore.tsx` (or from new hooks that then update the same context).  
   - This keeps the store thin and makes it easy to add retries, caching, or optimistic updates later.

3. **Auth**  
   - In `Login` (`app/pages/login.tsx`): on submit, call `POST /auth/login`, store the token, set default headers (e.g. `Authorization: Bearer <token>`) in `api.ts` or a wrapper, then navigate to `/`.  
   - Optional: a small auth context or a wrapper component that calls `GET /auth/me` and only then renders the app.

---

## Error handling and loading

- The current `api()` throws on non-ok. Add a global error handler (e.g. toast or banner) and, if needed, retry or redirect to login on 401.
- Pages don’t show loading states yet. When switching to API, add loading flags in the store or in hooks and show skeletons or spinners in the same layout places (e.g. dashboard cards, tables) without changing the visual design.

---

## Summary table

| Area        | GET | POST | PATCH | DELETE |
|------------|-----|------|-------|--------|
| Auth       | /auth/me | /auth/login, /auth/logout | — | — |
| Accounts   | /accounts | /accounts | /accounts/:id | /accounts/:id |
| Transactions | /transactions | /transactions | /transactions/:id | /transactions/:id |
| Budgets    | /budgets | /budgets | /budgets/:id | (optional) |
| Debts      | /debts | /debts | /debts/:id | (optional) |
| Categories | /categories | (admin) | (admin) | (admin) |
| Dashboard  | (optional) /dashboard/summary | — | — | — |
| Analytics  | (optional) /analytics/* | — | — | — |

Using the types in `src/types/index.ts` for request and response bodies will keep the frontend and backend aligned. The UI does not need to change when you switch from mock data to these endpoints.
