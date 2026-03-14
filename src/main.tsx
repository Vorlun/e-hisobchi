import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { ThemeProvider } from './store/themeStore';
import { LanguageProvider } from './store/languageStore';
import { AccountProvider } from './store/accountStore';
import { TransactionProvider } from './store/transactionStore';
import { TransferProvider } from './store/transferStore';
import { CardProvider } from './store/cardStore';
import { BudgetProvider } from './store/budgetStore';
import { CategoryProvider } from './store/categoryStore';
import { CurrencyProvider } from './store/currencyStore';
import { AdminDashboardProvider } from './store/adminDashboardStore';
import { DebtProvider } from './store/debtStore';
import { DeviceProvider } from './store/deviceStore';
import { StatisticsProvider } from './store/statisticsStore';
import { UserProvider } from './store/userStore';
import { AdminUserProvider } from './store/adminUserStore';
import { FinanceProvider } from './store/FinanceStore';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
    <AccountProvider>
      <TransactionProvider>
        <TransferProvider>
          <CardProvider>
            <BudgetProvider>
              <CategoryProvider>
                <CurrencyProvider>
                  <AdminDashboardProvider>
                    <DebtProvider>
                      <DeviceProvider>
                        <StatisticsProvider>
                          <UserProvider>
                            <AdminUserProvider>
                              <FinanceProvider>
                                <App />
                              </FinanceProvider>
                            </AdminUserProvider>
                          </UserProvider>
                        </StatisticsProvider>
                      </DeviceProvider>
                    </DebtProvider>
                  </AdminDashboardProvider>
                </CurrencyProvider>
              </CategoryProvider>
            </BudgetProvider>
          </CardProvider>
        </TransferProvider>
      </TransactionProvider>
    </AccountProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
