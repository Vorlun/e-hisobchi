# e-Hisobchi — Frontend Architecture

## Project overview

**e-Hisobchi** is a financial management SaaS platform for businesses and individuals. The frontend is a **frontend-first** React SPA that manages:

- **Financial transactions** — income, expense, transfer
- **Accounts** — cards, cash, savings (multi-account)
- **Budgets** — per-category limits and progress
- **Debts** — lent/borrowed, open/closed
- **Transfers** — between accounts with balance updates
- **Dashboards & analytics** — charts, time filters, statistics
- **Family sharing** — members and permissions (UI only for now)
- **Smart features** — AI-style insights and toggles (UI only)
- **Settings** — profile, notifications, security, preferences

All amounts use **UZS (Uzbek so'm)**. The app is ready for backend integration via a small API layer and shared types.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Runtime** | React 18 |
| **Language** | TypeScript |
| **Build** | Vite 6 |
| **Routing** | React Router 7 |
| **Styling** | Tailwind CSS 4 |
| **State** | React Context (`FinanceProvider`) — no Zustand/Redux |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **UI primitives** | Radix UI (in `app/components/ui/`) |
| **Forms** | Controlled components; react-hook-form available |
| **Date** | Native `Date`; date-fns available |

---

## Folder structure

```
src/
├── main.tsx                 # Entry: React root + FinanceProvider
├── app/
│   ├── App.tsx              # Router provider only
│   ├── routes.ts            # createBrowserRouter config
│   ├── pages/               # Route components (one per URL)
│   │   ├── layout.tsx       # Main layout (sidebar + navbar + <Outlet />)
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   ├── accounts.tsx
│   │   ├── transactions.tsx
│   │   ├── transfer.tsx
│   │   ├── debts.tsx
│   │   ├── budget.tsx
│   │   ├── analytics.tsx
│   │   ├── family.tsx
│   │   ├── smart.tsx
│   │   └── settings.tsx
│   └── components/          # App-specific components
│       ├── card.tsx, button.tsx, badge.tsx, input.tsx, select.tsx, modal.tsx
│       ├── sidebar.tsx, navbar.tsx, logo.tsx
│       ├── add-transaction-modal.tsx
│       ├── spending-insight-card.tsx, financial-risk-score.tsx, ...
│       ├── figma/           # Figma-related helpers
│       └── ui/               # Reusable UI primitives (Radix-based)
├── store/
│   ├── FinanceStore.tsx     # Context + useFinance()
│   └── initialData.ts       # Mock data (accounts, transactions, budgets, debts)
├── services/
│   ├── api.ts               # Base fetch wrapper (API-ready; 204 handling; error body parsing)
│   ├── balance.ts           # Centralized balance deltas: computeDeltas, applyDeltasToAccounts
│   ├── selectors.ts         # Pure derived metrics: totalBalance, by category, incomeVsExpense
│   ├── validation.ts        # Guards: validateTransaction, validateTransfer, account exists
│   ├── accounts.ts          # Account helpers + id generation
│   ├── accounts.api.ts      # fetchAccounts, createAccountApi, updateAccountApi, deleteAccountApi
│   ├── transactions.ts      # createTransaction (balance logic in balance.ts)
│   ├── transactions.api.ts  # fetchTransactions, createTransactionApi, updateTransactionApi, deleteTransactionApi
│   ├── budgets.ts           # createBudget, getCurrentMonth
│   ├── budgets.api.ts       # fetchBudgets, createBudgetApi, updateBudgetApi
│   ├── debts.ts             # createDebt
│   └── debts.api.ts         # fetchDebts, createDebtApi, updateDebtApi, deleteDebtApi
├── types/
│   ├── index.ts             # Account, Transaction, Budget, Debt, Category; TRANSACTION_TYPES, ACCOUNT_TYPES, DEBT_*
│   └── categories.ts        # Default expense/income categories
├── hooks/
│   └── useFormatCurrency.ts # formatUzs helpers
├── utils/
│   ├── currency.ts         # formatUzs, formatUzsSigned, getDefaultCurrency
│   └── dates.ts            # getTodayString, getMonthString, getStartOfRange (time filters)
└── styles/
    ├── index.css            # Global entry (fonts, tailwind, theme)
    ├── tailwind.css         # Tailwind source
    ├── theme.css            # CSS variables (light/dark)
    └── fonts.css            # Font faces
```

---

## Component architecture

- **Layout**  
  - `Layout` (`pages/layout.tsx`): sidebar + navbar + `<Outlet />` for child routes.  
  - Sidebar and navbar are presentational; layout holds sidebar collapse state.

- **Dashboard / feature pages**  
  - Each route under `app/pages/` is a feature (Dashboard, Accounts, Transactions, Transfer, Debts, Budget, Analytics, Family, Smart, Settings).  
  - They use `useFinance()` for data and call `formatUzs` (or hooks) for display.  
  - No shared “dashboard component” folder; feature logic lives in the page or in `app/components/` when reused.

- **Reusable UI**  
  - `app/components/`: app-level building blocks (Card, Button, Badge, Input, Select, Modal, Sidebar, Navbar, AddTransactionModal, etc.).  
  - `app/components/ui/`: generic primitives (Radix-based dialogs, tabs, dropdowns, etc.).  
  - Styling is Tailwind; no visual changes introduced by this doc.

- **Feature-specific components**  
  - e.g. `AddTransactionModal`, `SpendingInsightCard`, `FinancialRiskScore`, `MonthlyForecast`, `AutoCategoryDetection`, `SpendingPrediction`.  
  - Used by one or a few pages; not a separate “features/” folder.

---

## Routing system

| Path | Component | Purpose |
|------|-----------|--------|
| `/login` | Login | Auth UI (no real auth yet) |
| `/` | Layout → Dashboard | Main app shell; dashboard home |
| `/accounts` | Accounts | List/add/edit/delete accounts; total balance |
| `/transactions` | Transactions | List, filter, add, delete transactions |
| `/transfer` | Transfer | Form: from/to account, amount; recent transfers |
| `/debts` | Debts | Lent/borrowed tabs; add; mark closed |
| `/budget` | Budget | Income goal; category budgets; add budget |
| `/analytics` | Analytics | Charts (trend, category, savings, income sources); time filter |
| `/family` | Family | Family members and sharing (mock data) |
| `/smart` | Smart | Smart toggles and notifications (mock) |
| `/settings` | Settings | Profile, notifications, security, billing, preferences |

All except `/login` render inside `Layout` (sidebar + navbar + content).

---

## Data structure

Data is in memory via `FinanceProvider`; initial state from `store/initialData.ts`. Types live in `types/index.ts`.

### Account

```ts
{
  id: string;
  name: string;
  type: 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'SAVINGS' | 'WALLET';
  currency: string;   // e.g. 'UZS'
  balance: number;    // in minor units / integer
  color: string;      // hex
  createdAt: string;  // ISO
}
```

### Transaction

```ts
{
  id: string;
  title: string;
  amount: number;     // positive for INCOME/TRANSFER display
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  category: string;   // category id
  accountId: string;
  toAccountId?: string;  // only for TRANSFER
  date: string;       // YYYY-MM-DD
  description?: string;
  createdAt: string;
}
```

### Budget

```ts
{
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;      // YYYY-MM
  createdAt: string;
}
```

### Debt

```ts
{
  id: string;
  personName: string;
  amount: number;
  direction: 'LENT' | 'BORROWED';
  status: 'OPEN' | 'CLOSED';
  date: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}
```

### Category (defaults in `types/categories.ts`)

```ts
{ id: string; name: string; type: 'expense' | 'income'; }
```

---

## State management

- **Global finance state**  
  - Single React Context: `FinanceProvider` in `main.tsx`.  
  - State: `accounts`, `transactions`, `budgets`, `debts`.  
  - Derived: `totalBalance` (via `selectTotalBalance`).  
  - Actions: `addAccount`, `updateAccount`, `deleteAccount`, `addTransaction`, `updateTransaction`, `deleteTransaction`, `addTransfer`, `addBudget`, `updateBudget`, `updateBudgetSpent`, `addDebt`, `markDebtClosed`, `closeDebt`.  
  - Selectors (from `services/selectors.ts`): `getTransactionsByTimeFilter`, `getExpenseByCategory`, `getIncomeVsExpense`.  
  - Balance updates go through `services/balance.ts`; validation through `services/validation.ts` before mutations.

- **Local state**  
  - Modals, filters, form fields, sidebar collapse, etc. are in `useState` (and similar) in the relevant page or component.

- **Data flow**  
  - Pages and modals call `useFinance()` and the above actions.  
  - Balance and budget spent are updated in the store when adding/editing/deleting transactions or transfers.  
  - No prop drilling of finance data; only layout props (e.g. sidebar collapse) are passed down.

- **Mock data**  
  - `store/initialData.ts` exports `initialAccounts`, `initialTransactions`, `initialBudgets`, `initialDebts`.  
  - Used only as initial state in `FinanceStore.tsx`.  
  - Family and Smart pages use their own local mock data.

---

## API integration readiness

- **Base client**  
  - `services/api.ts`: `api<T>(path, options?)` — `fetch` to `VITE_API_URL` + path, JSON, throws on non-ok.  
  - `isApiAvailable`: `Boolean(VITE_API_URL)`.

- **Where to plug API**  
  - Replace or wrap the logic inside `FinanceStore.tsx` that currently updates local state (e.g. after `addTransaction`, `addTransfer`, etc.) with calls to `api()` and then set state from response.  
  - Alternatively, add dedicated hooks (e.g. `useAccounts`, `useTransactions`) that call `api()` and optionally sync with the same context.  
  - Keep types in `types/index.ts` (and DTOs if needed) so request/response shapes match the frontend models above.

- **No backend yet**  
  - No `VITE_API_URL` → all state is in memory and from `initialData.ts`.  
  - Forms and actions already use the same types and signatures that an API would use.

---

## Currency (UZS)

- **Display**  
  - `utils/currency.ts`: `formatUzs(amount, options?)`, `formatUzsSigned(amount)`, `getDefaultCurrency()`.  
  - Used across dashboard, accounts, transactions, transfer, debts, budget, analytics.  
  - No UI/layout changes; only formatting.

---

## Build and entry

- **Entry**  
  - `index.html` → `src/main.tsx` → `FinanceProvider` → `App` → `RouterProvider` with `routes` from `app/routes.ts`.

- **Build**  
  - `pnpm run build` (Vite).  
  - Output: `dist/` (static SPA).  
  - No server-side rendering; backend will serve this and optionally proxy API.

This document describes the current frontend only; no UI redesign or visual changes.
