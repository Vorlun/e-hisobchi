/**
 * Transfers API — GET/POST with pagination and purposes.
 * Backend updates account balances; frontend reloads accounts and transfers after create.
 */

import { api } from './api';

/** Backend transfer response. toAccountId/toAccountName for internal; toCardNumber for external. */
export interface Transfer {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId?: string;
  toAccountName?: string;
  toCardNumber?: string;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate?: number;
  purpose?: string;
  purposeNameUz?: string;
  description?: string;
  external?: boolean;
  date: string;
}

export interface TransferPurpose {
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
}

export interface GetTransfersParams {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateTransferRequest {
  fromAccountId: string;
  toAccountId?: string;
  toCardNumber?: string;
  amount: number;
  purpose?: string;
  description?: string;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getTransfers(
  params?: GetTransfersParams
): Promise<PaginatedResponse<Transfer>> {
  const search = new URLSearchParams();
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.size !== undefined) search.set('size', String(params.size));
  const q = search.toString();
  const res = await api<PaginatedResponse<Transfer> | { success: boolean; data?: PaginatedResponse<Transfer> }>(
    `/transfers${q ? `?${q}` : ''}`
  );
  checkSuccess(res as { success?: boolean });
  const data = Array.isArray((res as { content?: Transfer[] }).content)
    ? (res as PaginatedResponse<Transfer>)
    : (res as { data?: PaginatedResponse<Transfer> }).data;
  if (!data?.content) throw new Error('Invalid transfers response');
  return data as PaginatedResponse<Transfer>;
}

export async function getTransferById(id: string): Promise<Transfer> {
  const res = await api<Transfer | { success: boolean; data?: Transfer }>(`/transfers/${id}`);
  checkSuccess(res as { success?: boolean });
  const tx = (res as { data?: Transfer }).data ?? (res as Transfer);
  if (!tx?.id) throw new Error('Invalid transfer response');
  return tx;
}

export async function createTransfer(data: CreateTransferRequest): Promise<Transfer> {
  const res = await api<Transfer | { success: boolean; data?: Transfer }>('/transfers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const tx = (res as { data?: Transfer }).data ?? (res as Transfer);
  if (!tx?.id) throw new Error('Invalid create transfer response');
  return tx;
}

export async function getTransferPurposes(): Promise<TransferPurpose[]> {
  const res = await api<TransferPurpose[] | { success: boolean; data?: TransferPurpose[] }>('/transfers/purposes');
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: TransferPurpose[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid transfer purposes response');
  return list;
}
