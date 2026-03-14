import React from 'react';
import { Link } from 'react-router';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../store/themeStore';
import { useLanguage } from '../../store/languageStore';

const LANG_OPTIONS = [
  { code: 'uz' as const, label: 'UZ' },
  { code: 'ru' as const, label: 'RU' },
  { code: 'en' as const, label: 'EN' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] dark:border-[#334155] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo_full.png" alt="e-Hisobchi" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg">
              {LANG_OPTIONS.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    language === code
                      ? 'bg-[#1E40AF] text-white dark:bg-[#3B82F6]'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                  aria-pressed={language === code}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-[#1E40AF] dark:text-[#60A5FA] hover:underline"
            >
              Kirish
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] dark:bg-[#3B82F6] rounded-xl hover:opacity-90 transition-opacity"
            >
              Bepul boshlash
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F172A] dark:text-white mb-6">
            Oila byudjetingizni boshqaring
          </h1>
          <p className="text-lg text-[#64748B] dark:text-[#94A3B8] mb-10">
            E-Hisobchi — hisoblar, tranzaksiyalar, byudjet va statistika bitta joyda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-[#1E40AF] dark:bg-[#3B82F6] rounded-xl hover:opacity-90 transition-opacity"
            >
              Bepul boshlash
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-[#1E40AF] dark:text-[#60A5FA] border-2 border-[#1E40AF] dark:border-[#3B82F6] rounded-xl hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/30 transition-colors"
            >
              Kirish
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white text-center mb-12">
            Imkoniyatlar
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Hisoblar va kartalar', desc: 'Barcha hisob va bank kartalaringizni bitta joyda boshqaring.' },
              { title: 'Tranzaksiyalar', desc: 'Daromad va xarajatlarni kategoriyalarga ajrating.' },
              { title: 'Byudjet', desc: 'Oylik byudjet rejalang va xarajatlarni kuzating.' },
              { title: 'Oila rejimi', desc: 'Oila a\'zolari bilan moliyani baham ko\'ring.' },
              { title: 'Statistika', desc: 'Grafiklar va hisobotlar orqali tahlil qiling.' },
              { title: 'Qarzlar', desc: 'Qarz va qarzdorliklarni kiritib boring.' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]"
              >
                <h3 className="font-semibold text-[#0F172A] dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#334155] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
          © {new Date().getFullYear()} e-Hisobchi. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
