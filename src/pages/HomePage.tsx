import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Zap, PenLine, Shuffle, ArrowRight, Brain, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { CardSet, CardStat, Folder } from '../types';

interface HomePageProps {
  cardSets: CardSet[];
  folders: Folder[];
  loading: boolean;
}

// ── 인라인 플래시카드 미니뷰 ──
function MiniFlashcard({ set }: { set: CardSet }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = set.cards;
  if (cards.length === 0) return null;
  const card = cards[idx];
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div
        className="flip-card"
        style={{ height: 120, cursor: 'pointer' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front" style={{ borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>용어</p>
            <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{card.term}</p>
          </div>
          <div className="flip-back" style={{ borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>정의</p>
            <p style={{ fontSize: 14, lineHeight: 1.4 }}>{card.definition}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 }}>
        <button onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={idx === 0}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', opacity: idx === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{idx + 1} / {cards.length}</span>
        <button onClick={e => { e.stopPropagation(); setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
          disabled={idx === cards.length - 1}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', opacity: idx === cards.length - 1 ? 0.3 : 1 }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={e => { e.stopPropagation(); setIdx(0); setFlipped(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}

// ── 세트 카드 ──
function SetCard({ set, onClick, expanded, onToggleExpand }: {
  set: CardSet;
  onClick: () => void;
  expanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const total = set.cards.length;
  const stats = Object.values(set.studyStats?.cardStats ?? {}) as CardStat[];
  const mastered = stats.filter(c => c.difficulty === 'easy').length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="set-card" style={{ cursor: 'default' }}>
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
        {set.category && (
          <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>{set.category}</span>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{set.title}</h3>
        {set.description && (
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {set.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: pct > 0 ? 10 : 0 }}>
          <span className="badge badge-gray">{total}개 카드</span>
          {mastered > 0 && <span className="badge badge-green">{mastered} 숙달</span>}
        </div>
        {pct > 0 && (
          <div className="progress-track" style={{ marginBottom: 2 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* 빠른 학습 버튼 행 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/flashcard/${set.id}`)}>
          <Zap size={12} /> 플래시
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/test/${set.id}`)}>
          <PenLine size={12} /> 테스트
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/match/${set.id}`)}>
          <Shuffle size={12} /> 매칭
        </button>
        <button
          className={`btn btn-sm ${expanded ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: 11, paddingLeft: 8, paddingRight: 8 }}
          onClick={onToggleExpand}
          title="카드 미리보기"
        >
          <BookOpen size={12} />
        </button>
      </div>

      {expanded && <MiniFlashcard set={set} />}
    </div>
  );
}

export default function HomePage({ cardSets, loading }: HomePageProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recent = [...cardSets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  // 가장 최근에 공부한 세트 (진행 중)
  const inProgress = [...cardSets]
    .filter(s => {
      const stats = Object.values(s.studyStats?.cardStats ?? {}) as CardStat[];
      return stats.length > 0 && stats.some(c => c.difficulty !== 'easy');
    })
    .sort((a, b) => (b.studyStats?.lastStudied ?? 0) - (a.studyStats?.lastStudied ?? 0))
    .slice(0, 2);

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
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, var(--blue-bg), var(--purple-bg))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <BookOpen size={32} color="var(--blue)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>첫 번째 세트를 만들어보세요</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.8 }}>
          QuizFlow로 플래시카드를 만들고<br />다양한 학습 모드로 공부하세요.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
          <Plus size={18} /> 새 세트 만들기
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* ── 진행 중인 세트 ── */}
      {inProgress.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="var(--purple)" /> 멈춘 지점에서 계속하기
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inProgress.map(set => {
              const stats = Object.values(set.studyStats?.cardStats ?? {}) as CardStat[];
              const mastered = stats.filter(c => c.difficulty === 'easy').length;
              const pct = set.cards.length > 0 ? Math.round((mastered / set.cards.length) * 100) : 0;
              return (
                <div key={set.id} className="card" style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
                  onClick={() => navigate(`/set/${set.id}`)}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--blue-bg), var(--purple-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} color="var(--blue)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{set.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{pct}% 완료 · {set.cards.length}개 카드</div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-primary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/learn/${set.id}`); }}>
                      계속하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 빠른 시작 모드 ── */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>여기서 시작하기</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { icon: Zap, label: '낱말카드', sub: '플래시카드', color: 'var(--blue)', bg: 'var(--blue-bg)', path: cardSets[0] ? `/flashcard/${cardSets[0].id}` : '/library' },
            { icon: Brain, label: '학습하기', sub: '적응형 학습', color: 'var(--purple)', bg: 'var(--purple-bg)', path: cardSets[0] ? `/learn/${cardSets[0].id}` : '/library' },
            { icon: PenLine, label: '테스트', sub: '실력 점검', color: 'var(--green)', bg: 'var(--green-bg)', path: cardSets[0] ? `/test/${cardSets[0].id}` : '/library' },
            { icon: Shuffle, label: '카드 맞추기', sub: '매칭 게임', color: 'var(--yellow)', bg: 'var(--yellow-bg)', path: cardSets[0] ? `/match/${cardSets[0].id}` : '/library' },
            { icon: Plus, label: '새 세트', sub: '직접 만들기', color: '#f0883e', bg: 'rgba(240,136,62,.15)', path: '/create' },
          ].map(({ icon: Icon, label, sub, color, bg, path }) => (
            <div key={label} className="mode-btn" onClick={() => navigate(path)} style={{ cursor: 'pointer', padding: 16 }}>
              <div className="mode-icon" style={{ background: bg, width: 36, height: 36, borderRadius: 10 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 통계 ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: '총 세트', value: cardSets.length, color: 'var(--blue)' },
            { label: '총 카드', value: cardSets.reduce((s, set) => s + set.cards.length, 0), color: 'var(--purple)' },
            { label: '숙달 카드', value: cardSets.reduce((s, set) => s + (Object.values(set.studyStats?.cardStats ?? {}) as CardStat[]).filter(c => c.difficulty === 'easy').length, 0), color: 'var(--green)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-value" style={{ color, fontSize: 28 }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 최근 세트 (카드 미리보기 포함) ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>최근 세트</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')} style={{ gap: 4 }}>
            전체 보기 <ArrowRight size={13} />
          </button>
        </div>
        <div className="sets-grid">
          {recent.map(set => (
            <SetCard
              key={set.id}
              set={set}
              onClick={() => navigate(`/set/${set.id}`)}
              expanded={expandedId === set.id}
              onToggleExpand={e => { e.stopPropagation(); setExpandedId(expandedId === set.id ? null : set.id); }}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
