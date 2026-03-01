import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown, Shuffle, ChevronLeftIcon } from 'lucide-react';
import { shuffleArray } from '../utils';
import type { CardSet } from '../types';

interface FlashcardPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

export default function FlashcardPage({ cardSets, onUpdateStat }: FlashcardPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const [cards, setCards] = useState(() => set ? [...set.cards] : []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  const handleShuffle = useCallback(() => {
    setCards(shuffleArray([...( set?.cards ?? [])]));
    setIdx(0); setFlipped(false);
  }, [set]);

  const go = (dir: 1 | -1) => {
    setIdx(i => Math.max(0, Math.min(cards.length - 1, i + dir)));
    setFlipped(false);
  };

  const rate = async (correct: boolean) => {
    await onUpdateStat(cards[idx].id, correct);
    setDone(d => d + 1);
    if (idx < cards.length - 1) go(1);
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
  const pct = Math.round((done / cards.length) * 100);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ gap: 4 }}>
          <ChevronLeftIcon size={15} /> {set.title}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleShuffle}>
            <Shuffle size={14} /> 섞기
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setIdx(0); setFlipped(false); setCards([...(set.cards)]); setDone(0); }}>
            <RotateCcw size={14} /> 처음부터
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
          <span>{idx + 1} / {cards.length}</span>
          <span>{done}개 평가됨</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Card */}
      <div
        className="flip-card"
        style={{ height: 340, cursor: 'pointer', marginBottom: 20 }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 20 }}>용어</div>
            <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4 }}>{card.term}</p>
            {card.hint && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 16 }}>힌트: {card.hint}</p>}
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>클릭하여 뒤집기</p>
          </div>
          <div className="flip-back">
            <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 20 }}>정의</div>
            <p style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)' }}>{card.definition}</p>
          </div>
        </div>
      </div>

      {/* Navigation & Rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button className="btn btn-secondary btn-md" onClick={() => go(-1)} disabled={idx === 0}>
          <ChevronLeft size={16} />
        </button>

        {flipped && (
          <div style={{ display: 'flex', gap: 10, flex: 1, justifyContent: 'center' }}>
            <button className="btn btn-danger btn-md" onClick={() => rate(false)} style={{ flex: 1, maxWidth: 140 }}>
              <ThumbsDown size={15} /> 모름
            </button>
            <button className="btn btn-secondary btn-md" style={{ flex: 1, maxWidth: 140, color: 'var(--green)', borderColor: 'rgba(63,185,80,.3)' }} onClick={() => rate(true)}>
              <ThumbsUp size={15} /> 알아요
            </button>
          </div>
        )}

        {!flipped && <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>카드를 클릭해 뒤집어보세요</div>}

        <button className="btn btn-secondary btn-md" onClick={() => go(1)} disabled={idx === cards.length - 1}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Progress bar below */}
      {done > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>오늘 세션 진행률</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>{pct}%</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
