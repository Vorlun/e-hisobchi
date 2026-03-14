import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { TransferPagination, TransferPurpose, CreateTransferRequest } from '../types/transfer.types';
import type { TransferApi } from '../types/transfer.types';
import * as transferService from '../services/transfer.service';

interface TransferState {
  transfers: TransferApi[];
  transferPagination: TransferPagination;
  transferPurposes: TransferPurpose[];
  loading: boolean;
  loadingPurposes: boolean;
  error: string | null;
}

interface TransferContextValue extends TransferState {
  fetchTransfers: () => Promise<void>;
  setTransferPage: (page: number) => void;
  createTransfer: (data: CreateTransferRequest) => Promise<TransferApi>;
  fetchTransferById: (id: string) => Promise<TransferApi>;
  fetchTransferPurposes: () => Promise<void>;
  clearError: () => void;
}

const defaultPagination: TransferPagination = {
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
};

const TransferContext = createContext<TransferContextValue | null>(null);

export function TransferProvider({ children }: { children: React.ReactNode }) {
  const [transfers, setTransfers] = useState<TransferApi[]>([]);
  const [transferPagination, setTransferPagination] = useState<TransferPagination>(defaultPagination);
  const [transferPurposes, setTransferPurposes] = useState<TransferPurpose[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPurposes, setLoadingPurposes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { content, pagination } = await transferService.fetchTransfers({
        page: transferPagination.page,
        size: transferPagination.size,
      });
      setTransfers(content);
      setTransferPagination(pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transfers');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [transferPagination.page, transferPagination.size]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const fetchTransferPurposes = useCallback(async () => {
    setLoadingPurposes(true);
    try {
      const list = await transferService.fetchTransferPurposes();
      setTransferPurposes(list);
    } catch {
      setTransferPurposes([]);
    } finally {
      setLoadingPurposes(false);
    }
  }, []);

  useEffect(() => {
    fetchTransferPurposes();
  }, [fetchTransferPurposes]);

  const setTransferPage = useCallback((page: number) => {
    setTransferPagination((prev) => ({ ...prev, page }));
  }, []);

  const createTransfer = useCallback(async (data: CreateTransferRequest): Promise<TransferApi> => {
    setError(null);
    try {
      const created = await transferService.createTransfer(data);
      setTransfers((prev) => [created, ...prev]);
      setTransferPagination((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(message);
      throw err;
    }
  }, []);

  const fetchTransferById = useCallback(async (id: string): Promise<TransferApi> => {
    return transferService.fetchTransferById(id);
  }, []);

  const value = useMemo<TransferContextValue>(
    () => ({
      transfers,
      transferPagination,
      transferPurposes,
      loading,
      loadingPurposes,
      error,
      fetchTransfers,
      setTransferPage,
      createTransfer,
      fetchTransferById,
      fetchTransferPurposes,
      clearError,
    }),
    [
      transfers,
      transferPagination,
      transferPurposes,
      loading,
      loadingPurposes,
      error,
      fetchTransfers,
      setTransferPage,
      createTransfer,
      fetchTransferById,
      fetchTransferPurposes,
      clearError,
    ]
  );

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
}

export function useTransfers(): TransferContextValue {
  const ctx = React.useContext(TransferContext);
  if (!ctx) throw new Error('useTransfers must be used within TransferProvider');
  return ctx;
}
