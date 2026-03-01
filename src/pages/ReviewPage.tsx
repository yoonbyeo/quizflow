import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, ThumbsDown, RotateCcw, CheckCircle, Brain } from 'lucide-react';
import ImageZoom from '../components/ui/ImageZoom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { upsertSession, loadSession, deleteSession } from '../hooks/useStudySync';
import type { CardSet, Card } from '../types';

interface ReviewPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
  userId?: string;
}

interface ReviewCard extends Card {
  setTitle: string;
  setId: string;
}

const REVIEW_SET_ID = '00000000-0000-0000-0000-000000000000';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ReviewResult {
  date: string;
  done: number;
  correct: number;
}

function saveReviewResultLocal(result: ReviewResult) {
  try { localStorage.setItem('qf-review-result', JSON.stringify(result)); } catch {}
}
function loadReviewResultLocal(): ReviewResult | null {
  try {
    const v = localStorage.getItem('qf-review-result');
    if (!v) return null;
    const r: ReviewResult = JSON.parse(v);
    return r.date === todayKey() ? r : null;
  } catch { return null; }
}
function clearReviewResultLocal() {
  try { localStorage.removeItem('qf-review-result'); } catch {}
}

export default function ReviewPage({ cardSets, onUpdateStat, userId }: ReviewPageProps) {
  const navigate = useNavigate();
  const now = Date.now();

  const dueCards: ReviewCard[] = cardSets.flatMap(set =>
    set.cards
      .filter(card => {
        const stat = set.studyStats?.cardStats?.[card.id];
        if (!stat) return true;
        if (!stat.nextReview) return true;
        return stat.nextReview <= now;
      })
      .map(card => ({ ...card, setTitle: set.title, setId: set.id }))
  );

  // 완료 결과 초기화 — 로컬 먼저, Supabase로 보정
  const [completedResult, setCompletedResult] = useState<{ done: number; correct: number } | null>(() => {
    const local = loadReviewResultLocal();
    return local ? { done: local.done, correct: local.correct } : null;
  });
  const [cloudChecked, setCloudChecked] = useState(false);

  useEffect(() => {
    if (!userId || cloudChecked) return;
    setCloudChecked(true);
    loadSession(userId, REVIEW_SET_ID, 'review').then(session => {
      if (session && !session.completed) return; // 완료 안 됐으면 무시
      if (session && session.completed && session.progress.date === todayKey()) {
        const done = session.progress.done as number;
        const correct = session.progress.correct as number;
        // localStorage도 동기화
        saveReviewResultLocal({ date: todayKey(), done, correct });
        setCompletedResult({ done, correct });
      }
    });
  }, [userId, cloudChecked]);

  const [queue, setQueue] = useState<ReviewCard[]>(() => [...dueCards]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);

  const saveResult = (result: ReviewResult) => {
    saveReviewResultLocal(result);
    if (userId) {
      upsertSession(userId, REVIEW_SET_ID, 'review', { date: result.date, done: result.done, correct: result.correct }, true);
    }
  };

  const clearResult = () => {
    clearReviewResultLocal();
    if (userId) deleteSession(userId, REVIEW_SET_ID, 'review');
  };

  if (completedResult) {
    const pct = completedResult.done > 0 ? Math.round((completedResult.correct / completedResult.done) * 100) : 0;
    const handleRetry = () => {
      clearResult();
      setQueue([...dueCards]);
      setIdx(0);
      setDone(0);
      setCorrect(0);
      setFlipped(false);
      setCompletedResult(null);
    };
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Brain size={36} color={pct >= 70 ? 'var(--green)' : 'var(--blue)'} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>오늘 복습 완료!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6 }}>
          {completedResult.done}장 중 {completedResult.correct}장 정답 ({pct}%)
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
          내일 새로운 복습 카드가 준비됩니다.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {dueCards.length > 0 && (
            <button className="btn btn-secondary btn-md" onClick={handleRetry}>
              <RotateCcw size={15} /> 다시 복습하기
            </button>
          )}
          <button className="btn btn-primary btn-md" onClick={() => navigate('/')}>홈으로</button>
        </div>
      </div>
    );
  }

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

  if (done >= queue.length && done > 0) {
    const result = { date: todayKey(), done, correct };
    saveResult(result);
  }

  const card = queue[idx];
  if (!card) return null;

  const rate = async (isCorrect: boolean) => {
    await onUpdateStat(card.id, isCorrect);
    const newDone = done + 1;
    const newCorrect = isCorrect ? correct + 1 : correct;
    setDone(newDone);
    if (isCorrect) setCorrect(newCorrect);
    setIdx(i => i + 1);
    setFlipped(false);

    if (newDone >= queue.length) {
      const result = { date: todayKey(), done: newDone, correct: newCorrect };
      saveResult(result);
      setCompletedResult({ done: newDone, correct: newCorrect });
    }
  };

  const pct = Math.round((idx / queue.length) * 100);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> 홈
        </button>
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>오늘의 복습</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{queue.length}장 대기 중</div>
          </div>
          <InfoTooltip
            text={'간격 반복(Spaced Repetition) 알고리즘으로 선별된 카드입니다.\n\n• 알았어요 → 다음 복습 간격이 늘어납니다 (1일→3일→7일→14일→30일)\n• 몰랐어요 → 다음날 다시 복습합니다\n\n망각 곡선을 역이용해 최소한의 시간으로 장기 기억을 유지합니다.'}
            position="bottom" width={280} size={12} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{idx + 1} / {queue.length}</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="progress-track" style={{ height: 6 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue))', borderRadius: 99, transition: 'width .3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
          <span>{correct}개 정답</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>출처: {card.setTitle}</span>
        </div>
      </div>

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
