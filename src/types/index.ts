export interface Card {
  id: string;
  term: string;
  definition: string;
  hint?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CardSet {
  id: string;
  title: string;
  description?: string;
  category?: string;
  folderId?: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
  studyStats: StudyStats;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
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
  nextReview?: number; // 다음 복습 예정일 (timestamp)
  interval?: number;   // 현재 복습 간격 (일)
  streak: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'unrated';
}

export type StudyMode = 'flashcard' | 'test' | 'match' | 'write' | 'learn';

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

export interface TestConfig {
  questionCount: number;
  answerWith: 'definition' | 'term' | 'both';
  includeMultipleChoice: boolean;
  includeWritten: boolean;
  includeTrueFalse: boolean;
}
