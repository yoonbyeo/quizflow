// ── 클라우드 학습 세션 동기화 ──
// study_sessions, study_activity 테이블을 통해 모바일↔데스크탑 간 데이터 동기화
import { supabase } from '../lib/supabase';

// ──────────────────────────────────────────
// 세션 CRUD
// ──────────────────────────────────────────

export async function upsertSession(
  userId: string,
  setId: string,
  mode: string,
  progress: Record<string, unknown>,
  completed: boolean,
): Promise<void> {
  try {
    await supabase.from('study_sessions').upsert(
      { user_id: userId, set_id: setId, mode, progress, completed },
      { onConflict: 'user_id,set_id,mode' },
    );
  } catch {}
}

export async function loadSession(
  userId: string,
  setId: string,
  mode: string,
): Promise<{ progress: Record<string, unknown>; completed: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('progress, completed')
      .eq('user_id', userId)
      .eq('set_id', setId)
      .eq('mode', mode)
      .maybeSingle();
    if (error || !data) return null;
    return { progress: (data.progress as Record<string, unknown>) ?? {}, completed: data.completed };
  } catch { return null; }
}

export async function deleteSession(
  userId: string,
  setId: string,
  mode: string,
): Promise<void> {
  try {
    await supabase
      .from('study_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('set_id', setId)
      .eq('mode', mode);
  } catch {}
}

/** 세트의 모든 모드 완료 여부 & 진행도를 한 번에 조회 */
export async function loadAllSessions(
  userId: string,
): Promise<Array<{ set_id: string; mode: string; progress: Record<string, unknown>; completed: boolean; updated_at: string }>> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('set_id, mode, progress, completed, updated_at')
    .eq('user_id', userId);
  if (error) return [];
  return (data ?? []) as Array<{ set_id: string; mode: string; progress: Record<string, unknown>; completed: boolean; updated_at: string }>;
}

// ──────────────────────────────────────────
// 스트릭 & 캘린더
// ──────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 카드 평가 1회마다 호출. 스트릭 업데이트 + 캘린더 기록 */
export async function recordActivity(userId: string): Promise<void> {
  const today = todayStr();
  // upsert: count +1 (Supabase RPC 없이 read-then-write)
  const { data } = await supabase
    .from('study_activity')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const prevCount = (data as { count: number } | null)?.count ?? 0;
  await supabase
    .from('study_activity')
    .upsert({ user_id: userId, date: today, count: prevCount + 1 }, { onConflict: 'user_id,date' });
}

/** 현재 스트릭 (연속 학습일 수) */
export async function loadStreak(userId: string): Promise<number> {
  // 최근 2일치 조회
  const { data } = await supabase
    .from('study_activity')
    .select('date, count')
    .eq('user_id', userId)
    .in('date', [todayStr(), yesterdayStr()])
    .order('date', { ascending: false });

  if (!data || data.length === 0) return 0;

  const today = todayStr();
  const yesterday = yesterdayStr();

  // 오늘 학습했으면 연속일 계산을 위해 과거 조회
  const studiedToday = data.some((r: any) => r.date === today && r.count > 0);
  const studiedYesterday = data.some((r: any) => r.date === yesterday && r.count > 0);

  if (!studiedToday && !studiedYesterday) return 0;

  // 연속일 계산: 오늘부터 과거로 연속된 날짜 수
  const startDate = studiedToday ? today : yesterday;
  let streak = 0;
  let cursor = new Date(startDate);

  // 최대 365일까지 역방향 조회
  const { data: history } = await supabase
    .from('study_activity')
    .select('date')
    .eq('user_id', userId)
    .gt('count', 0)
    .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .lte('date', startDate)
    .order('date', { ascending: false });

  const studiedDates = new Set((history ?? []).map((r: any) => r.date));

  for (let i = 0; i < 366; i++) {
    const ds = cursor.toISOString().slice(0, 10);
    if (studiedDates.has(ds)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** 특정 월의 캘린더 데이터 반환 (날짜 → 학습 횟수) */
export async function loadCalendarMonth(
  userId: string,
  year: number,
  month: number, // 0-indexed
): Promise<Record<string, number>> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const { data } = await supabase
    .from('study_activity')
    .select('date, count')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  const result: Record<string, number> = {};
  for (const row of data ?? []) {
    result[(row as any).date] = (row as any).count;
  }
  return result;
}

/** 최근 N개월 캘린더 데이터 반환 (날짜 → 학습 횟수) */
export async function loadCalendarRange(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('study_activity')
    .select('date, count')
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate);

  const result: Record<string, number> = {};
  for (const row of data ?? []) {
    result[(row as any).date] = (row as any).count;
  }
  return result;
}
