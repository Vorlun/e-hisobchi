/**
 * Card service — single entry for cards API.
 */

import * as cardsApi from './cards.api';
import type { Card, CreateCardRequest, UpdateCardRequest, LookupCardResponse } from '../types/card.types';

export type { Card, CreateCardRequest, UpdateCardRequest, LookupCardResponse } from '../types/card.types';

export async function fetchCards(): Promise<Card[]> {
  const list = await cardsApi.getCards();
  return list.map((c) => ({
    id: c.id,
    name: c.name,
    cardholderName: c.cardholderName,
    cardNumber: c.cardNumber,
    cardType: c.cardType,
    currency: c.currency,
    balance: c.balance,
    initialBalance: c.initialBalance ?? c.balance,
    color: c.color ?? '#1E40AF',
    archived: c.archived ?? false,
    createdAt: c.createdAt,
  }));
}

export async function fetchCardById(id: string): Promise<Card> {
  const c = await cardsApi.getCardById(id);
  return {
    id: c.id,
    name: c.name,
    cardholderName: c.cardholderName,
    cardNumber: c.cardNumber,
    cardType: c.cardType,
    currency: c.currency,
    balance: c.balance,
    initialBalance: c.initialBalance ?? c.balance,
    color: c.color ?? '#1E40AF',
    archived: c.archived ?? false,
    createdAt: c.createdAt,
  };
}

export async function createCard(data: CreateCardRequest): Promise<Card> {
  const c = await cardsApi.createCard({
    name: data.name,
    cardholderName: data.cardholderName,
    cardNumber: data.cardNumber,
    cardType: data.cardType,
    currency: data.currency,
    initialBalance: data.initialBalance,
    color: data.color,
  });
  return {
    id: c.id,
    name: c.name,
    cardholderName: c.cardholderName,
    cardNumber: c.cardNumber,
    cardType: c.cardType,
    currency: c.currency,
    balance: c.balance,
    initialBalance: c.initialBalance ?? c.balance,
    color: c.color ?? '#1E40AF',
    archived: c.archived ?? false,
    createdAt: c.createdAt,
  };
}

export async function updateCard(id: string, data: UpdateCardRequest): Promise<Card> {
  const c = await cardsApi.updateCard(id, {
    name: data.name,
    cardType: data.cardType,
    color: data.color,
  });
  return {
    id: c.id,
    name: c.name,
    cardholderName: c.cardholderName,
    cardNumber: c.cardNumber,
    cardType: c.cardType,
    currency: c.currency,
    balance: c.balance,
    initialBalance: c.initialBalance ?? c.balance,
    color: c.color ?? '#1E40AF',
    archived: c.archived ?? false,
    createdAt: c.createdAt,
  };
}

export async function archiveCard(id: string): Promise<void> {
  await cardsApi.archiveCard(id);
}

export async function lookupCard(cardNumber: string): Promise<LookupCardResponse> {
  return cardsApi.lookupCard(cardNumber);
}
