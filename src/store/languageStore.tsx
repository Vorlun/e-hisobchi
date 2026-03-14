import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ehisobchi_lang';
export type Language = 'uz' | 'ru' | 'en';

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'uz';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'uz' || stored === 'ru' || stored === 'en') return stored;
  return 'uz';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LABELS: Record<Language, Record<string, string>> = {
  uz: {
    dashboard: 'Bosh sahifa',
    accounts: 'Hisoblar',
    cards: 'Bank Kartalar',
    transactions: 'Tranzaksiyalar',
    categories: 'Kategoriyalar',
    transfers: "O'tkazmalar",
    budgets: 'Byudjet',
    debts: 'Qarzlar',
    family: 'Oila',
    statistics: 'Statistika',
    currency: 'Valyuta',
    devices: 'Qurilmalar',
    profile: 'Profil',
    smart: 'Smart',
    settings: 'Sozlamalar',
  },
  ru: {
    dashboard: 'Главная',
    accounts: 'Счета',
    cards: 'Банковские карты',
    transactions: 'Транзакции',
    categories: 'Категории',
    transfers: 'Переводы',
    budgets: 'Бюджет',
    debts: 'Долги',
    family: 'Семья',
    statistics: 'Статистика',
    currency: 'Валюта',
    devices: 'Устройства',
    profile: 'Профиль',
    smart: 'Умные функции',
    settings: 'Настройки',
  },
  en: {
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    cards: 'Bank Cards',
    transactions: 'Transactions',
    categories: 'Categories',
    transfers: 'Transfers',
    budgets: 'Budgets',
    debts: 'Debts',
    family: 'Family',
    statistics: 'Statistics',
    currency: 'Currency',
    devices: 'Devices',
    profile: 'Profile',
    smart: 'Smart Features',
    settings: 'Settings',
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string) => {
      return LABELS[language][key] ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
