import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, ThumbsDown, RotateCcw, CheckCircle, Brain } from 'lucide-react';
import ImageZoom from '../components/ui/ImageZoom';
import type { CardSet, Card } from '../types';

interface ReviewPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

interface ReviewCard extends Card {
  setTitle: string;
  setId: string;
}

export default function ReviewPage({ cardSets, onUpdateStat }: ReviewPageProps) {
  const navigate = useNavigate();
  const now = Date.now();

  // 오늘 복습 대상: nextReview가 없거나(한번도 안 한) 또는 nextReview <= 지금
  const dueCards: ReviewCard[] = cardSets.flatMap(set =>
    set.cards
      .filter(card => {
        const stat = set.studyStats?.cardStats?.[card.id];
        if (!stat) return true; // 한 번도 학습 안 한 카드
        if (!stat.nextReview) return true;
        return stat.nextReview <= now;
      })
      .map(card => ({ ...card, setTitle: set.title, setId: set.id }))
  );

  const [queue, setQueue] = useState<ReviewCard[]>(() => [...dueCards]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);

  if (dueCards.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={36} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>오늘 복습할 카드가 없습니다!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
          모든 카드의 복습 일정이 아직 도래하지 않았습니다.<br />내일 다시 확인해보세요.
        </p>
        <button className="btn btn-primary btn-md" onClick={() => navigate('/')}>홈으로</button>
      </div>
    );
  }

  // 세션 완료
  if (done >= queue.length && done > 0) {
    const pct = Math.round((correct / done) * 100);
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Brain size={36} color={pct >= 70 ? 'var(--green)' : 'var(--blue)'} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>복습 완료!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
          {done}장 중 {correct}장 정답 ({pct}%)
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setQueue([...dueCards]); setIdx(0); setDone(0); setCorrect(0); setFlipped(false); }}>
            <RotateCcw size={15} /> 다시
          </button>
          <button className="btn btn-primary btn-md" onClick={() => navigate('/')}>홈으로</button>
        </div>
      </div>
    );
  }

  const card = queue[idx];
  if (!card) return null;

  const rate = async (isCorrect: boolean) => {
    await onUpdateStat(card.id, isCorrect);
    setDone(d => d + 1);
    if (isCorrect) setCorrect(c => c + 1);
    setIdx(i => i + 1);
    setFlipped(false);
  };

  const pct = Math.round((idx / queue.length) * 100);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> 홈
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>오늘의 복습</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{queue.length}장 대기 중</div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{idx + 1} / {queue.length}</span>
      </div>

      {/* 진행바 */}
      <div style={{ marginBottom: 20 }}>
        <div className="progress-track" style={{ height: 6 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue))', borderRadius: 99, transition: 'width .3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
          <span>{correct}개 정답</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>출처: {card.setTitle}</span>
        </div>
      </div>

      {/* 카드 */}
      <div className="flip-card" style={{ height: card.imageUrl ? 400 : 320, cursor: 'pointer', marginBottom: 20 }}
        onClick={() => setFlipped(f => !f)}>
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front">
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>용어</div>
            {card.imageUrl && !flipped && (
              <ImageZoom src={card.imageUrl} style={{ maxHeight: 180, maxWidth: '85%', borderRadius: 12, objectFit: 'contain', marginBottom: 14, border: '1px solid var(--border)' }} />
            )}
            <p style={{ fontSize: card.imageUrl ? 20 : 26, fontWeight: 700, lineHeight: 1.4 }}>{card.term}</p>
            {card.hint && !flipped && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 12 }}>힌트: {card.hint}</p>}
            {!flipped && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 16 }}>클릭하여 정의 보기</p>}
          </div>
          <div className="flip-back">
            <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 20 }}>정의</div>
            <p style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>{card.definition}</p>
          </div>
        </div>
      </div>

      {/* 평가 버튼 */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {flipped ? (
          <>
            <button className="btn btn-danger btn-md" style={{ flex: 1, maxWidth: 180 }} onClick={() => rate(false)}>
              <ThumbsDown size={15} /> 몰랐어요
            </button>
            <button className="btn btn-secondary btn-md" style={{ flex: 1, maxWidth: 180, color: 'var(--green)', borderColor: 'rgba(63,185,80,.3)' }} onClick={() => rate(true)}>
              <ThumbsUp size={15} /> 알았어요
            </button>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>카드를 클릭해서 정의를 확인하세요</p>
        )}
      </div>
    </div>
  );
}
