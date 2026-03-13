import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/logo';
import { Button } from '../components/button';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { getAccessToken } from '../../services/tokenStorage';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const UZ_PHONE_REGEX = /^\+998\d{9}$/;

function normalizeUzPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let rest = digits;
  if (rest.startsWith('998')) {
    rest = rest.slice(3);
  } else if (rest.startsWith('8')) {
    rest = rest.slice(1);
  }
  rest = rest.slice(0, 9);
  if (!rest) return '';
  return `+998${rest}`;
}

function formatUzPhoneInput(input: string): string {
  const normalized = normalizeUzPhone(input);
  if (!normalized) return '';
  const core = normalized.slice(4); // remove +998
  const part1 = core.slice(0, 2);
  const part2 = core.slice(2, 5);
  const part3 = core.slice(5, 7);
  const part4 = core.slice(7, 9);
  const parts = [
    part1,
    part2,
    part3,
    part4,
  ].filter(Boolean);
  return `+998${parts.length ? ` ${parts.join(' ')}` : ''}`;
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, googleLogin, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('UZS');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const state = location.state as { registerSuccess?: boolean } | null;
    if (state?.registerSuccess) {
      setSuccessMessage('Account created successfully. Please login.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  if (getAccessToken() || isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const normalizedPhone = useMemo(() => normalizeUzPhone(phoneNumber), [phoneNumber]);

  const isRegisterFormValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedFullName) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) return false;
    if (password.length < 8) return false;
    if (!UZ_PHONE_REGEX.test(normalizedPhone)) return false;
    return true;
  }, [fullName, email, password, normalizedPhone]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = normalizedPhone;
    const currency = defaultCurrency && defaultCurrency !== 'string' ? defaultCurrency : 'UZS';

    // Basic frontend validation to avoid obvious 400s
    if (!trimmedFullName) {
      setError('Full name is required');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!UZ_PHONE_REGEX.test(trimmedPhone)) {
      setError('Please enter a valid Uzbekistan phone number');
      return;
    }

    try {
      await register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
        phoneNumber: trimmedPhone,
        defaultCurrency: currency || 'UZS',
      });
      // register() will navigate to /verify-email and start OTP verification flow.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <p className="text-[#64748B] mt-3 text-center">
              Smart Financial Management Platform
            </p>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] mb-4" role="alert">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-[#059669] mb-4" role="status">
              {successMessage}
            </p>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E40AF] focus:ring-[#1E40AF]" />
                  <span className="text-sm text-[#64748B]">Remember me</span>
                </label>
                <button type="button" className="text-sm text-[#1E40AF] hover:underline" aria-label="Forgot password">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Phone number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = formatUzPhoneInput(e.target.value);
                      setPhoneNumber(formatted);
                    }}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Default currency
                </label>
                <div className="relative">
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                  >
                    <option value="UZS">UZS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#0F172A]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={googleLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                className="text-[#1E40AF] hover:underline"
                aria-label={mode === 'login' ? 'Sign up for free' : 'Back to sign in'}
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Sign up for free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          © 2026 e-hisobchi.uz. All rights reserved.
        </p>
      </div>
    </div>
  );
}
