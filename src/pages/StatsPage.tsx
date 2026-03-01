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

// ── 학습 캘린더 컴포넌트 (월별 달력 방식) ──
function StudyCalendar() {
  const today = new Date();
  const streak = loadStreak();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based

  const todayStr = today.toISOString().slice(0, 10);

  // 해당 월의 모든 날짜 데이터 수집
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthData: { date: string; count: number; day: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    monthData.push({ date: dateStr, count: getCalCount(dateStr), day: d });
  }

  // 이달 1일의 요일 (0=일, 1=월 ... 6=토)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const maxCount = Math.max(...monthData.map(d => d.count), 1);
  const totalDays = monthData.filter(d => d.count > 0).length;
  const totalActivity = monthData.reduce((s, d) => s + d.count, 0);

  const getColor = (count: number) => {
    if (count === 0) return 'transparent';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'rgba(99,179,237,.35)';
    if (intensity < 0.5)  return 'rgba(99,179,237,.6)';
    if (intensity < 0.75) return 'rgba(99,179,237,.85)';
    return 'var(--blue)';
  };

  const getBorderColor = (count: number) => {
    if (count === 0) return 'var(--border)';
    return 'transparent';
  };

  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    // 미래 달은 이동 불가
    if (nextY > today.getFullYear() || (nextY === today.getFullYear() && nextM > today.getMonth())) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // 달 전체 학습 기록도 미리 로드해 최근 6개월 활동 요약용
  const recentMonths: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = today.getMonth() - i;
    let y = today.getFullYear();
    while (m < 0) { m += 12; y--; }
    const dim = new Date(y, m + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      total += getCalCount(ds);
    }
    recentMonths.push({ label: MONTH_NAMES[m], count: total });
  }

  return (
    <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={16} color="var(--blue)" /> 학습 캘린더
          <InfoTooltip
            text={'카드를 평가(알았어요/몰랐어요)할 때마다 오늘 날짜에 기록됩니다.\n색이 진할수록 그날 학습 횟수가 많습니다.\n◀ ▶ 버튼으로 이전 달을 탐색할 수 있습니다.'}
            position="right" width={250} />
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {streak > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={14} fill="var(--yellow)" color="var(--yellow)" /> {streak}일 연속
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            이번 달 {totalDays}일 · {totalActivity}회
          </span>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={goPrev} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)' }}>
          {viewYear}년 {MONTH_NAMES[viewMonth]}
        </span>
        <button onClick={goNext} className="btn btn-ghost btn-sm"
          style={{ padding: '6px 10px', opacity: isCurrentMonth ? 0.3 : 1, cursor: isCurrentMonth ? 'default' : 'pointer' }}
          disabled={isCurrentMonth}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEK_LABELS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: w === '일' ? 'var(--red)' : w === '토' ? 'var(--blue)' : 'var(--text-3)', padding: '4px 0' }}>
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {/* 빈 칸 (월 시작 전) */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* 날짜 셀 */}
        {monthData.map(({ date, count, day }) => {
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          return (
            <div
              key={date}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                background: isFuture ? 'transparent' : getColor(count),
                border: isToday
                  ? '2px solid var(--blue)'
                  : `1px solid ${isFuture ? 'transparent' : getBorderColor(count)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isFuture ? 'default' : 'pointer',
                position: 'relative',
                transition: 'transform .1s',
              }}
              onMouseEnter={e => {
                if (isFuture) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTooltip({ date, count, x: rect.left + rect.width / 2, y: rect.top });
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => {
                setTooltip(null);
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: isToday ? 800 : 500,
                color: isFuture
                  ? 'var(--text-3)'
                  : count > 0
                    ? (count / maxCount > 0.5 ? '#fff' : 'var(--text-1)')
                    : 'var(--text-2)',
              }}>
                {day}
              </span>
              {count > 0 && !isFuture && (
                <span style={{ fontSize: 9, color: count / maxCount > 0.5 ? 'rgba(255,255,255,.8)' : 'var(--blue)', fontWeight: 700, lineHeight: 1 }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 44,
          transform: 'translateX(-50%)',
          background: 'var(--bg-0)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          color: 'var(--text-1)',
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,.3)',
        }}>
          {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          {' · '}
          <strong>{tooltip.count > 0 ? `${tooltip.count}회 학습` : '학습 없음'}</strong>
        </div>
      )}

      {/* 최근 6개월 막대 미니 차트 */}
      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>최근 6개월</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
          {recentMonths.map(({ label, count }) => {
            const maxMonthCount = Math.max(...recentMonths.map(m => m.count), 1);
            const heightPct = count > 0 ? Math.max((count / maxMonthCount) * 100, 8) : 4;
            const isCurrentMonthBar = label === MONTH_NAMES[today.getMonth()];
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {count > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{count}</span>
                )}
                <div style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: count > 0 ? 6 : 3,
                  borderRadius: 4,
                  background: isCurrentMonthBar ? 'var(--blue)' : count > 0 ? 'rgba(99,179,237,.45)' : 'var(--bg-3)',
                  transition: 'height .3s',
                }} />
                <span style={{ fontSize: 11, color: isCurrentMonthBar ? 'var(--blue)' : 'var(--text-3)', fontWeight: isCurrentMonthBar ? 700 : 400 }}>{label}</span>
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
