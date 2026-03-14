import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminActivity, AdminGrowthPoint, AdminStats } from '../types/admin.types';
import * as adminDashboardService from '../services/adminDashboard.service';

interface AdminDashboardState {
  activity: AdminActivity | null;
  growth: AdminGrowthPoint[];
  stats: AdminStats | null;
  loading: boolean;
  loadingActivity: boolean;
  loadingGrowth: boolean;
  loadingStats: boolean;
  error: string | null;
}

interface AdminDashboardContextValue extends AdminDashboardState {
  fetchActivity: () => Promise<void>;
  fetchGrowth: () => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

const AdminDashboardContext = createContext<AdminDashboardContextValue | null>(null);

export function AdminDashboardProvider({ children }: { children: React.ReactNode }) {
  const [activity, setActivity] = useState<AdminActivity | null>(null);
  const [growth, setGrowth] = useState<AdminGrowthPoint[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingActivity || loadingGrowth || loadingStats;

  const clearError = useCallback(() => setError(null), []);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    setError(null);
    try {
      const data = await adminDashboardService.fetchActivity();
      setActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
      setActivity(null);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  const fetchGrowth = useCallback(async () => {
    setLoadingGrowth(true);
    setError(null);
    try {
      const data = await adminDashboardService.fetchGrowth();
      setGrowth(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load growth');
      setGrowth([]);
    } finally {
      setLoadingGrowth(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await adminDashboardService.fetchStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    fetchGrowth();
  }, [fetchGrowth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const value = useMemo<AdminDashboardContextValue>(
    () => ({
      activity,
      growth,
      stats,
      loading,
      loadingActivity,
      loadingGrowth,
      loadingStats,
      error,
      fetchActivity,
      fetchGrowth,
      fetchStats,
      clearError,
    }),
    [
      activity,
      growth,
      stats,
      loading,
      loadingActivity,
      loadingGrowth,
      loadingStats,
      error,
      fetchActivity,
      fetchGrowth,
      fetchStats,
      clearError,
    ]
  );

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard(): AdminDashboardContextValue {
  const ctx = React.useContext(AdminDashboardContext);
  if (!ctx) throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  return ctx;
}
