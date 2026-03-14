import React from 'react';
import { useLanguage } from '../../../store/languageStore';

const LANGUAGES = [
  { code: 'uz' as const, label: 'UZ' },
  { code: 'ru' as const, label: 'RU' },
  { code: 'en' as const, label: 'EN' },
] as const;

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

export function LanguageSwitcher({ collapsed }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (collapsed) {
    return (
      <div className="p-2 flex justify-center" title={`Language: ${language.toUpperCase()}`}>
        <span className="text-xs font-medium text-[#64748B]">{language.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-[#E2E8F0]">
      <p className="text-xs font-medium text-[#64748B] mb-2">Language</p>
      <div className="flex gap-2">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              language === code
                ? 'bg-[#1E40AF] text-white'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
            }`}
            aria-pressed={language === code}
            aria-label={`Set language to ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
