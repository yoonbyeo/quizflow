export interface Card {
  id: string;
  term: string;
  definition: string;
  hint?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CardSet {
  id: string;
  title: string;
  description?: string;
  category?: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
  studyStats: StudyStats;
}

export interface StudyStats {
  totalStudySessions: number;
  lastStudied?: number;
  cardStats: Record<string, CardStat>;
}

export interface CardStat {
  cardId: string;
  correct: number;
  incorrect: number;
  lastReviewed?: number;
  streak: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'unrated';
}

export type StudyMode = 'flashcard' | 'test' | 'match' | 'write';

export interface TestQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'written';
  cardId: string;
  question: string;
  correctAnswer: string;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface TestSession {
  id: string;
  setId: string;
  questions: TestQuestion[];
  startedAt: number;
  completedAt?: number;
  score?: number;
  totalQuestions: number;
}

export interface MatchItem {
  id: string;
  text: string;
  type: 'term' | 'definition';
  cardId: string;
  isMatched: boolean;
  isSelected: boolean;
}

export type SortOrder = 'created' | 'updated' | 'alphabetical' | 'size';
