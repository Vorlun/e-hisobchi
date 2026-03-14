import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Logo } from '../components/logo';
import { Button } from '../components/button';
import { useAuth } from '../../store/authStore';
import { getSessionToken } from '../../services/tokenStorage';

interface VerifyLoginLocationState {
  sessionToken?: string;
  maskedEmail?: string;
}

export default function VerifyLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, sessionToken } = useAuth();
  const state = (location.state as VerifyLoginLocationState) || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailLabel = state.maskedEmail || 'your email';
  const hasSession = Boolean(sessionToken || state.sessionToken || getSessionToken());

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!hasSession) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <p className="text-[#64748B] mt-3 text-center">
              Enter the verification code sent to <span className="font-medium text-[#0F172A]">{emailLabel}</span>.
            </p>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] mb-4" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2 text-[#0F172A]">
                Login verification code
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
              {loading ? 'Verifying…' : 'Verify & continue'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-[#94A3B8] mt-6">
          © 2026 e-hisobchi.uz. All rights reserved.
        </p>
      </div>
    </div>
  );
}

