import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { generateMultipleChoiceQuestion, generateWrittenQuestion, shuffleArray, checkWrittenAnswer } from '../utils';
import type { CardSet, TestQuestion } from '../types';

interface TestPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

export default function TestPage({ cardSets, onUpdateStat }: TestPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const questions = useMemo<TestQuestion[]>(() => {
    if (!set || set.cards.length < 2) return [];
    return shuffleArray(set.cards).map((card, i) =>
      i % 2 === 0 && set.cards.length >= 4
        ? generateMultipleChoiceQuestion(card, set.cards)
        : generateWrittenQuestion(card)
    );
  }, [set]);

  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [written, setWritten] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!set || set.cards.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>테스트하려면 카드가 2개 이상 필요합니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={32} color={pct >= 70 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>테스트 완료!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>{questions.length}문제 중 {score}개 정답</p>
        <div className="stat-card" style={{ marginBottom: 24 }}>
          <div className="stat-value" style={{ color: pct >= 70 ? 'var(--green)' : 'var(--red)' }}>{pct}%</div>
          <div className="stat-label">정답률</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setQIdx(0); setSelected(null); setWritten(''); setSubmitted(false); setScore(0); setFinished(false); }}>
            <RotateCcw size={15} /> 다시 풀기
          </button>
          <button className="btn btn-primary btn-md" onClick={() => navigate(`/set/${id}`)}>
            세트로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const q = questions[qIdx];
  const isWritten = q.type === 'written';

  const submit = async () => {
    const answer = isWritten ? written : selected ?? '';
    const isCorrect = isWritten ? checkWrittenAnswer(written, q.correctAnswer) : answer === q.correctAnswer;
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) setScore(s => s + 1);
    await onUpdateStat(q.cardId, isCorrect);
  };

  const next = () => {
    if (qIdx + 1 >= questions.length) { setFinished(true); return; }
    setQIdx(i => i + 1);
    setSelected(null);
    setWritten('');
    setSubmitted(false);
  };

  const pct = Math.round((qIdx / questions.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{qIdx + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Question */}
      <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span className={`badge ${isWritten ? 'badge-purple' : 'badge-blue'}`}>
            {isWritten ? '주관식' : '객관식'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>정답 {score}/{qIdx}</span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>용어</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, lineHeight: 1.4 }}>{q.question}</h2>

        {isWritten ? (
          <input
            type="text"
            className="input"
            placeholder="정의를 입력하세요..."
            value={written}
            onChange={e => setWritten(e.target.value)}
            disabled={submitted}
            onKeyDown={e => { if (e.key === 'Enter' && !submitted && written.trim()) submit(); }}
            autoFocus
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(q.options ?? []).map((opt: string, i: number) => {
              let bg = 'var(--bg-2)';
              let border = 'var(--border)';
              let color = 'var(--text-1)';
              if (submitted) {
                if (opt === q.correctAnswer) { bg = 'var(--green-bg)'; border = 'rgba(63,185,80,.4)'; color = 'var(--green)'; }
                else if (opt === selected) { bg = 'var(--red-bg)'; border = 'rgba(248,81,73,.4)'; color = 'var(--red)'; }
              } else if (opt === selected) { bg = 'var(--blue-bg)'; border = 'var(--blue)'; color = 'var(--blue)'; }

              return (
                <button
                  key={i}
                  onClick={() => !submitted && setSelected(opt)}
                  disabled={submitted}
                  style={{ padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 10, cursor: submitted ? 'default' : 'pointer', color, fontWeight: 500, textAlign: 'left', fontSize: 14, transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: border === 'var(--border)' ? 'var(--bg-3)' : border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className={`alert ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          {correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{correct ? '정답입니다!' : '틀렸습니다.'}</div>
            {!correct && <div style={{ fontSize: 13 }}>정답: {q.correctAnswer}</div>}
          </div>
        </div>
      )}

      {/* Actions */}
      {!submitted ? (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={submit}
          disabled={isWritten ? !written.trim() : !selected}
        >
          제출
        </button>
      ) : (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={next}>
          {qIdx + 1 >= questions.length ? '결과 보기' : '다음 문제'} →
        </button>
      )}
    </div>
  );
}
