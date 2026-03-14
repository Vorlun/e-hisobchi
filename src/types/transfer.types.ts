/**
 * Transfer domain and API types.
 */

export interface TransferApi {
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
  dateTime?: string;
}

export interface TransferPurpose {
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
}

export interface TransferPagination {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last?: boolean;
}

export interface CreateTransferRequest {
  fromAccountId: string;
  toAccountId?: string;
  toCardNumber?: string;
  amount: number;
  purpose?: string;
  description?: string;
}

export interface PaginatedTransfers {
  content: TransferApi[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}
