/**
 * Card (bank card) API types.
 */

export type CardTypeApi = 'VISA' | 'MASTERCARD' | 'HUMO' | 'UZCARD' | string;

export interface Card {
  id: string | number;
  name: string;
  cardholderName: string;
  cardNumber: string;
  cardType: CardTypeApi;
  currency: string;
  balance: number;
  initialBalance: number;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface CreateCardRequest {
  name?: string;
  cardNumber: string;
  cardholderName: string;
  cardType: CardTypeApi;
  currency: string;
  initialBalance?: number;
  color?: string;
}

export interface UpdateCardRequest {
  name?: string;
  cardType?: CardTypeApi;
  color?: string;
}

export interface LookupCardResponse {
  cardNumber: string;
  cardType: string;
  cardholderName: string;
}
