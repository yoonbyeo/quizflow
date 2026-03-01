import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Card, TestQuestion } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return '방금 전';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < week) return `${Math.floor(diff / day)}일 전`;

  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(timestamp));
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMultipleChoiceQuestion(
  card: Card,
  allCards: Card[],
  questionType: 'term' | 'definition' = 'definition'
): TestQuestion {
  const isDefinition = questionType === 'definition';
  const question = isDefinition ? `"${card.term}"의 뜻은?` : `다음 뜻에 해당하는 단어는?\n"${card.definition}"`;
  const correctAnswer = isDefinition ? card.definition : card.term;
  const wrongCards = shuffleArray(allCards.filter((c) => c.id !== card.id)).slice(0, 3);
  const wrongAnswers = wrongCards.map((c) => (isDefinition ? c.definition : c.term));
  const options = shuffleArray([correctAnswer, ...wrongAnswers]);
  return {
    id: Math.random().toString(36).slice(2),
    type: 'multiple-choice',
    cardId: card.id,
    question,
    correctAnswer,
    options,
  };
}

export function generateWrittenQuestion(card: Card, questionType: 'term' | 'definition' = 'definition'): TestQuestion {
  const isDefinition = questionType === 'definition';
  const question = isDefinition
    ? `"${card.term}"의 뜻을 입력하세요`
    : `다음 뜻에 해당하는 단어를 입력하세요:\n"${card.definition}"`;
  const correctAnswer = isDefinition ? card.definition : card.term;
  return {
    id: Math.random().toString(36).slice(2),
    type: 'written',
    cardId: card.id,
    question,
    correctAnswer,
  };
}

export function checkWrittenAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:'"()]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}
