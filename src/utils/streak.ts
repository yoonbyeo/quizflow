// ── 학습 스트릭 & 캘린더 유틸리티 ──

const KEY_STREAK_COUNT = 'qf-streak-count';
const KEY_STREAK_LAST = 'qf-streak-lastdate';
const KEY_CALENDAR_PREFIX = 'qf-cal-'; // qf-cal-YYYY-MM-DD → count

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 카드 평가 1회마다 호출. 스트릭 업데이트 + 캘린더 기록 */
export function recordStudyActivity() {
  try {
    const today = todayStr();
    const lastDate = localStorage.getItem(KEY_STREAK_LAST) ?? '';
    const count = parseInt(localStorage.getItem(KEY_STREAK_COUNT) ?? '0', 10);

    if (lastDate !== today) {
      // 오늘 첫 학습
      const newCount = lastDate === yesterdayStr() ? count + 1 : 1;
      localStorage.setItem(KEY_STREAK_COUNT, String(newCount));
      localStorage.setItem(KEY_STREAK_LAST, today);
    }

    // 캘린더: 오늘 학습 횟수 +1
    const calKey = KEY_CALENDAR_PREFIX + today;
    const prev = parseInt(localStorage.getItem(calKey) ?? '0', 10);
    localStorage.setItem(calKey, String(prev + 1));
  } catch {}
}

/** 현재 스트릭 (연속 학습일 수) */
export function loadStreak(): number {
  try {
    const lastDate = localStorage.getItem(KEY_STREAK_LAST) ?? '';
    const count = parseInt(localStorage.getItem(KEY_STREAK_COUNT) ?? '0', 10);
    const today = todayStr();
    // 오늘 or 어제 학습했으면 유효한 스트릭
    if (lastDate === today || lastDate === yesterdayStr()) return count;
    return 0;
  } catch { return 0; }
}

/** 최근 N일 캘린더 데이터 반환 (날짜 오름차순) */
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
