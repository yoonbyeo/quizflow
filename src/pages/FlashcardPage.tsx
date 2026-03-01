import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown, Shuffle, Settings } from 'lucide-react';
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
  const [answerWith, setAnswerWith] = useState<'definition' | 'term'>('definition');
  const [showSettings, setShowSettings] = useState(false);

  const handleShuffle = useCallback(() => {
    setCards(shuffleArray([...(set?.cards ?? [])]));
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
  const front = answerWith === 'definition' ? card.term : card.definition;
  const back = answerWith === 'definition' ? card.definition : card.term;
  const pct = Math.round((done / cards.length) * 100);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={14} /> 설정
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleShuffle}>
            <Shuffle size={14} /> 섞기
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setIdx(0); setFlipped(false); setCards([...(set.cards)]); setDone(0); }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>설정</div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>답 표시 방향</div>
            <div className="tab-group">
              <button className={`tab-btn ${answerWith === 'definition' ? 'active' : ''}`} onClick={() => setAnswerWith('definition')}>용어 → 정의</button>
              <button className={`tab-btn ${answerWith === 'term' ? 'active' : ''}`} onClick={() => setAnswerWith('term')}>정의 → 용어</button>
            </div>
          </div>
        </div>
      )}

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
      <div className="flip-card" style={{ height: 340, cursor: 'pointer', marginBottom: 20 }} onClick={() => setFlipped(f => !f)}>
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 20 }}>
              {answerWith === 'definition' ? '용어' : '정의'}
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4 }}>{front}</p>
            {card.hint && !flipped && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 16 }}>힌트: {card.hint}</p>}
            {card.imageUrl && !flipped && <img src={card.imageUrl} style={{ marginTop: 16, maxHeight: 100, borderRadius: 8, objectFit: 'contain' }} />}
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>클릭하여 뒤집기</p>
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
        <button className="btn btn-secondary btn-md" onClick={() => go(-1)} disabled={idx === 0}>
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
        <button className="btn btn-secondary btn-md" onClick={() => go(1)} disabled={idx === cards.length - 1}>
          <ChevronRight size={16} />
        </button>
      </div>

      {done > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>세션 진행률</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>{pct}%</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
    </div>
  );
}
