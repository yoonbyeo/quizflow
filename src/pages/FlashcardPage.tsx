import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown, Shuffle, Settings } from 'lucide-react';
import { shuffleArray } from '../utils';
import ImageZoom from '../components/ui/ImageZoom';
import type { CardSet } from '../types';

interface FlashcardPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

// ── 진행 상태 저장/불러오기 ──
export function saveProgress(setId: string, idx: number) {
  try { localStorage.setItem(`qf-progress-${setId}`, String(idx)); } catch {}
}
export function loadProgress(setId: string): number {
  try { return Math.max(0, parseInt(localStorage.getItem(`qf-progress-${setId}`) ?? '0', 10) || 0); } catch { return 0; }
}

// ── 완료 여부 저장/불러오기 ──
export function saveCompleted(setId: string, mode: string, done: boolean) {
  try { localStorage.setItem(`qf-completed-${mode}-${setId}`, done ? '1' : '0'); } catch {}
}
export function loadCompleted(setId: string, mode: string): boolean {
  try { return localStorage.getItem(`qf-completed-${mode}-${setId}`) === '1'; } catch { return false; }
}

// ── 마지막 학습 모드 저장/불러오기 ──
export type LastMode = 'flashcard' | 'learn' | 'test' | 'match' | 'write';
export function saveLastMode(setId: string, mode: LastMode) {
  try { localStorage.setItem(`qf-lastmode-${setId}`, mode); } catch {}
}
export function loadLastMode(setId: string): LastMode | null {
  try { return (localStorage.getItem(`qf-lastmode-${setId}`) as LastMode) || null; } catch { return null; }
}

export default function FlashcardPage({ cardSets, onUpdateStat }: FlashcardPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const set = cardSets.find(s => s.id === id);

  // 진입 즉시 모드 저장
  if (id) saveLastMode(id, 'flashcard');

  // 시작 인덱스: URL ?start= > localStorage 저장값 > 0
  const getStartIdx = () => {
    const param = parseInt(searchParams.get('start') ?? '-1', 10);
    if (param >= 0) return Math.min(param, (set?.cards.length ?? 1) - 1);
    return loadProgress(id ?? '');
  };

  const [cards, setCards] = useState<CardSet['cards']>(() => set ? [...set.cards] : []);
  const [idx, setIdx] = useState(() => {
    const start = getStartIdx();
    return Math.min(start, (set?.cards.length ?? 1) - 1);
  });
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState<Set<number>>(new Set()); // 평가한 인덱스
  const [answerWith, setAnswerWith] = useState<'definition' | 'term'>('definition');
  const [showSettings, setShowSettings] = useState(false);

  // idx가 바뀔 때마다 localStorage에 저장, 마지막 카드면 완료 표시
  useEffect(() => {
    if (!id) return;
    saveProgress(id, idx);
    saveCompleted(id, 'flashcard', idx >= cards.length - 1);
  }, [id, idx, cards.length]);

  // 최신 state를 ref로 유지 (키보드 핸들러에서 클로저 문제 방지)
  const stateRef = useRef({ idx, flipped, cards, rated });
  useEffect(() => { stateRef.current = { idx, flipped, cards, rated }; });

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 입력 필드 포커스 중이면 무시
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      const { idx: curIdx, flipped: curFlipped, cards: curCards } = stateRef.current;
      switch (e.key) {
        case ' ':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          setFlipped(f => !f);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (curIdx < curCards.length - 1) go(curIdx + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (curIdx > 0) go(curIdx - 1);
          break;
        case '1':
          if (curFlipped) { e.preventDefault(); rate(true); }
          break;
        case '2':
          if (curFlipped) { e.preventDefault(); rate(false); }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShuffle = useCallback(() => {
    setCards(shuffleArray([...(set?.cards ?? [])]));
    setIdx(0);
    setFlipped(false);
    setRated(new Set());
    if (id) saveProgress(id, 0);
  }, [set, id]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(cards.length - 1, next));
    setIdx(clamped);
    setFlipped(false);
  };

  const rate = async (correct: boolean) => {
    await onUpdateStat(cards[idx].id, correct);
    setRated(prev => new Set([...prev, idx]));
    if (idx < cards.length - 1) go(idx + 1);
  };

  const reset = () => {
    setIdx(0);
    setFlipped(false);
    setCards([...(set?.cards ?? [])]);
    setRated(new Set());
    if (id) { saveProgress(id, 0); saveCompleted(id, 'flashcard', false); }
  };

  if (!set || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>카드가 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const card = cards[idx];
  const front = answerWith === 'definition' ? card.term : card.definition;
  const back = answerWith === 'definition' ? card.definition : card.term;

  // 진행도: 현재 위치+1 / 전체 (이어보기 맥락에서 "여기까지 봤다")
  const viewedPct = Math.round(((idx + 1) / cards.length) * 100);
  const ratedPct = Math.round((rated.size / cards.length) * 100);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(s => !s)}>
            <Settings size={14} /> 설정
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleShuffle}>
            <Shuffle size={14} /> 섞기
          </button>
          <button className="btn btn-secondary btn-sm" onClick={reset} title="처음부터">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>설정</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>답 표시 방향</div>
          <div className="tab-group">
            <button className={`tab-btn ${answerWith === 'definition' ? 'active' : ''}`} onClick={() => setAnswerWith('definition')}>용어 → 정의</button>
            <button className={`tab-btn ${answerWith === 'term' ? 'active' : ''}`} onClick={() => setAnswerWith('term')}>정의 → 용어</button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>{idx + 1} / {cards.length}</span>
          <span>{rated.size > 0 ? `${rated.size}개 평가됨` : '카드를 뒤집어 평가해보세요'}</span>
        </div>
        {/* 이중 진행바: 열람(파랑) + 평가(초록) */}
        <div className="progress-track" style={{ height: 6, position: 'relative' }}>
          <div className="progress-fill" style={{ width: `${viewedPct}%`, position: 'absolute', inset: 0 }} />
          {rated.size > 0 && (
            <div style={{ position: 'absolute', inset: 0, width: `${ratedPct}%`, background: 'var(--green)', borderRadius: 99, opacity: 0.8 }} />
          )}
        </div>
      </div>

      {/* Card */}
      <div className="flip-card" style={{ height: card.imageUrl ? 420 : 340, cursor: 'pointer', marginBottom: 20 }} onClick={() => setFlipped(f => !f)}>
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>
              {answerWith === 'definition' ? '용어' : '정의'}
            </div>
            {card.imageUrl && !flipped && (
              <ImageZoom src={card.imageUrl} style={{ maxHeight: 200, maxWidth: '85%', borderRadius: 12, objectFit: 'contain', marginBottom: 14, border: '1px solid var(--border)' }} />
            )}
            <p style={{ fontSize: card.imageUrl ? 20 : 26, fontWeight: 700, lineHeight: 1.4 }}>{front}</p>
            {card.hint && !flipped && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 12 }}>힌트: {card.hint}</p>}
            {!flipped && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 16 }}>클릭하여 뒤집기</p>}
          </div>
          <div className="flip-back">
            <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 20 }}>
              {answerWith === 'definition' ? '정의' : '용어'}
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>{back}</p>
          </div>
        </div>
      </div>

      {/* Nav + rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button className="btn btn-secondary btn-md" onClick={() => go(idx - 1)} disabled={idx === 0}>
          <ChevronLeft size={16} />
        </button>
        {flipped ? (
          <div style={{ display: 'flex', gap: 10, flex: 1, justifyContent: 'center' }}>
            <button className="btn btn-danger btn-md" onClick={() => rate(false)} style={{ flex: 1, maxWidth: 150 }}>
              <ThumbsDown size={15} /> 모름
            </button>
            <button className="btn btn-secondary btn-md" style={{ flex: 1, maxWidth: 150, color: 'var(--green)', borderColor: 'rgba(63,185,80,.3)' }} onClick={() => rate(true)}>
              <ThumbsUp size={15} /> 알아요
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>카드를 클릭해 뒤집어보세요</div>
        )}
        <button className="btn btn-secondary btn-md" onClick={() => go(idx + 1)} disabled={idx === cards.length - 1}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 키보드 단축키 안내 */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'Space', desc: '뒤집기' },
          { key: '← →', desc: '이전/다음' },
          { key: '1', desc: '알아요' },
          { key: '2', desc: '모름' },
        ].map(({ key, desc }) => (
          <span key={key} style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 11 }}>{key}</kbd>
            {desc}
          </span>
        ))}
      </div>

      {/* 마지막 카드 도달 시 */}
      {idx === cards.length - 1 && (
        <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🎉 마지막 카드입니다</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
            {rated.size}개 평가 · {cards.length - rated.size}개 미평가
          </div>
          <button className="btn btn-secondary btn-sm" onClick={reset} style={{ gap: 4 }}>
            <RotateCcw size={13} /> 처음부터 다시
          </button>
        </div>
      )}
    </div>
  );
}
