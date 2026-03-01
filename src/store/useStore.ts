import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardSet, Card, StudyStats, CardStat } from '../types';

interface AppState {
  cardSets: CardSet[];
  activeSetId: string | null;

  // Card set actions
  createCardSet: (title: string, description?: string, category?: string) => CardSet;
  updateCardSet: (id: string, updates: Partial<Pick<CardSet, 'title' | 'description' | 'category'>>) => void;
  deleteCardSet: (id: string) => void;
  duplicateCardSet: (id: string) => void;

  // Card actions
  addCard: (setId: string, term: string, definition: string, hint?: string) => void;
  updateCard: (setId: string, cardId: string, updates: Partial<Pick<Card, 'term' | 'definition' | 'hint'>>) => void;
  deleteCard: (setId: string, cardId: string) => void;
  reorderCards: (setId: string, cards: Card[]) => void;

  // Study stats
  updateCardStat: (setId: string, cardId: string, isCorrect: boolean) => void;
  resetStats: (setId: string) => void;

  // UI state
  setActiveSet: (id: string | null) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 11) + Date.now().toString(36);

const defaultStats = (): StudyStats => ({
  totalStudySessions: 0,
  cardStats: {},
});

const defaultCardStat = (cardId: string): CardStat => ({
  cardId,
  correct: 0,
  incorrect: 0,
  streak: 0,
  difficulty: 'unrated',
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cardSets: [],
      activeSetId: null,

      createCardSet: (title, description, category) => {
        const newSet: CardSet = {
          id: generateId(),
          title,
          description,
          category,
          cards: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          studyStats: defaultStats(),
        };
        set((state) => ({ cardSets: [newSet, ...state.cardSets] }));
        return newSet;
      },

      updateCardSet: (id, updates) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },

      deleteCardSet: (id) => {
        set((state) => ({
          cardSets: state.cardSets.filter((s) => s.id !== id),
          activeSetId: state.activeSetId === id ? null : state.activeSetId,
        }));
      },

      duplicateCardSet: (id) => {
        const { cardSets } = get();
        const original = cardSets.find((s) => s.id === id);
        if (!original) return;
        const newSet: CardSet = {
          ...original,
          id: generateId(),
          title: `${original.title} (복사본)`,
          cards: original.cards.map((c) => ({ ...c, id: generateId() })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          studyStats: defaultStats(),
        };
        set((state) => ({ cardSets: [newSet, ...state.cardSets] }));
      },

      addCard: (setId, term, definition, hint) => {
        const newCard: Card = {
          id: generateId(),
          term,
          definition,
          hint,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === setId
              ? { ...s, cards: [...s.cards, newCard], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      updateCard: (setId, cardId, updates) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === setId
              ? {
                  ...s,
                  cards: s.cards.map((c) =>
                    c.id === cardId ? { ...c, ...updates, updatedAt: Date.now() } : c
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      deleteCard: (setId, cardId) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === setId
              ? {
                  ...s,
                  cards: s.cards.filter((c) => c.id !== cardId),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      reorderCards: (setId, cards) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === setId ? { ...s, cards, updatedAt: Date.now() } : s
          ),
        }));
      },

      updateCardStat: (setId, cardId, isCorrect) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) => {
            if (s.id !== setId) return s;
            const existing = s.studyStats.cardStats[cardId] || defaultCardStat(cardId);
            const updated: CardStat = {
              ...existing,
              correct: isCorrect ? existing.correct + 1 : existing.correct,
              incorrect: isCorrect ? existing.incorrect : existing.incorrect + 1,
              streak: isCorrect ? existing.streak + 1 : 0,
              lastReviewed: Date.now(),
              difficulty:
                existing.streak >= 5 ? 'easy' :
                existing.streak >= 2 ? 'medium' :
                existing.incorrect > existing.correct ? 'hard' : 'unrated',
            };
            return {
              ...s,
              studyStats: {
                ...s.studyStats,
                totalStudySessions: s.studyStats.totalStudySessions + 1,
                lastStudied: Date.now(),
                cardStats: { ...s.studyStats.cardStats, [cardId]: updated },
              },
            };
          }),
        }));
      },

      resetStats: (setId) => {
        set((state) => ({
          cardSets: state.cardSets.map((s) =>
            s.id === setId ? { ...s, studyStats: defaultStats() } : s
          ),
        }));
      },

      setActiveSet: (id) => set({ activeSetId: id }),
    }),
    {
      name: 'quizflow-storage',
    }
  )
);
