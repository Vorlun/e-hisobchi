import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Family, FamilyMember, FamilyStats, FamilyTransaction, FamilyTransactionsPagination } from '../types/family.types';
import * as familyService from '../services/family.service';

interface FamilyState {
  family: Family | null;
  members: FamilyMember[];
  stats: FamilyStats | null;
  transactions: FamilyTransaction[];
  transactionPagination: FamilyTransactionsPagination;
  loading: boolean;
  loadingStats: boolean;
  loadingTransactions: boolean;
  error: string | null;
}

interface FamilyContextValue extends FamilyState {
  loadFamily: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadTransactions: (page?: number, size?: number) => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
  deleteFamily: () => Promise<void>;
  generateInviteLink: () => Promise<string>;
  joinFamily: (token: string) => Promise<void>;
  leaveFamily: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  setFamilyPage: (page: number) => void;
  clearError: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

const DEFAULT_PAGINATION: FamilyTransactionsPagination = {
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
};

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [transactions, setTransactions] = useState<FamilyTransaction[]>([]);
  const [transactionPagination, setTransactionPagination] = useState<FamilyTransactionsPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await familyService.getMyFamily();
      setFamily(data);
      setMembers(data?.members ?? []);
    } catch (err) {
      setFamily(null);
      setMembers([]);
      setError(err instanceof Error ? err.message : 'Failed to load family');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!family) return;
    setLoadingStats(true);
    try {
      const data = await familyService.getFamilyStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [family?.id]);

  const loadTransactions = useCallback(async (page = 0, size = 20) => {
    if (!family) return;
    setLoadingTransactions(true);
    try {
      const { content, pagination } = await familyService.getFamilyTransactions({ page, size });
      setTransactions(content);
      setTransactionPagination(pagination);
    } catch {
      setTransactions([]);
      setTransactionPagination(DEFAULT_PAGINATION);
    } finally {
      setLoadingTransactions(false);
    }
  }, [family?.id]);

  const setFamilyPage = useCallback((page: number) => {
    loadTransactions(page, transactionPagination.size);
  }, [loadTransactions, transactionPagination.size]);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  const createFamily = useCallback(async (name: string) => {
    setError(null);
    try {
      const created = await familyService.createFamily(name);
      setFamily(created);
      setMembers(created.members ?? []);
      await loadStats();
      navigate('/family', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
      throw err;
    }
  }, [navigate, loadStats]);

  const updateFamilyName = useCallback(async (name: string) => {
    if (!family) return;
    setError(null);
    try {
      const updated = await familyService.updateFamilyName(name);
      setFamily(updated);
      setMembers(updated.members ?? members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update family name');
      throw err;
    }
  }, [family?.id, members]);

  const deleteFamily = useCallback(async () => {
    setError(null);
    try {
      await familyService.deleteFamily();
      setFamily(null);
      setMembers([]);
      setStats(null);
      setTransactions([]);
      setTransactionPagination(DEFAULT_PAGINATION);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family');
      throw err;
    }
  }, [navigate]);

  const generateInviteLink = useCallback(async (): Promise<string> => {
    if (!family) throw new Error('No family');
    const token = await familyService.generateInviteLink();
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/family/join?token=${encodeURIComponent(token)}`;
  }, [family?.id]);

  const joinFamily = useCallback(async (token: string) => {
    setError(null);
    try {
      await familyService.joinFamily(token);
      await loadFamily();
      navigate('/family', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
      throw err;
    }
  }, [navigate, loadFamily]);

  const leaveFamily = useCallback(async () => {
    setError(null);
    try {
      await familyService.leaveFamily();
      setFamily(null);
      setMembers([]);
      setStats(null);
      setTransactions([]);
      setTransactionPagination(DEFAULT_PAGINATION);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave family');
      throw err;
    }
  }, [navigate]);

  const removeMember = useCallback(async (userId: string) => {
    setError(null);
    try {
      await familyService.removeMember(userId);
      await loadFamily();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    }
  }, [loadFamily]);

  useEffect(() => {
    if (family) {
      loadStats();
      loadTransactions(0, 20);
    } else {
      setStats(null);
      setTransactions([]);
      setTransactionPagination(DEFAULT_PAGINATION);
    }
  }, [family?.id, loadStats, loadTransactions]);

  const value = useMemo<FamilyContextValue>(
    () => ({
      family,
      members,
      stats,
      transactions,
      transactionPagination,
      loading,
      loadingStats,
      loadingTransactions,
      error,
      loadFamily,
      loadStats,
      loadTransactions,
      createFamily,
      updateFamilyName,
      deleteFamily,
      generateInviteLink,
      joinFamily,
      leaveFamily,
      removeMember,
      setFamilyPage,
      clearError,
    }),
    [
      family,
      members,
      stats,
      transactions,
      transactionPagination,
      loading,
      loadingStats,
      loadingTransactions,
      error,
      loadFamily,
      loadStats,
      loadTransactions,
      createFamily,
      updateFamilyName,
      deleteFamily,
      generateInviteLink,
      joinFamily,
      leaveFamily,
      removeMember,
      setFamilyPage,
      clearError,
    ]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const ctx = React.useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
