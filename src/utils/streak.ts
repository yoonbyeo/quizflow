// ── 학습 활동 기록 유틸리티 ──
// Supabase 기반으로 스트릭·캘린더 데이터를 저장합니다.
// userId가 없으면 localStorage fallback을 사용합니다.

import { recordActivity as sbRecordActivity } from '../hooks/useStudySync';

const KEY_STREAK_COUNT = 'qf-streak-count';
const KEY_STREAK_LAST = 'qf-streak-lastdate';
const KEY_CALENDAR_PREFIX = 'qf-cal-';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 카드 평가 1회마다 호출. Supabase에 기록하고 localStorage도 함께 업데이트 */
export async function recordStudyActivity(userId?: string): Promise<void> {
  // localStorage도 항상 업데이트 (오프라인/빠른 읽기용)
  try {
    const today = todayStr();
    const lastDate = localStorage.getItem(KEY_STREAK_LAST) ?? '';
    const count = parseInt(localStorage.getItem(KEY_STREAK_COUNT) ?? '0', 10);
    if (lastDate !== today) {
      const newCount = lastDate === yesterdayStr() ? count + 1 : 1;
      localStorage.setItem(KEY_STREAK_COUNT, String(newCount));
      localStorage.setItem(KEY_STREAK_LAST, today);
    }
    const calKey = KEY_CALENDAR_PREFIX + today;
    const prev = parseInt(localStorage.getItem(calKey) ?? '0', 10);
    localStorage.setItem(calKey, String(prev + 1));
  } catch {}

  // Supabase에 비동기 기록 (실패해도 무시)
  if (userId) {
    sbRecordActivity(userId).catch(() => {});
  }
}

/** 현재 스트릭 (연속 학습일 수) — localStorage 기반 빠른 읽기 */
export function loadStreak(): number {
  try {
    const lastDate = localStorage.getItem(KEY_STREAK_LAST) ?? '';
    const count = parseInt(localStorage.getItem(KEY_STREAK_COUNT) ?? '0', 10);
    const today = todayStr();
    if (lastDate === today || lastDate === yesterdayStr()) return count;
    return 0;
  } catch { return 0; }
}

/** 최근 N일 캘린더 데이터 반환 — localStorage 기반 빠른 읽기 */
export function loadCalendar(days = 84): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = parseInt(localStorage.getItem(KEY_CALENDAR_PREFIX + dateStr) ?? '0', 10);
    result.push({ date: dateStr, count });
  }
  return result;
}
