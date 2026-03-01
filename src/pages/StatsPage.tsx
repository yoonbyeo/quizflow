import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, BookOpen, Zap, Target } from 'lucide-react';
import type { CardSet, CardStat } from '../types';

interface StatsPageProps {
  cardSets: CardSet[];
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
