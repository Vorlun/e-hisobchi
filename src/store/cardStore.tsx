import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, CreateCardRequest, UpdateCardRequest, LookupCardResponse } from '../types/card.types';
import * as cardService from '../services/card.service';

interface CardState {
  cards: Card[];
  selectedCard: Card | null;
  loading: boolean;
  error: string | null;
}

interface CardContextValue extends CardState {
  fetchCards: () => Promise<void>;
  createCard: (data: CreateCardRequest) => Promise<Card>;
  updateCard: (id: string, data: UpdateCardRequest) => Promise<Card>;
  archiveCard: (id: string) => Promise<void>;
  lookupCard: (cardNumber: string) => Promise<LookupCardResponse | null>;
  setSelectedCard: (card: Card | null) => void;
  clearError: () => void;
}

const CardContext = createContext<CardContextValue | null>(null);

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCardState] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await cardService.fetchCards();
      setCards(list.map((c) => ({ ...c, id: String(c.id) })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const createCard = useCallback(async (data: CreateCardRequest): Promise<Card> => {
    setError(null);
    try {
      const created = await cardService.createCard(data);
      const card = { ...created, id: String(created.id) };
      setCards((prev) => [...prev, card]);
      return card;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create card';
      setError(message);
      throw err;
    }
  }, []);

  const updateCard = useCallback(async (id: string, data: UpdateCardRequest): Promise<Card> => {
    setError(null);
    try {
      const updated = await cardService.updateCard(id, data);
      const card = { ...updated, id: String(updated.id) };
      setCards((prev) => prev.map((c) => (String(c.id) === id ? card : c)));
      if (selectedCard && String(selectedCard.id) === id) setSelectedCardState(card);
      return card;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update card';
      setError(message);
      throw err;
    }
  }, [selectedCard]);

  const archiveCard = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await cardService.archiveCard(id);
      setCards((prev) => prev.filter((c) => String(c.id) !== id));
      if (selectedCard && String(selectedCard.id) === id) setSelectedCardState(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive card';
      setError(message);
      throw err;
    }
  }, [selectedCard]);

  const lookupCard = useCallback(async (cardNumber: string): Promise<LookupCardResponse | null> => {
    try {
      return await cardService.lookupCard(cardNumber);
    } catch {
      return null;
    }
  }, []);

  const setSelectedCard = useCallback((card: Card | null) => {
    setSelectedCardState(card);
  }, []);

  const value = useMemo<CardContextValue>(
    () => ({
      cards,
      selectedCard,
      loading,
      error,
      fetchCards,
      createCard,
      updateCard,
      archiveCard,
      lookupCard,
      setSelectedCard,
      clearError,
    }),
    [cards, selectedCard, loading, error, fetchCards, createCard, updateCard, archiveCard, lookupCard, setSelectedCard, clearError]
  );

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCards(): CardContextValue {
  const ctx = React.useContext(CardContext);
  if (!ctx) throw new Error('useCards must be used within CardProvider');
  return ctx;
}
