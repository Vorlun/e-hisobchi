import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { FinanceProvider } from './store/FinanceStore';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </React.StrictMode>
);
