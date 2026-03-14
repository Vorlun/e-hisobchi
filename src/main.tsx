import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { AccountProvider } from './store/accountStore';
import { TransactionProvider } from './store/transactionStore';
import { TransferProvider } from './store/transferStore';
import { FinanceProvider } from './store/FinanceStore';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccountProvider>
      <TransactionProvider>
        <TransferProvider>
          <FinanceProvider>
            <App />
          </FinanceProvider>
        </TransferProvider>
      </TransactionProvider>
    </AccountProvider>
  </React.StrictMode>
);
