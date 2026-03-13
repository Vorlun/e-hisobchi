import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { UserProfile } from '../services/user.api';
import * as authApi from '../services/auth.api';
import * as userApi from '../services/user.api';
import { getAccessToken, getRefreshToken, setTokens, setStoredUser, clearTokens } from '../services/tokenStorage';

const DEVICE_ID_KEY = 'ehisobchi_device_id';

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    defaultCurrency: string;
  }) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setSessionToken: (token: string | null) => void;
  updateProfile: (data: userApi.UpdateProfileRequest) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  verifyEmail: (otp: string, type: string) => Promise<void>;
  changePhone: (newPhone: string) => Promise<void>;
  verifyPhone: (otp: string, type: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(getRefreshToken());

  /** Authenticated if we have an access token (persists across refresh). User may still be loading. */
  const isAuthenticated = Boolean(accessTokenState || getAccessToken());

  const setSessionToken = useCallback((token: string | null) => {
    setSessionTokenState(token);
  }, []);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
      setSessionTokenState(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:sessionExpired', onSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', onSessionExpired);
  }, [navigate]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      setLoading(true);
      try {
        const deviceId = getOrCreateDeviceId();
        const data = await authApi.login(identifier, password, deviceId);
        if (!('accessToken' in data) || !data.accessToken || !data.refreshToken) {
          throw new Error('Login requires additional verification which is not supported.');
        }
        setTokens(data.accessToken, data.refreshToken);
        setAccessTokenState(data.accessToken);
        setRefreshTokenState(data.refreshToken);
        try {
          const profile = await userApi.getProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
        setSessionTokenState(null);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!sessionToken) throw new Error('No session. Please sign in again.');
      setLoading(true);
      try {
        const res = await authApi.verifyLoginOtp(sessionToken, code);
        setTokens(res.accessToken, res.refreshToken);
        setAccessTokenState(res.accessToken);
        setRefreshTokenState(res.refreshToken);
        if (res.user) setStoredUser(res.user);
        try {
          const profile = await userApi.getProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
        setSessionTokenState(null);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    },
    [sessionToken, navigate]
  );

  const register = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      phoneNumber: string;
      defaultCurrency: string;
    }) => {
      setLoading(true);
      try {
        await authApi.register(data);
        // Send email verification OTP for registration flow.
        await authApi.sendRegisterEmailVerification(data.email);
        navigate('/verify-email', {
          replace: true,
          state: { email: data.email, password: data.password },
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const googleLogin = useCallback(async () => {
    setLoading(true);
    try {
      const url = await authApi.getGoogleUrl();
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const refresh = getRefreshToken();
      if (refresh) await authApi.logout(refresh);
      else clearTokens();
      setUser(null);
      setSessionTokenState(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await authApi.refreshToken(refresh);
      setTokens(res.accessToken, res.refreshToken);
      setAccessTokenState(res.accessToken);
      setRefreshTokenState(res.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }, []);

  const updateProfile = useCallback(async (data: userApi.UpdateProfileRequest) => {
    const profile = await userApi.updateProfile(data);
    setUser(profile);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string) => {
      await userApi.changePassword(currentPassword, newPassword, confirmPassword);
    },
    []
  );

  const changeEmail = useCallback(async (newEmail: string) => {
    await userApi.changeEmail(newEmail);
  }, []);

  const verifyEmail = useCallback(async (otp: string, type: string) => {
    await userApi.verifyEmail(otp, type);
    const profile = await userApi.getProfile();
    setUser(profile);
  }, []);

  const changePhone = useCallback(async (newPhone: string) => {
    await userApi.changePhone(newPhone);
  }, []);

  const verifyPhone = useCallback(async (otp: string, type: string) => {
    await userApi.verifyPhone(otp, type);
    const profile = await userApi.getProfile();
    setUser(profile);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      await userApi.deleteAccount(password);
      clearTokens();
      setUser(null);
      setSessionTokenState(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
      navigate('/login', { replace: true });
    },
    [navigate]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      loading,
      sessionToken,
       accessToken: accessTokenState,
       refreshToken: refreshTokenState,
      login,
      verifyOtp,
      register,
      googleLogin,
      logout,
      loadUser,
      refreshAccessToken,
      setSessionToken,
      updateProfile,
      changePassword,
      changeEmail,
      verifyEmail,
      changePhone,
      verifyPhone,
      deleteAccount,
    }),
    [
      user,
      isAuthenticated,
      loading,
      sessionToken,
      accessTokenState,
      refreshTokenState,
      login,
      verifyOtp,
      register,
      googleLogin,
      logout,
      loadUser,
      refreshAccessToken,
      setSessionToken,
      updateProfile,
      changePassword,
      changeEmail,
      verifyEmail,
      changePhone,
      verifyPhone,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { UserProfile };
