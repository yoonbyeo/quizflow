import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Zap, PenLine, Shuffle, BookText, Edit2, RotateCcw, ChevronLeft, Brain, ChevronRight, Eye, EyeOff, Download } from 'lucide-react';
import ImageZoom from '../components/ui/ImageZoom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { cardsToCSV, downloadCSV } from '../utils/csv';
import type { CardSet, CardStat } from '../types';

interface SetDetailPageProps {
  cardSets: CardSet[];
  onResetStats: (id: string) => Promise<void>;
}

// ── 인라인 플래시카드 뷰 ──
function InlineFlashcard({ set }: { set: CardSet }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<'term-def' | 'def-term'>('term-def');
  const cards = set.cards;
  if (cards.length === 0) return null;
  const card = cards[idx];
  const front = direction === 'term-def' ? card.term : card.definition;
  const back = direction === 'term-def' ? card.definition : card.term;
  const frontLabel = direction === 'term-def' ? '용어' : '정의';
  const backLabel = direction === 'term-def' ? '정의' : '용어';

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>바로 학습하기</h2>
        <div className="tab-group" style={{ padding: 2 }}>
          <button className={`tab-btn ${direction === 'term-def' ? 'active' : ''}`} style={{ fontSize: 11, padding: '5px 10px' }}
            onClick={() => { setDirection('term-def'); setFlipped(false); }}>용어→정의</button>
          <button className={`tab-btn ${direction === 'def-term' ? 'active' : ''}`} style={{ fontSize: 11, padding: '5px 10px' }}
            onClick={() => { setDirection('def-term'); setFlipped(false); }}>정의→용어</button>
        </div>
      </div>

      <div className="flip-card" style={{ minHeight: 260, cursor: 'pointer', marginBottom: 16 }}
        onClick={() => setFlipped(f => !f)}>
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`} style={{ minHeight: 260 }}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>{frontLabel}</div>
            {card.imageUrl && !flipped && (
              <ImageZoom src={card.imageUrl} style={{ width: '60%', maxWidth: '60%', borderRadius: 10, objectFit: 'contain', marginBottom: 14, border: '1px solid var(--border)', display: 'block' }} />
            )}
            <p style={{ fontSize: card.imageUrl ? 20 : 24, fontWeight: 700, lineHeight: 1.4 }}>{front}</p>
            {card.hint && !flipped && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10 }}>힌트: {card.hint}</p>}
            {!flipped && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 16 }}>클릭하여 뒤집기</p>}
          </div>
          <div className="flip-back">
            <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>{backLabel}</div>
            <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5 }}>{back}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0}
          className="btn btn-secondary btn-sm">
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 60, textAlign: 'center' }}>
          {idx + 1} / {cards.length}
        </span>
        <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={idx === cards.length - 1}
          className="btn btn-secondary btn-sm">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => { setIdx(0); setFlipped(false); }} className="btn btn-ghost btn-sm">
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}

export default function SetDetailPage({ cardSets, onResetStats }: SetDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const [blurTerms, setBlurTerms] = useState(false);
  const [blurDefs, setBlurDefs] = useState(false);
  // 개별 카드 블러 해제 추적 (card.id → true면 해당 카드만 보임)
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());
  const [revealedDefs, setRevealedDefs] = useState<Set<string>>(new Set());

  const toggleRevealTerm = (cardId: string) => {
    setRevealedTerms(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId); else next.add(cardId);
      return next;
    });
  };
  const toggleRevealDef = (cardId: string) => {
    setRevealedDefs(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId); else next.add(cardId);
      return next;
    });
  };

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
    {
      label: '플래시카드', icon: Zap, color: 'var(--blue)', bg: 'var(--blue-bg)', path: `/flashcard/${id}`,
      desc: '카드 넘기며 암기',
      info: '앞면(용어)을 보고 정의를 떠올린 뒤 카드를 뒤집어 확인합니다.\n알았어요 / 몰랐어요로 자기 평가하면 숙달도가 기록됩니다.\n← → 키보드, Space로 뒤집기도 가능합니다.',
    },
    {
      label: '학습하기', icon: Brain, color: 'var(--purple)', bg: 'var(--purple-bg)', path: `/learn/${id}`,
      desc: 'AI 적응형 학습',
      info: '플래시카드로 전체 카드를 먼저 훑은 뒤, 틀린 카드를 객관식·주관식으로 반복 출제합니다.\n틀린 카드는 큐에 다시 추가되어 모두 맞힐 때까지 반복합니다.\n진행 상태가 저장되어 중간에 나가도 이어서 학습할 수 있습니다.',
    },
    {
      label: '테스트', icon: PenLine, color: 'var(--green)', bg: 'var(--green-bg)', path: `/test/${id}`,
      desc: '객관식 · 주관식',
      info: '설정한 문제 수만큼 객관식·주관식 문제를 출제합니다.\n오답 선택지는 같은 세트의 다른 카드에서 랜덤으로 구성됩니다.\nA/B/C/D 키보드 단축키로 빠르게 답할 수 있습니다.',
    },
    {
      label: '매칭', icon: Shuffle, color: 'var(--yellow)', bg: 'var(--yellow-bg)', path: `/match/${id}`,
      desc: '짝 맞추기 게임',
      info: '용어와 정의가 화면에 섞여 나옵니다.\n올바른 용어-정의 쌍을 클릭해서 연결하세요.\n모두 맞출수록 랭킹 시간이 기록됩니다.',
    },
    {
      label: '쓰기', icon: BookText, color: '#f0883e', bg: 'rgba(240,136,62,.15)', path: `/write/${id}`,
      desc: '직접 입력 학습',
      info: '정의를 보고 용어를 직접 타이핑합니다.\n정확히 입력하면 정답 처리되며, 틀리면 오답 노트에 기록됩니다.\n직접 쓰는 방식이라 장기 기억에 효과적입니다.',
    },
  ];

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20, gap: 4 }}>
        <ChevronLeft size={15} /> 뒤로
      </button>

      {/* ── 헤더 ── */}
      <div className="card card-glow" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {set.category && <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-block' }}>{set.category}</span>}
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{set.title}</h1>
            {set.description && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{set.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => downloadCSV(cardsToCSV(set.cards, set.title), set.title)}
              title="CSV로 내보내기">
              <Download size={14} /> CSV
            </button>
            <Link to={`/edit/${id}`} className="btn btn-secondary btn-sm">
              <Edit2 size={14} /> 편집
            </Link>
          </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 20 }}>
          {[
            { label: '총 카드', value: total, color: 'var(--text-1)' },
            { label: '숙달', value: mastered, color: 'var(--green)' },
            { label: '학습 중', value: learning, color: 'var(--yellow)' },
            { label: '어려움', value: struggling, color: 'var(--red)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-2)', borderRadius: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 학습 모드 ── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>학습 모드</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 32 }}>
        {modes.map(({ label, icon: Icon, color, bg, path, desc, info }) => (
          <Link key={label} to={path} className="mode-btn" style={{ padding: 16, position: 'relative' }}>
            <div className="mode-icon" style={{ background: bg, width: 38, height: 38, borderRadius: 10 }}>
              <Icon size={17} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{desc}</div>
            </div>
            <span onClick={e => e.preventDefault()} style={{ flexShrink: 0 }}>
              <InfoTooltip text={info} width={260} position="top" />
            </span>
          </Link>
        ))}
      </div>

      {/* ── 바로 학습하기 (인라인 플래시카드) ── */}
      {set.cards.length > 0 && <InlineFlashcard set={set} />}

      {/* ── 카드 목록 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>카드 목록 ({total})</h2>
          <InfoTooltip
            text={'숙달: 정답률이 높은 카드\n학습중: 일부 맞힌 카드\n어려움: 자주 틀리는 카드\n미평가: 아직 학습하지 않은 카드'}
            position="bottom" width={200} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 블러 토글 */}
          <button
            onClick={() => { setBlurTerms(b => !b); setRevealedTerms(new Set()); }}
            className={`btn btn-sm ${blurTerms ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 5, fontSize: 12 }}
          >
            {blurTerms ? <EyeOff size={13} /> : <Eye size={13} />}
            용어 {blurTerms ? '숨김' : '표시'}
          </button>
          <button
            onClick={() => { setBlurDefs(b => !b); setRevealedDefs(new Set()); }}
            className={`btn btn-sm ${blurDefs ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 5, fontSize: 12 }}
          >
            {blurDefs ? <EyeOff size={13} /> : <Eye size={13} />}
            뜻 {blurDefs ? '숨김' : '표시'}
          </button>
          <InfoTooltip text={'용어 또는 뜻을 블러 처리해 자가 테스트할 수 있습니다.\n블러 상태에서 각 카드를 클릭하면 해당 카드만 개별적으로 확인할 수 있습니다.'} position="top" width={240} />
          {stats.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', gap: 4, fontSize: 12 }}
              onClick={() => { if (confirm('통계를 초기화할까요?')) onResetStats(id!); }}>
              <RotateCcw size={13} /> 초기화
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {set.cards.map((card, i) => {
          const cardStat = set.studyStats?.cardStats?.[card.id] as CardStat | undefined;
          const termBlurred = blurTerms && !revealedTerms.has(card.id);
          const defBlurred = blurDefs && !revealedDefs.has(card.id);
          return (
            <div key={card.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* 번호 */}
              <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>
                {i + 1}
              </div>

              {/* 용어 - 고정 50% 너비 */}
              <div style={{ width: 0, flex: '0 0 calc(50% - 32px)', padding: '2px 16px 2px 8px', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>용어</div>
                <div
                  style={{
                    fontSize: 14, fontWeight: 600,
                    filter: termBlurred ? 'blur(6px)' : 'none',
                    transition: 'filter .2s',
                    cursor: blurTerms ? 'pointer' : 'default',
                    userSelect: termBlurred ? 'none' : 'auto',
                  }}
                  onClick={() => blurTerms && toggleRevealTerm(card.id)}
                  title={blurTerms ? (termBlurred ? '클릭하여 보기' : '클릭하여 숨기기') : undefined}
                >
                  {card.term}
                </div>
                {card.imageUrl && (
                  termBlurred
                    ? <img src={card.imageUrl} style={{ marginTop: 6, maxWidth: 100, borderRadius: 6, border: '1px solid var(--border)', filter: 'blur(6px)', transition: 'filter .2s' }} />
                    : <ImageZoom src={card.imageUrl} style={{ marginTop: 6, maxWidth: 100, borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
                )}
              </div>

              {/* 정의 - 고정 50% 너비 */}
              <div style={{ width: 0, flex: '0 0 calc(50% - 16px)', padding: '2px 8px 2px 16px', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>정의</div>
                <div
                  style={{
                    fontSize: 14, color: 'var(--text-2)',
                    filter: defBlurred ? 'blur(6px)' : 'none',
                    transition: 'filter .2s',
                    cursor: blurDefs ? 'pointer' : 'default',
                    userSelect: defBlurred ? 'none' : 'auto',
                  }}
                  onClick={() => blurDefs && toggleRevealDef(card.id)}
                  title={blurDefs ? (defBlurred ? '클릭하여 보기' : '클릭하여 숨기기') : undefined}
                >
                  {card.definition}
                </div>
                {card.hint && !defBlurred && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>힌트: {card.hint}</div>
                )}
              </div>

              {/* 난이도 뱃지 */}
              {cardStat && (
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 12, flexShrink: 0 }}>
                  <span className={`badge ${cardStat.difficulty === 'easy' ? 'badge-green' : cardStat.difficulty === 'medium' ? 'badge-yellow' : cardStat.difficulty === 'hard' ? 'badge-red' : 'badge-gray'}`}>
                    {cardStat.difficulty === 'easy' ? '숙달' : cardStat.difficulty === 'medium' ? '학습중' : cardStat.difficulty === 'hard' ? '어려움' : '미평가'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
