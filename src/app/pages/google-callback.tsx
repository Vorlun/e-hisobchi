import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../store/authStore';
import { completeGoogleAuth, type CompleteGoogleAuthRequest } from '../../services/auth.api';
import { setTokens } from '../../services/tokenStorage';
import * as userApi from '../../services/user.api';

export default function GoogleCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code') || '';
      const email = params.get('email') || '';
      const googleId = params.get('googleId') || params.get('gid') || '';
      const fullName = params.get('fullName') || '';
      const phoneNumber = params.get('phoneNumber') || '';
      const defaultCurrency = params.get('defaultCurrency') || 'UZS';

      if (!code) {
        navigate('/login', { replace: true });
        return;
      }

      const payload: CompleteGoogleAuthRequest = {
        email,
        googleId,
        fullName: fullName || email,
        phoneNumber,
        defaultCurrency,
        code,
      };

      try {
        const res = await completeGoogleAuth(payload);
        setTokens(res.accessToken, res.refreshToken);
        try {
          await userApi.getProfile();
        } finally {
          await loadUser();
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    };

    void run();
  }, [location.search, loadUser, navigate]);

  return null;
}

