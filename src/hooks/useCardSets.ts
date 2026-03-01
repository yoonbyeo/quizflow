import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { recordStudyActivity } from '../utils/streak';
import type { CardSet, Card, CardStat, Folder } from '../types';

function generateId() {
  return crypto.randomUUID();
}

function dbSetToCardSet(dbSet: any, dbCards: any[], dbStats: any[]): CardSet {
  const cards: Card[] = dbCards
    .filter((c) => c.set_id === dbSet.id)
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      hint: c.hint ?? undefined,
      imageUrl: c.image_url ?? undefined,
      createdAt: new Date(c.created_at).getTime(),
      updatedAt: new Date(c.created_at).getTime(),
    }));

  const cardStatMap: Record<string, CardStat> = {};
  for (const stat of dbStats) {
    const card = dbCards.find((c) => c.id === stat.card_id);
    if (card && card.set_id === dbSet.id) {
      cardStatMap[stat.card_id] = {
        cardId: stat.card_id,
        correct: stat.correct,
        incorrect: stat.incorrect,
        nextReview: stat.next_review ? new Date(stat.next_review).getTime() : undefined,
        interval: stat.interval ?? undefined,
        streak: stat.streak,
        difficulty: stat.difficulty,
        lastReviewed: stat.last_reviewed ? new Date(stat.last_reviewed).getTime() : undefined,
      };
    }
  }

  const lastStudied = Object.values(cardStatMap)
    .filter((s) => s.lastReviewed)
    .sort((a, b) => (b.lastReviewed ?? 0) - (a.lastReviewed ?? 0))[0]?.lastReviewed;

  return {
    id: dbSet.id,
    title: dbSet.title,
    description: dbSet.description ?? undefined,
    category: dbSet.category ?? undefined,
    folderId: dbSet.folder_id ?? undefined,
    cards,
    createdAt: new Date(dbSet.created_at).getTime(),
    updatedAt: new Date(dbSet.updated_at).getTime(),
    studyStats: {
      totalStudySessions: Object.values(cardStatMap).reduce((s, c) => s + c.correct + c.incorrect, 0),
      lastStudied,
      cardStats: cardStatMap,
    },
  };
}

export function useCardSets(userId: string | undefined) {
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) { setCardSets([]); setFolders([]); setLoading(false); return; }
    setLoading(true);

    const [setsRes, cardsRes, statsRes, foldersRes] = await Promise.all([
      supabase.from('card_sets').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('cards').select('*'),
      supabase.from('card_stats').select('*').eq('user_id', userId),
      supabase.from('folders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    const sets = setsRes.data ?? [];
    const cards = cardsRes.data ?? [];
    const stats = statsRes.data ?? [];
    const foldersData = foldersRes.data ?? [];

    setCardSets(sets.map((s) => dbSetToCardSet(s, cards, stats)));
    setFolders(foldersData.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description ?? undefined,
      color: f.color ?? '#388bfd',
      createdAt: new Date(f.created_at).getTime(),
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Card Sets ──
  const createCardSet = useCallback(async (
    title: string,
    description?: string,
    category?: string,
    initialCards?: { term: string; definition: string; hint?: string }[],
    folderId?: string
  ): Promise<CardSet | null> => {
    if (!userId) return null;
    const { data: newSet, error } = await supabase
      .from('card_sets')
      .insert({ user_id: userId, title, description, category, folder_id: folderId ?? null })
      .select()
      .single();
    if (error || !newSet) return null;

    if (initialCards && initialCards.length > 0) {
      await supabase.from('cards').insert(
        initialCards.map((c, i) => ({
          set_id: newSet.id,
          term: c.term,
          definition: c.definition,
          hint: c.hint,
          position: i,
        }))
      );
    }

    await fetchAll();
    return { id: newSet.id } as CardSet;
  }, [userId, fetchAll]);

  const updateCardSet = useCallback(async (
    id: string,
    updates: { title?: string; description?: string; category?: string; folderId?: string | null }
  ) => {
    const dbUpdates: any = { ...updates };
    if ('folderId' in updates) {
      dbUpdates.folder_id = updates.folderId;
      delete dbUpdates.folderId;
    }
    await supabase.from('card_sets').update(dbUpdates).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteCardSet = useCallback(async (id: string) => {
    await supabase.from('card_sets').delete().eq('id', id);
    setCardSets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicateCardSet = useCallback(async (id: string) => {
    if (!userId) return;
    const original = cardSets.find((s) => s.id === id);
    if (!original) return;
    const { data: newSet } = await supabase
      .from('card_sets')
      .insert({ user_id: userId, title: `${original.title} (복사본)`, description: original.description, category: original.category })
      .select().single();
    if (!newSet) return;
    if (original.cards.length > 0) {
      await supabase.from('cards').insert(
        original.cards.map((c: Card, i: number) => ({ set_id: newSet.id, term: c.term, definition: c.definition, hint: c.hint, position: i }))
      );
    }
    await fetchAll();
  }, [userId, cardSets, fetchAll]);

  // ── Cards ──
  const addCard = useCallback(async (setId: string, term: string, definition: string, hint?: string) => {
    const set = cardSets.find((s) => s.id === setId);
    const position = set?.cards.length ?? 0;
    await supabase.from('cards').insert({ set_id: setId, term, definition, hint, position });
    await fetchAll();
  }, [cardSets, fetchAll]);

  const updateCard = useCallback(async (
    setId: string,
    cardId: string,
    updates: { term?: string; definition?: string; hint?: string; imageUrl?: string }
  ) => {
    const dbUpdates: any = { ...updates };
    if ('imageUrl' in updates) {
      dbUpdates.image_url = updates.imageUrl;
      delete dbUpdates.imageUrl;
    }
    await supabase.from('cards').update(dbUpdates).eq('id', cardId);
    await supabase.from('card_sets').update({ updated_at: new Date().toISOString() }).eq('id', setId);
    await fetchAll();
  }, [fetchAll]);

  const deleteCard = useCallback(async (_setId: string, cardId: string) => {
    await supabase.from('cards').delete().eq('id', cardId);
    await fetchAll();
  }, [fetchAll]);

  const uploadCardImage = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${generateId()}.${ext}`;
    const { error } = await supabase.storage.from('card-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      console.error('[uploadCardImage] error:', error);
      return null;
    }
    const { data } = supabase.storage.from('card-images').getPublicUrl(path);
    return data.publicUrl;
  }, [userId]);

  const saveCardsForSet = useCallback(async (
    setId: string,
    cards: { id?: string; term: string; definition: string; hint?: string; imageUrl?: string; isNew?: boolean }[]
  ) => {
    const existing = cardSets.find((s) => s.id === setId)?.cards ?? [];
    const existingIds = new Set(existing.map((c) => c.id));

    const toInsert = cards
      .filter((c) => c.isNew || !c.id || !existingIds.has(c.id))
      .filter((c) => c.term.trim() && c.definition.trim())
      .map((c, i) => ({ set_id: setId, term: c.term, definition: c.definition, hint: c.hint, image_url: c.imageUrl ?? null, position: i }));

    const toUpdate = cards
      .filter((c) => c.id && existingIds.has(c.id) && !c.isNew)
      .filter((c) => c.term.trim() && c.definition.trim());

    if (toInsert.length > 0) await supabase.from('cards').insert(toInsert);
    for (const card of toUpdate) {
      await supabase.from('cards').update({ term: card.term, definition: card.definition, hint: card.hint, image_url: card.imageUrl ?? null }).eq('id', card.id!);
    }

    const updatedIds = new Set(toUpdate.map((c) => c.id));
    const insertedTerms = new Set(toInsert.map((c) => c.term));
    const toDelete = existing.filter((c) => !updatedIds.has(c.id) && !insertedTerms.has(c.term));
    if (toDelete.length > 0) {
      await supabase.from('cards').delete().in('id', toDelete.map((c) => c.id));
    }

    await supabase.from('card_sets').update({ updated_at: new Date().toISOString() }).eq('id', setId);
    await fetchAll();
  }, [cardSets, fetchAll]);

  // ── Stats ──
  const upsertCardStat = useCallback(async (cardId: string, isCorrect: boolean) => {
    if (!userId) return;
    recordStudyActivity(); // 스트릭 + 캘린더 기록
    const existing = await supabase
      .from('card_stats').select('*').eq('user_id', userId).eq('card_id', cardId).single();

    const prev = existing.data;
    const newStreak = isCorrect ? (prev?.streak ?? 0) + 1 : 0;
    const newCorrect = (prev?.correct ?? 0) + (isCorrect ? 1 : 0);
    const newIncorrect = (prev?.incorrect ?? 0) + (isCorrect ? 0 : 1);
    const difficulty = newStreak >= 5 ? 'easy' : newStreak >= 2 ? 'medium' : newIncorrect > newCorrect ? 'hard' : 'unrated';

    // SM-2 간략화: 정답이면 인터벌 증가, 오답이면 1일로 리셋
    const INTERVALS = [1, 3, 7, 14, 30, 60];
    const prevInterval = prev?.interval ?? 0;
    const prevIntervalIdx = INTERVALS.indexOf(prevInterval);
    let newInterval: number;
    if (isCorrect) {
      const nextIdx = Math.min(prevIntervalIdx + 1, INTERVALS.length - 1);
      newInterval = prevIntervalIdx < 0 ? INTERVALS[0] : INTERVALS[nextIdx];
    } else {
      newInterval = 1;
    }
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    const nextReviewTimestamp = nextReviewDate.getTime();

    await supabase.from('card_stats').upsert({
      id: prev?.id ?? generateId(),
      user_id: userId,
      card_id: cardId,
      correct: newCorrect,
      incorrect: newIncorrect,
      streak: newStreak,
      difficulty,
      last_reviewed: new Date().toISOString(),
      next_review: nextReviewDate.toISOString(),
      interval: newInterval,
    }, { onConflict: 'user_id,card_id' });

    setCardSets((prev) => prev.map((set) => {
      const card = set.cards.find((c) => c.id === cardId);
      if (!card) return set;
      return {
        ...set,
        studyStats: {
          ...set.studyStats,
          lastStudied: Date.now(),
          cardStats: {
            ...set.studyStats.cardStats,
            [cardId]: {
              cardId,
              correct: newCorrect,
              incorrect: newIncorrect,
              streak: newStreak,
              difficulty: difficulty as CardStat['difficulty'],
              lastReviewed: Date.now(),
              nextReview: nextReviewTimestamp,
              interval: newInterval,
            },
          },
        },
      };
    }));
  }, [userId]);

  const resetStats = useCallback(async (setId: string) => {
    const set = cardSets.find((s) => s.id === setId);
    if (!set || !userId) return;
    await supabase.from('card_stats').delete().eq('user_id', userId).in('card_id', set.cards.map((c) => c.id));
    await fetchAll();
  }, [cardSets, userId, fetchAll]);

  // ── Folders ──
  const createFolder = useCallback(async (name: string, description?: string, color?: string): Promise<Folder | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name, description, color: color ?? '#388bfd' })
      .select().single();
    if (error || !data) return null;
    await fetchAll();
    return { id: data.id, name: data.name, description: data.description, color: data.color, createdAt: new Date(data.created_at).getTime() };
  }, [userId, fetchAll]);

  const updateFolder = useCallback(async (id: string, updates: { name?: string; description?: string; color?: string }) => {
    await supabase.from('folders').update(updates).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  const deleteFolder = useCallback(async (id: string) => {
    await supabase.from('card_sets').update({ folder_id: null }).eq('folder_id', id);
    await supabase.from('folders').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  return {
    cardSets, folders, loading, fetchAll,
    createCardSet, updateCardSet, deleteCardSet, duplicateCardSet,
    addCard, updateCard, deleteCard, uploadCardImage, saveCardsForSet,
    upsertCardStat, resetStats,
    createFolder, updateFolder, deleteFolder,
  };
}
