import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, BookOpen, Zap, Target, Flame, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { loadStreak } from '../utils/streak';
import InfoTooltip from '../components/ui/InfoTooltip';
import type { CardSet, CardStat } from '../types';

interface StatsPageProps {
  cardSets: CardSet[];
}

const KEY_CALENDAR_PREFIX = 'qf-cal-';

function getCalCount(dateStr: string): number {
  try {
    return parseInt(localStorage.getItem(KEY_CALENDAR_PREFIX + dateStr) ?? '0', 10);
  } catch { return 0; }
}

// 보라색 농도 단계 (학습 0 ~ 최대)
const PURPLE_LEVELS = [
  'transparent',           // 0회 (미학습)
  'rgba(139,92,246,.25)',  // 1단계 (연보라)
  'rgba(139,92,246,.5)',   // 2단계
  'rgba(139,92,246,.75)',  // 3단계
  'rgba(139,92,246,1)',    // 4단계 (진보라)
];

function getPurpleColor(count: number, max: number): string {
  if (count === 0) return PURPLE_LEVELS[0];
  const ratio = count / max;
  if (ratio <= 0.25) return PURPLE_LEVELS[1];
  if (ratio <= 0.5)  return PURPLE_LEVELS[2];
  if (ratio <= 0.75) return PURPLE_LEVELS[3];
  return PURPLE_LEVELS[4];
}

// ── 학습 캘린더 컴포넌트 ──
function StudyCalendar() {
  const today = new Date();
  const streak = loadStreak();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const todayStr = today.toISOString().slice(0, 10);
  const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  // 해당 월 날짜 데이터
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthData: { date: string; count: number; day: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthData.push({ date: ds, count: getCalCount(ds), day: d });
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const maxCount = Math.max(...monthData.map(d => d.count), 1);
  const studiedDays = monthData.filter(d => d.count > 0).length;
  const totalActivity = monthData.reduce((s, d) => s + d.count, 0);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    const nM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nY = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (nY > today.getFullYear() || (nY === today.getFullYear() && nM > today.getMonth())) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // 최근 6개월 요약
  const recentMonths: { label: string; count: number; monthIdx: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = today.getMonth() - i;
    let y = today.getFullYear();
    while (m < 0) { m += 12; y--; }
    const dim = new Date(y, m + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= dim; d++) {
      total += getCalCount(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    recentMonths.push({ label: MONTH_NAMES[m], count: total, monthIdx: m });
  }
  const maxMonthCount = Math.max(...recentMonths.map(r => r.count), 1);

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
          <CalendarDays size={15} color="var(--purple)" /> 학습 캘린더
          <InfoTooltip
            text={'카드를 평가(알았어요/몰랐어요)할 때마다 오늘 날짜에 기록됩니다.\n보라색이 진할수록 그날 학습 횟수가 많습니다.\n◀ ▶ 버튼으로 이전 달을 탐색할 수 있습니다.'}
            position="right" width={250} />
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Flame size={13} fill="var(--yellow)" color="var(--yellow)" /> {streak}일 연속
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {studiedDays}일 학습 · {totalActivity}회
          </span>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={goPrev} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
        <button onClick={goNext} className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', opacity: isCurrentMonth ? 0.25 : 1, cursor: isCurrentMonth ? 'default' : 'pointer' }}
          disabled={isCurrentMonth}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {WEEK_LABELS.map(w => (
          <div key={w} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600,
            color: w === '일' ? 'var(--red)' : w === '토' ? 'rgba(139,92,246,.7)' : 'var(--text-3)',
            padding: '3px 0',
          }}>
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}

        {monthData.map(({ date, count, day }) => {
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          const studied = count > 0;
          const bgColor = isFuture ? 'transparent' : getPurpleColor(count, maxCount);
          const textBright = !isFuture && studied && count / maxCount > 0.5;

          return (
            <div
              key={date}
              style={{
                aspectRatio: '1',
                borderRadius: 7,
                background: bgColor,
                border: isToday
                  ? '2px solid rgba(139,92,246,1)'
                  : isFuture
                    ? 'none'
                    : studied
                      ? '1px solid rgba(139,92,246,.3)'
                      : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isFuture ? 'default' : 'pointer',
                transition: 'transform .1s, box-shadow .1s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (isFuture) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ date, count, x: rect.left + rect.width / 2, y: rect.top });
                e.currentTarget.style.transform = 'scale(1.12)';
                if (studied) e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,.4)';
              }}
              onMouseLeave={e => {
                setTooltip(null);
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{
                fontSize: 12,
                fontWeight: isToday ? 900 : studied ? 700 : 400,
                color: isFuture
                  ? 'var(--bg-3)'
                  : textBright ? '#fff'
                  : studied ? 'rgba(139,92,246,1)'
                  : 'var(--text-3)',
                lineHeight: 1.2,
              }}>
                {day}
              </span>
              {/* 학습 횟수 도트 또는 숫자 */}
              {studied && !isFuture && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: textBright ? 'rgba(255,255,255,.85)' : 'rgba(139,92,246,.9)',
                }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>적음</span>
        {PURPLE_LEVELS.slice(1).map((bg, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: '1px solid rgba(139,92,246,.2)' }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>많음</span>
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 48,
          transform: 'translateX(-50%)',
          background: 'var(--bg-0)',
          border: '1px solid rgba(139,92,246,.4)',
          borderRadius: 8,
          padding: '7px 13px',
          fontSize: 12,
          color: 'var(--text-1)',
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(139,92,246,.2)',
        }}>
          {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          {' · '}
          <strong style={{ color: tooltip.count > 0 ? 'rgba(139,92,246,1)' : 'var(--text-3)' }}>
            {tooltip.count > 0 ? `${tooltip.count}회 학습` : '학습 없음'}
          </strong>
        </div>
      )}

      {/* 최근 6개월 막대 */}
      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>최근 6개월</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 52 }}>
          {recentMonths.map(({ label, count, monthIdx }) => {
            const heightPct = count > 0 ? Math.max((count / maxMonthCount) * 100, 10) : 3;
            const isCur = monthIdx === today.getMonth();
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {count > 0 && <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>{count}</span>}
                <div style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: count > 0 ? 5 : 2,
                  borderRadius: 3,
                  background: isCur
                    ? 'rgba(139,92,246,1)'
                    : count > 0
                      ? 'rgba(139,92,246,.4)'
                      : 'var(--bg-3)',
                  transition: 'height .3s',
                }} />
                <span style={{ fontSize: 10, color: isCur ? 'rgba(139,92,246,1)' : 'var(--text-3)', fontWeight: isCur ? 700 : 400 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage({ cardSets }: StatsPageProps) {
  const navigate = useNavigate();

  const allStats = cardSets.flatMap(s => Object.values(s.studyStats?.cardStats ?? {}) as CardStat[]);
  const totalCards = cardSets.reduce((acc, s) => acc + s.cards.length, 0);
  const studied = allStats.length;
  const mastered = allStats.filter(c => c.difficulty === 'easy').length;
  const learning = allStats.filter(c => c.difficulty === 'medium').length;
  const struggling = allStats.filter(c => c.difficulty === 'hard').length;
  const totalCorrect = allStats.reduce((acc, c) => acc + (c.correct ?? 0), 0);
  const totalIncorrect = allStats.reduce((acc, c) => acc + (c.incorrect ?? 0), 0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const setStats = cardSets.map(s => {
    const stats = Object.values(s.studyStats?.cardStats ?? {}) as CardStat[];
    const total = s.cards.length;
    const m = stats.filter(c => c.difficulty === 'easy').length;
    const pct = total > 0 ? Math.round((m / total) * 100) : 0;
    return { ...s, pct, masteredCount: m, total };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={22} color="var(--blue)" /> 학습 통계
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>전체 학습 현황을 확인하세요</p>
      </div>

      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: '총 세트', value: cardSets.length, icon: BookOpen, color: 'var(--blue)' },
          { label: '총 카드', value: totalCards, icon: Zap, color: 'var(--purple)' },
          { label: '학습한 카드', value: studied, icon: TrendingUp, color: 'var(--yellow)' },
          { label: '정확도', value: `${accuracy}%`, icon: Target, color: 'var(--green)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Icon size={18} color={color} />
            </div>
            <div className="stat-value" style={{ color, fontSize: 24 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* 학습 캘린더 */}
      <StudyCalendar />

      {/* Mastery breakdown */}
      {studied > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            숙달도 분포
            <InfoTooltip
              text={'각 카드의 정답/오답 이력을 바탕으로 난이도가 자동 분류됩니다.\n\n• 숙달: 정답 연속 2회 이상\n• 학습중: 정답과 오답이 섞임\n• 어려움: 최근 오답이 많음\n• 미평가: 아직 학습하지 않은 카드'}
              position="right" width={250} />
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: '숙달', value: mastered, color: 'var(--green)', bg: 'var(--green-bg)' },
              { label: '학습 중', value: learning, color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
              { label: '어려움', value: struggling, color: 'var(--red)', bg: 'var(--red-bg)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ textAlign: 'center', padding: 16, background: bg, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color }}>{label}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-3)' }}>
              {mastered > 0 && <div style={{ flex: mastered, background: 'var(--green)', transition: 'flex .4s' }} />}
              {learning > 0 && <div style={{ flex: learning, background: 'var(--yellow)', transition: 'flex .4s' }} />}
              {struggling > 0 && <div style={{ flex: struggling, background: 'var(--red)', transition: 'flex .4s' }} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              <span>총 {studied}개 학습됨</span>
              <span>{totalAttempts}번 시도 · {totalCorrect}번 정답</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-set stats */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>세트별 숙달도</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {setStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-2)', fontSize: 14 }}>
            아직 학습 기록이 없습니다. 학습을 시작해보세요!
          </div>
        ) : (
          setStats.map(s => (
            <div
              key={s.id}
              className="card card-hover"
              style={{ padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => navigate(`/set/${s.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div>
                  {s.category && <span className="badge badge-blue" style={{ marginTop: 4, display: 'inline-block' }}>{s.category}</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.pct >= 70 ? 'var(--green)' : s.pct >= 40 ? 'var(--yellow)' : 'var(--text-2)' }}>{s.pct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.masteredCount}/{s.total}</div>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
