import React, { createContext, useCallback, useMemo, useState } from 'react';
import type {
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/user.types';
import * as userService from '../services/user.service';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface UserContextValue extends UserState {
  fetchUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  changeEmail: (newEmail: string) => Promise<void>;
  verifyEmail: (otp: string, type: string) => Promise<void>;
  changePhone: (newPhone: string) => Promise<void>;
  verifyPhone: (otp: string, type: string) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.fetchUser();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<User> => {
    setError(null);
    try {
      const updated = await userService.updateProfile(data);
      setUser(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  }, []);

  const changeEmail = useCallback(async (newEmail: string) => {
    setError(null);
    try {
      await userService.changeEmail(newEmail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change email';
      setError(message);
      throw err;
    }
  }, []);

  const verifyEmail = useCallback(async (otp: string, type: string) => {
    setError(null);
    try {
      await userService.verifyEmail(otp, type);
      await fetchUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify email';
      setError(message);
      throw err;
    }
  }, [fetchUser]);

  const changePhone = useCallback(async (newPhone: string) => {
    setError(null);
    try {
      await userService.changePhone(newPhone);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change phone';
      setError(message);
      throw err;
    }
  }, []);

  const verifyPhone = useCallback(async (otp: string, type: string) => {
    setError(null);
    try {
      await userService.verifyPhone(otp, type);
      await fetchUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify phone';
      setError(message);
      throw err;
    }
  }, [fetchUser]);

  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    setError(null);
    try {
      await userService.changePassword(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    setError(null);
    try {
      await userService.deleteAccount(password);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      loading,
      error,
      fetchUser,
      updateProfile,
      changeEmail,
      verifyEmail,
      changePhone,
      verifyPhone,
      changePassword,
      deleteAccount,
      clearError,
    }),
    [
      user,
      loading,
      error,
      fetchUser,
      updateProfile,
      changeEmail,
      verifyEmail,
      changePhone,
      verifyPhone,
      changePassword,
      deleteAccount,
      clearError,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
