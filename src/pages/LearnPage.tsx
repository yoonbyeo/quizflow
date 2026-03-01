import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw, Brain } from 'lucide-react';
import { shuffleArray, checkWrittenAnswer } from '../utils';
import type { CardSet, CardStat } from '../types';

interface LearnPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

type Phase = 'flashcard' | 'written' | 'done';

export default function LearnPage({ cardSets, onUpdateStat }: LearnPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  // Sort cards: hard/unrated first, then medium, then easy
  const sortedCards = useMemo(() => {
    if (!set) return [];
    const priority = (c: CardStat | undefined) => {
      if (!c || c.difficulty === 'unrated') return 0;
      if (c.difficulty === 'hard') return 1;
      if (c.difficulty === 'medium') return 2;
      return 3;
    };
    return shuffleArray([...set.cards]).sort((a, b) =>
      priority(set.studyStats?.cardStats?.[a.id] as CardStat | undefined) -
      priority(set.studyStats?.cardStats?.[b.id] as CardStat | undefined)
    );
  }, [set]);

  const [phase, setPhase] = useState<Phase>('flashcard');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState<boolean[]>([]);
  const [writtenScore, setWrittenScore] = useState(0);
  const [writtenTotal, setWrittenTotal] = useState(0);

  if (!set || sortedCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>카드가 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const card = sortedCards[idx];
  const totalCards = sortedCards.length;
  const pct = Math.round((idx / totalCards) * 100);

  // Phase 1: Flashcard review
  const rateFlash = async (knew: boolean) => {
    setFlashCorrect(prev => [...prev, knew]);
    await onUpdateStat(card.id, knew);
    if (idx + 1 >= totalCards) {
      setPhase('written');
      setIdx(0);
      setFlipped(false);
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  };

  // Phase 2: Written
  const submitWritten = async () => {
    const isCorrect = checkWrittenAnswer(input, card.definition);
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) setWrittenScore(s => s + 1);
    setWrittenTotal(t => t + 1);
    await onUpdateStat(card.id, isCorrect);
  };

  const nextWritten = () => {
    if (idx + 1 >= totalCards) { setPhase('done'); return; }
    setIdx(i => i + 1); setInput(''); setSubmitted(false);
  };

  // Done
  if (phase === 'done') {
    const flashKnew = flashCorrect.filter(Boolean).length;
    const flashPct = Math.round((flashKnew / totalCards) * 100);
    const writePct = writtenTotal > 0 ? Math.round((writtenScore / writtenTotal) * 100) : 0;
    const overall = Math.round((flashPct + writePct) / 2);
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: overall >= 70 ? 'var(--green-bg)' : 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={32} color={overall >= 70 ? 'var(--green)' : 'var(--blue)'} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>학습 완료!</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>오늘의 학습 세션이 끝났습니다</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--blue)', fontSize: 22 }}>{flashPct}%</div><div className="stat-label">플래시카드</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--purple)', fontSize: 22 }}>{writePct}%</div><div className="stat-label">쓰기</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: overall >= 70 ? 'var(--green)' : 'var(--yellow)', fontSize: 22 }}>{overall}%</div><div className="stat-label">종합</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setPhase('flashcard'); setIdx(0); setFlipped(false); setFlashCorrect([]); setWrittenScore(0); setWrittenTotal(0); }}>
            <RotateCcw size={15} /> 다시
          </button>
          <button className="btn btn-primary btn-md" onClick={() => navigate(`/set/${id}`)}>세트로</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="var(--purple)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>
            {phase === 'flashcard' ? '1단계: 플래시카드' : '2단계: 쓰기 연습'}
          </span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{idx + 1} / {totalCards}</span>
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['flashcard', 'written'] as Phase[]).map((p, i) => (
          <div key={p} style={{ flex: 1, height: 4, borderRadius: 99, background: phase === p ? 'var(--purple)' : (i === 0 && phase === 'written') ? 'var(--green)' : 'var(--bg-3)', transition: 'background .3s' }} />
        ))}
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue))' }} />
      </div>

      {/* Flashcard phase */}
      {phase === 'flashcard' && (
        <>
          <div className="flip-card" style={{ height: 300, cursor: 'pointer', marginBottom: 20 }} onClick={() => setFlipped(f => !f)}>
            <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
              <div className="flip-front">
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>용어</div>
                <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4 }}>{card.term}</p>
                {card.imageUrl && <img src={card.imageUrl} style={{ marginTop: 12, maxHeight: 80, borderRadius: 6, objectFit: 'contain' }} />}
                {!flipped && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>클릭하여 정의 보기</p>}
              </div>
              <div className="flip-back">
                <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>정의</div>
                <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5 }}>{card.definition}</p>
              </div>
            </div>
          </div>
          {flipped ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger btn-md" style={{ flex: 1 }} onClick={() => rateFlash(false)}>
                <XCircle size={15} /> 몰랐어요
              </button>
              <button className="btn btn-secondary btn-md" style={{ flex: 1, color: 'var(--green)', borderColor: 'rgba(63,185,80,.3)' }} onClick={() => rateFlash(true)}>
                <CheckCircle size={15} /> 알았어요
              </button>
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>카드를 클릭해서 정의를 확인하세요</p>
          )}
        </>
      )}

      {/* Written phase */}
      {phase === 'written' && (
        <>
          <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>용어</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{card.term}</h2>
            {card.hint && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>힌트: {card.hint}</p>}
            <textarea className="input" rows={2} placeholder="정의를 입력하세요..." value={input}
              onChange={e => setInput(e.target.value)} disabled={submitted} autoFocus />
            {submitted && (
              <div className={`alert ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>
                {correct ? <CheckCircle size={15} /> : <XCircle size={15} />}
                <div>
                  <div style={{ fontWeight: 700 }}>{correct ? '정답!' : '틀렸습니다.'}</div>
                  {!correct && <div style={{ fontSize: 13 }}>정답: {card.definition}</div>}
                </div>
              </div>
            )}
          </div>
          {!submitted
            ? <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submitWritten} disabled={!input.trim()}>확인</button>
            : <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={nextWritten}>{idx + 1 >= totalCards ? '결과 보기' : '다음'} →</button>
          }
        </>
      )}
    </div>
  );
}
