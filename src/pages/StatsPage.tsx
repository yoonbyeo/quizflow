import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, BookOpen, Zap, Target, Flame, CalendarDays } from 'lucide-react';
import { loadCalendar, loadStreak } from '../utils/streak';
import type { CardSet, CardStat } from '../types';

interface StatsPageProps {
  cardSets: CardSet[];
}

// ── 학습 캘린더 컴포넌트 ──
function StudyCalendar() {
  const calData = loadCalendar(84); // 12주
  const streak = loadStreak();
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const maxCount = Math.max(...calData.map(d => d.count), 1);

  // 7행 12열로 정렬 (가장 오래된 날짜가 왼쪽 위)
  const weeks: typeof calData[] = [];
  for (let w = 0; w < 12; w++) {
    weeks.push(calData.slice(w * 7, w * 7 + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return 'var(--bg-3)';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'rgba(110,64,201,.3)';
    if (intensity < 0.5) return 'rgba(110,64,201,.55)';
    if (intensity < 0.75) return 'rgba(110,64,201,.8)';
    return 'var(--purple)';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const totalDays = calData.filter(d => d.count > 0).length;
  const totalActivity = calData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={16} color="var(--purple)" /> 학습 캘린더
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {streak > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={14} fill="var(--yellow)" color="var(--yellow)" /> {streak}일 연속
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{totalDays}일 학습 · {totalActivity}회 활동</span>
        </div>
      </div>

      {/* 월 레이블 */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 4, paddingLeft: 2 }}>
        {weeks.map((week, wi) => {
          const firstDay = new Date(week[0]?.date ?? '');
          const showLabel = wi === 0 || firstDay.getDate() <= 7;
          return (
            <div key={wi} style={{ width: 12, fontSize: 9, color: 'var(--text-3)', textAlign: 'center', flexShrink: 0 }}>
              {showLabel ? (firstDay.getMonth() + 1) + '월' : ''}
            </div>
          );
        })}
      </div>

      {/* 잔디 그리드 */}
      <div style={{ display: 'flex', gap: 3, position: 'relative' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((day) => (
              <div
                key={day.date}
                style={{ width: 12, height: 12, borderRadius: 2, background: getColor(day.count), cursor: 'pointer', transition: 'transform .1s' }}
                onMouseEnter={e => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 16, top: tooltip.y - 8, background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', fontSize: 11, color: 'var(--text-1)', pointerEvents: 'none', zIndex: 9999, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-card)' }}>
          {formatDate(tooltip.date)} — {tooltip.count > 0 ? `${tooltip.count}회 학습` : '학습 없음'}
        </div>
      )}

      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>적음</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v === 0 ? 0 : v * maxCount) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>많음</span>
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
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>숙달도 분포</h2>
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
