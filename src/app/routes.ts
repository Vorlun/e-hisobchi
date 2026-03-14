import React from 'react';
import { createBrowserRouter } from 'react-router';
import { AuthRoot, ProtectedRoute } from './AuthRoot';
import Login from './pages/login';
import Layout from './pages/layout';
import Dashboard from './pages/dashboard';
import Accounts from './pages/accounts';
import Transactions from './pages/transactions';
import Transfer from './pages/transfer';
import Debts from './pages/debts';
import Budget from './pages/budget';
import Analytics from './pages/analytics';
import Family from './pages/family';
import Smart from './pages/smart';
import Settings from './pages/settings';
import GoogleCallback from './pages/google-callback';
import VerifyLogin from './pages/verify-login';
import VerifyEmail from './pages/verify-email';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AuthRoot,
    children: [
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'verify-login',
        Component: VerifyLogin,
      },
      {
        path: 'verify-email',
        Component: VerifyEmail,
      },
      {
        path: 'auth/google/callback',
        Component: GoogleCallback,
      },
      {
        path: '',
        element: React.createElement(ProtectedRoute, null, React.createElement(Layout)),
        children: [
          {
            index: true,
            Component: Dashboard,
          },
          {
            path: 'dashboard',
            Component: Dashboard,
          },
          {
            path: 'accounts',
            Component: Accounts,
          },
          {
            path: 'transactions',
            Component: Transactions,
          },
          {
            path: 'transfer',
            Component: Transfer,
          },
          {
            path: 'debts',
            Component: Debts,
          },
          {
            path: 'budget',
            Component: Budget,
          },
          {
            path: 'analytics',
            Component: Analytics,
          },
          {
            path: 'family',
            Component: Family,
          },
          {
            path: 'smart',
            Component: Smart,
          },
          {
            path: 'settings',
            Component: Settings,
          },
        ],
      },
    ],
  },
]);
