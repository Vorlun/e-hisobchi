/**
 * Bank cards API — GET/POST/PUT/PATCH, archive, lookup.
 */

import { api } from './api';

export interface BankCard {
  id: string;
  name: string;
  cardholderName: string;
  cardNumber: string;
  cardType: string;
  currency: string;
  balance: number;
  initialBalance: number;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface CreateCardRequest {
  name?: string;
  cardholderName: string;
  cardNumber: string;
  cardType: string;
  currency: string;
  initialBalance?: number;
  color?: string;
}

export interface UpdateCardRequest {
  name?: string;
  cardholderName?: string;
  cardNumber?: string;
  cardType?: string;
  color?: string;
}

export interface LookupCardRequest {
  cardNumber: string;
}

export interface LookupCardResponse {
  cardNumber: string;
  cardType: string;
  cardholderName: string;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getCards(): Promise<BankCard[]> {
  const res = await api<BankCard[] | { success: boolean; data?: BankCard[] }>('/cards');
  const list = Array.isArray(res) ? res : (res as { data?: BankCard[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid cards response');
  return list;
}

export async function getCardById(id: string): Promise<BankCard> {
  const res = await api<BankCard | { success: boolean; data?: BankCard }>(`/cards/${id}`);
  const card = res && typeof res === 'object' && !Array.isArray(res) && 'id' in res
    ? (res as BankCard)
    : (res as { data?: BankCard }).data;
  if (!card?.id) throw new Error('Invalid card response');
  return card;
}

export async function createCard(data: CreateCardRequest): Promise<BankCard> {
  const res = await api<BankCard | { success: boolean; data?: BankCard }>('/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const card = (res as { data?: BankCard }).data ?? (res as BankCard);
  if (!card?.id) throw new Error('Invalid create card response');
  return card;
}

export async function updateCard(id: string, data: UpdateCardRequest): Promise<BankCard> {
  const res = await api<BankCard | { success: boolean; data?: BankCard }>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const card = (res as { data?: BankCard }).data ?? (res as BankCard);
  if (!card?.id) throw new Error('Invalid update card response');
  return card;
}

export async function archiveCard(id: string): Promise<void> {
  const res = await api<unknown>(`/cards/${id}/archive`, { method: 'PATCH' });
  checkSuccess(res as { success?: boolean });
}

export async function lookupCard(cardNumber: string): Promise<LookupCardResponse> {
  const res = await api<LookupCardResponse | { success: boolean; data?: LookupCardResponse }>('/cards/lookup', {
    method: 'POST',
    body: JSON.stringify({ cardNumber }),
  });
  checkSuccess(res as { success?: boolean });
  const data = (res as { data?: LookupCardResponse }).data ?? res;
  if (!data?.cardNumber) throw new Error('Invalid lookup response');
  return data as LookupCardResponse;
}
