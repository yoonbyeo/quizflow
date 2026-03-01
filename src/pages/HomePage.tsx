import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Zap, PenLine, Shuffle, TrendingUp, ArrowRight } from 'lucide-react';
import type { CardSet, CardStat } from '../types';

interface HomePageProps {
  cardSets: CardSet[];
  loading: boolean;
}

function SetCard({ set, onClick }: { set: CardSet; onClick: () => void }) {
  const total = set.cards.length;
  const stats = Object.values(set.studyStats?.cardStats ?? {}) as CardStat[];
  const mastered = stats.filter((c) => c.difficulty === 'easy').length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="set-card" onClick={onClick}>
      {set.category && (
        <div style={{ marginBottom: 10 }}>
          <span className="badge badge-blue">{set.category}</span>
        </div>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.4, color: 'var(--text-1)' }}>
        {set.title}
      </h3>
      {set.description && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {set.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="badge badge-gray">{total}개 카드</span>
        {mastered > 0 && <span className="badge badge-green">{mastered}개 숙달</span>}
      </div>
      {total > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
            <span>숙달도</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage({ cardSets, loading }: HomePageProps) {
  const navigate = useNavigate();
  const recent = [...cardSets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (cardSets.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <BookOpen size={28} color="var(--blue)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>첫 번째 세트를 만들어보세요</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.7 }}>
          QuizFlow로 플래시카드를 만들고<br />다양한 모드로 학습하세요.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
          <Plus size={18} /> 새 세트 만들기
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 36 }}>
        {[
          { icon: Plus, label: '새 세트', sub: '카드 세트 만들기', color: 'var(--blue)', bg: 'var(--blue-bg)', path: '/create' },
          { icon: Zap, label: '플래시카드', sub: '빠른 학습', color: 'var(--purple)', bg: 'var(--purple-bg)', path: cardSets[0] ? `/flashcard/${cardSets[0].id}` : '/library' },
          { icon: PenLine, label: '테스트', sub: '실력 점검', color: 'var(--green)', bg: 'var(--green-bg)', path: cardSets[0] ? `/test/${cardSets[0].id}` : '/library' },
          { icon: Shuffle, label: '매칭', sub: '매칭 게임', color: 'var(--yellow)', bg: 'var(--yellow-bg)', path: cardSets[0] ? `/match/${cardSets[0].id}` : '/library' },
        ].map(({ icon: Icon, label, sub, color, bg, path }) => (
          <div
            key={label}
            className="mode-btn"
            onClick={() => navigate(path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="mode-icon" style={{ background: bg }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
        {[
          { label: '총 세트', value: cardSets.length, color: 'var(--blue)' },
          { label: '총 카드', value: cardSets.reduce((s, set) => s + set.cards.length, 0), color: 'var(--purple)' },
          { label: '숙달 카드', value: cardSets.reduce((s, set) => s + (Object.values(set.studyStats?.cardStats ?? {}) as CardStat[]).filter(c => c.difficulty === 'easy').length, 0), color: 'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent sets */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={17} color="var(--blue)" />
          최근 세트
        </h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/library')}
          style={{ gap: 4 }}
        >
          전체 보기 <ArrowRight size={13} />
        </button>
      </div>
      <div className="sets-grid">
        {recent.map(set => (
          <SetCard key={set.id} set={set} onClick={() => navigate(`/set/${set.id}`)} />
        ))}
      </div>
    </div>
  );
}
