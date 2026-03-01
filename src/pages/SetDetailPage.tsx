import { useParams, useNavigate, Link } from 'react-router-dom';
import { Zap, PenLine, Shuffle, BookText, Edit2, RotateCcw, ChevronLeft, Brain } from 'lucide-react';
import type { CardSet, CardStat } from '../types';

interface SetDetailPageProps {
  cardSets: CardSet[];
  onResetStats: (id: string) => Promise<void>;
}

export default function SetDetailPage({ cardSets, onResetStats }: SetDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  if (!set) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>세트를 찾을 수 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate('/library')}>돌아가기</button>
      </div>
    );
  }

  const stats = Object.values(set.studyStats?.cardStats ?? {}) as CardStat[];
  const total = set.cards.length;
  const mastered = stats.filter(c => c.difficulty === 'easy').length;
  const learning = stats.filter(c => c.difficulty === 'medium').length;
  const struggling = stats.filter(c => c.difficulty === 'hard').length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const modes = [
    { label: '플래시카드', icon: Zap, color: 'var(--blue)', bg: 'var(--blue-bg)', path: `/flashcard/${id}`, desc: '카드를 넘기며 암기' },
    { label: '학습하기', icon: Brain, color: 'var(--purple)', bg: 'var(--purple-bg)', path: `/learn/${id}`, desc: 'AI 적응형 학습' },
    { label: '테스트', icon: PenLine, color: 'var(--green)', bg: 'var(--green-bg)', path: `/test/${id}`, desc: '객관식 · 주관식 · OX' },
    { label: '매칭', icon: Shuffle, color: 'var(--yellow)', bg: 'var(--yellow-bg)', path: `/match/${id}`, desc: '짝 맞추기 게임' },
    { label: '쓰기', icon: BookText, color: '#f0883e', bg: 'rgba(240,136,62,.15)', path: `/write/${id}`, desc: '직접 입력하며 학습' },
  ];

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20, gap: 4 }}>
        <ChevronLeft size={15} /> 뒤로
      </button>

      {/* Header */}
      <div className="card card-glow" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {set.category && <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-block' }}>{set.category}</span>}
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{set.title}</h1>
            {set.description && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{set.description}</p>}
          </div>
          <Link to={`/edit/${id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
            <Edit2 size={14} /> 편집
          </Link>
        </div>

        {total > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>전체 숙달도</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{pct}% · {mastered}/{total}개</span>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: '총 카드', value: total, color: 'var(--text-1)' },
            { label: '숙달', value: mastered, color: 'var(--green)' },
            { label: '학습 중', value: learning, color: 'var(--yellow)' },
            { label: '어려움', value: struggling, color: 'var(--red)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px 0', background: 'var(--bg-2)', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Study modes */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>학습 모드 선택</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        {modes.map(({ label, icon: Icon, color, bg, path, desc }) => (
          <Link key={label} to={path} className="mode-btn">
            <div className="mode-icon" style={{ background: bg }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Cards list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>카드 목록 ({total})</h2>
        {stats.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', gap: 4 }}
            onClick={() => { if (confirm('통계를 초기화할까요?')) onResetStats(id!); }}>
            <RotateCcw size={13} /> 통계 초기화
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {set.cards.map((card, i) => {
          const cardStat = set.studyStats?.cardStats?.[card.id] as CardStat | undefined;
          return (
            <div key={card.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>용어</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{card.term}</div>
                  {card.imageUrl && <img src={card.imageUrl} style={{ marginTop: 8, maxWidth: 120, borderRadius: 6, border: '1px solid var(--border)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>정의</div>
                  <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{card.definition}</div>
                </div>
              </div>
              {cardStat && (
                <span className={`badge ${cardStat.difficulty === 'easy' ? 'badge-green' : cardStat.difficulty === 'medium' ? 'badge-yellow' : cardStat.difficulty === 'hard' ? 'badge-red' : 'badge-gray'}`} style={{ flexShrink: 0 }}>
                  {cardStat.difficulty === 'easy' ? '숙달' : cardStat.difficulty === 'medium' ? '학습중' : cardStat.difficulty === 'hard' ? '어려움' : '미평가'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
