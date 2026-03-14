import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useFamily } from '../../store/familyStore';

/**
 * Join family via invite link: /family/join?token=...
 * Calls join API and redirects to /family on success.
 */
export default function FamilyJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { joinFamily, error, clearError } = useFamily();
  const [status, setStatus] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('joining');
    joinFamily(token)
      .then(() => {
        if (!cancelled) setStatus('done');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token, joinFamily]);

  useEffect(() => {
    if (status === 'done') {
      navigate('/family', { replace: true });
    }
  }, [status, navigate]);

  if (!token) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#DC2626]">Missing invite token. Use the link shared by your family.</p>
        <button
          type="button"
          onClick={() => navigate('/family', { replace: true })}
          className="mt-4 text-[#1E40AF] hover:underline"
        >
          Go to Family
        </button>
      </div>
    );
  }

  if (status === 'joining') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[#64748B]">Joining family…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-8 text-center">
        <p className="text-[#DC2626]">{error || 'Failed to join family.'}</p>
        <button
          type="button"
          onClick={() => { clearError(); navigate('/family', { replace: true }); }}
          className="mt-4 text-[#1E40AF] hover:underline"
        >
          Go to Family
        </button>
      </div>
    );
  }

  return null;
}
