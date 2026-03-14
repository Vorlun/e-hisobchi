/**
 * Transfer service — single entry for transfer API.
 */

import * as transfersApi from './transfers.api';
import type {
  TransferPagination,
  CreateTransferRequest,
  PaginatedTransfers,
  TransferApi,
  TransferPurpose,
} from '../types/transfer.types';

export type { TransferPagination, CreateTransferRequest, TransferPurpose } from '../types/transfer.types';

export async function fetchTransfers(params?: {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}): Promise<{ content: TransferApi[]; pagination: TransferPagination }> {
  const res = await transfersApi.getTransfers({
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  });
  return {
    content: res.content as TransferApi[],
    pagination: {
      page: res.page,
      size: res.size,
      totalPages: res.totalPages,
      totalElements: res.totalElements,
      last: res.last,
    },
  };
}

export async function fetchTransferById(id: string): Promise<TransferApi> {
  const tx = await transfersApi.getTransferById(id);
  return tx as TransferApi;
}

export async function createTransfer(data: CreateTransferRequest): Promise<TransferApi> {
  const tx = await transfersApi.createTransfer({
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    toCardNumber: data.toCardNumber,
    amount: data.amount,
    purpose: data.purpose,
    description: data.description,
  });
  return tx as TransferApi;
}

export async function fetchTransferPurposes(): Promise<TransferPurpose[]> {
  return transfersApi.getTransferPurposes();
}
