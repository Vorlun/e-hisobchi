import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Logo } from '../components/logo';
import { Button } from '../components/button';
import { verifyEmail, sendRegisterEmailVerification } from '../../services/auth.api';

interface VerifyEmailLocationState {
  email?: string;
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as VerifyEmailLocationState) || {};
  const [email] = useState<string | undefined>(state.email);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await verifyEmail(code.trim());
      setInfo('Email verified successfully.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendSeconds > 0) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await sendRegisterEmailVerification(email);
      setResendSeconds(30);
      setInfo('Verification code resent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <p className="text-[#64748B] mt-3 text-center">
              We&apos;ve sent a verification code to <span className="font-medium text-[#0F172A]">{email}</span>.
            </p>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] mb-4" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-[#059669] mb-4" role="status">
              {info}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">
                Email verification code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" aria-hidden />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                  required
                  maxLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || code.trim().length !== 6}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
              {loading ? 'Verifying…' : 'Verify email'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-[#64748B]">
            <span>
              Didn&apos;t receive the code?
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendSeconds > 0}
              className="text-[#1E40AF] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-[#94A3B8] mt-6">
          © 2026 e-hisobchi.uz. All rights reserved.
        </p>
      </div>
    </div>
  );
}

