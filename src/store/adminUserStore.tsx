import React, { createContext, useCallback, useMemo, useState } from 'react';
import type {
  AdminUser,
  AdminUsersFilters,
  PaginatedAdminUsers,
  BlockUserRequest,
} from '../types/adminUser.types';
import * as adminUserService from '../services/adminUser.service';

const DEFAULT_PAGE_SIZE = 20;

interface AdminUserState {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
}

interface AdminUserContextValue extends AdminUserState {
  fetchUsers: (filters?: AdminUsersFilters) => Promise<void>;
  fetchUserDetail: (id: string) => Promise<AdminUser | null>;
  deleteUser: (id: string) => Promise<void>;
  blockUser: (id: string, body?: BlockUserRequest) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  setSelectedUser: (user: AdminUser | null) => void;
  clearError: () => void;
}

const AdminUserContext = createContext<AdminUserContextValue | null>(null);

const initialPagination = {
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUserState] = useState<AdminUser | null>(null);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchUsers = useCallback(async (filters?: AdminUsersFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminUserService.fetchUsers({
        ...filters,
        page: filters?.page ?? 0,
        size: filters?.size ?? DEFAULT_PAGE_SIZE,
      });
      setUsers(result.content);
      setPagination({
        page: result.page,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
        last: result.last,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
      setPagination(initialPagination);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserDetail = useCallback(async (id: string): Promise<AdminUser | null> => {
    setLoadingDetail(true);
    setError(null);
    try {
      const user = await adminUserService.fetchUserDetail(id);
      if (user) setSelectedUserState(user);
      return user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user detail');
      setSelectedUserState(null);
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    setError(null);
    try {
      await adminUserService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => String(u.id) !== id));
      if (selectedUser && String(selectedUser.id) === id) setSelectedUserState(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      throw err;
    }
  }, [selectedUser]);

  const blockUser = useCallback(
    async (id: string, body?: BlockUserRequest) => {
      setError(null);
      try {
        await adminUserService.blockUser(id, body);
        setUsers((prev) =>
          prev.map((u) => (String(u.id) === id ? { ...u, enabled: false, accountNonLocked: false } : u))
        );
        if (selectedUser && String(selectedUser.id) === id) {
          setSelectedUserState((u) => (u ? { ...u, enabled: false, accountNonLocked: false } : null));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to block user';
        setError(message);
        throw err;
      }
    },
    [selectedUser]
  );

  const unblockUser = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await adminUserService.unblockUser(id);
        setUsers((prev) =>
          prev.map((u) => (String(u.id) === id ? { ...u, enabled: true, accountNonLocked: true } : u))
        );
        if (selectedUser && String(selectedUser.id) === id) {
          setSelectedUserState((u) => (u ? { ...u, enabled: true, accountNonLocked: true } : null));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unblock user';
        setError(message);
        throw err;
      }
    },
    [selectedUser]
  );

  const setSelectedUser = useCallback((user: AdminUser | null) => {
    setSelectedUserState(user);
  }, []);

  const value = useMemo<AdminUserContextValue>(
    () => ({
      users,
      selectedUser,
      pagination,
      loading,
      loadingDetail,
      error,
      fetchUsers,
      fetchUserDetail,
      deleteUser,
      blockUser,
      unblockUser,
      setSelectedUser,
      clearError,
    }),
    [
      users,
      selectedUser,
      pagination,
      loading,
      loadingDetail,
      error,
      fetchUsers,
      fetchUserDetail,
      deleteUser,
      blockUser,
      unblockUser,
      setSelectedUser,
      clearError,
    ]
  );

  return (
    <AdminUserContext.Provider value={value}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUsers(): AdminUserContextValue {
  const ctx = React.useContext(AdminUserContext);
  if (!ctx) throw new Error('useAdminUsers must be used within AdminUserProvider');
  return ctx;
}
