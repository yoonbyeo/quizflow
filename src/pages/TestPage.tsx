import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw, Settings } from 'lucide-react';
import { generateMultipleChoiceQuestion, generateWrittenQuestion, shuffleArray, checkWrittenAnswer } from '../utils';
import type { CardSet, TestQuestion, TestConfig } from '../types';

interface TestPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

const DEFAULT_CONFIG: TestConfig = {
  questionCount: 10,
  answerWith: 'both',
  includeMultipleChoice: true,
  includeWritten: true,
  includeTrueFalse: false,
};

export default function TestPage({ cardSets, onUpdateStat }: TestPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);
  const [configOpen, setConfigOpen] = useState(true);
  const [started, setStarted] = useState(false);

  const questions = useMemo<TestQuestion[]>(() => {
    if (!set || set.cards.length < 2 || !started) return [];
    const shuffled = shuffleArray([...set.cards]).slice(0, config.questionCount);
    return shuffled.map((card, i) => {
      const useWritten = config.includeWritten && (!config.includeMultipleChoice || i % 2 === 1);
      const useMC = config.includeMultipleChoice && set.cards.length >= 4;
      if (useWritten && !useMC) return generateWrittenQuestion(card);
      if (useMC && !useWritten) return generateMultipleChoiceQuestion(card, set.cards);
      return i % 2 === 0 ? generateMultipleChoiceQuestion(card, set.cards) : generateWrittenQuestion(card);
    });
  }, [set, config, started]);

  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [written, setWritten] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<{ q: string; correct: string; user: string; ok: boolean }[]>([]);
  const [showReview, setShowReview] = useState(false);

  if (!set || set.cards.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>테스트하려면 카드가 2개 이상 필요합니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  // Config screen
  if (configOpen && !started) {
    const maxQ = Math.min(set.cards.length, 20);
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ marginBottom: 20, gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <div className="card card-glow" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>테스트 구성하기</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
              문제 수 (최대 {maxQ})
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="range" min={2} max={maxQ} value={config.questionCount}
                onChange={e => setConfig(c => ({ ...c, questionCount: +e.target.value }))}
                style={{ flex: 1, accentColor: 'var(--blue)' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)', minWidth: 28, textAlign: 'center' }}>{config.questionCount}</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>답변 방식</label>
            <div className="tab-group">
              {[{ v: 'definition', l: '정의 쓰기' }, { v: 'term', l: '용어 쓰기' }, { v: 'both', l: '둘 다' }].map(({ v, l }) => (
                <button key={v} className={`tab-btn ${config.answerWith === v ? 'active' : ''}`}
                  onClick={() => setConfig(c => ({ ...c, answerWith: v as TestConfig['answerWith'] }))}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>문제 유형</label>
            {[
              { key: 'includeMultipleChoice', label: '객관식', disabled: set.cards.length < 4 },
              { key: 'includeWritten', label: '주관식 (단답형)', disabled: false },
            ].map(({ key, label, disabled }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
                <input type="checkbox" checked={(config as any)[key]} disabled={disabled}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue)' }} />
                <span style={{ fontSize: 14 }}>{label}</span>
                {disabled && <span className="badge badge-gray">카드 4개 이상 필요</span>}
              </label>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
            onClick={() => { setStarted(true); setConfigOpen(false); setQIdx(0); setScore(0); setFinished(false); setAnswers([]); }}
            disabled={!config.includeMultipleChoice && !config.includeWritten}>
            테스트 시작
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={32} color={pct >= 70 ? 'var(--green)' : 'var(--red)'} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>테스트 완료!</h2>
          <p style={{ color: 'var(--text-2)' }}>{questions.length}문제 중 {score}개 정답</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-value" style={{ color: pct >= 70 ? 'var(--green)' : 'var(--red)' }}>{pct}%</div><div className="stat-label">정답률</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{score}</div><div className="stat-label">정답</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--red)' }}>{questions.length - score}</div><div className="stat-label">오답</div></div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => setShowReview(!showReview)}>
            {showReview ? '답안 숨기기' : '답안 검토'}
          </button>
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => { setStarted(false); setConfigOpen(true); setFinished(false); setScore(0); setAnswers([]); }}>
            <RotateCcw size={15} /> 다시 설정
          </button>
          <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={() => navigate(`/set/${id}`)}>세트로</button>
        </div>

        {showReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.map((a, i) => (
              <div key={i} className="card" style={{ padding: '14px 18px', borderLeft: `3px solid ${a.ok ? 'var(--green)' : 'var(--red)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {a.ok ? <CheckCircle size={14} color="var(--green)" /> : <XCircle size={14} color="var(--red)" />}
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Q{i + 1}. {a.q}</span>
                </div>
                {!a.ok && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>내 답: <span style={{ color: 'var(--red)' }}>{a.user || '(미입력)'}</span></div>}
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>정답: <span style={{ color: 'var(--green)' }}>{a.correct}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const q = questions[qIdx];
  if (!q) return null;
  const isWritten = q.type === 'written';
  const pct = Math.round((qIdx / questions.length) * 100);

  const submit = async () => {
    const answer = isWritten ? written : selected ?? '';
    const isCorrect = isWritten ? checkWrittenAnswer(written, q.correctAnswer) : answer === q.correctAnswer;
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { q: q.question, correct: q.correctAnswer, user: answer, ok: isCorrect }]);
    await onUpdateStat(q.cardId, isCorrect);
  };

  const next = () => {
    if (qIdx + 1 >= questions.length) { setFinished(true); return; }
    setQIdx(i => i + 1); setSelected(null); setWritten(''); setSubmitted(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { setStarted(false); setConfigOpen(true); }} style={{ gap: 4 }}>
          <Settings size={14} /> 설정
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{qIdx + 1} / {questions.length}</span>
        <span style={{ fontSize: 13, color: 'var(--green)' }}>정답 {score}개</span>
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span className={`badge ${isWritten ? 'badge-purple' : 'badge-blue'}`}>{isWritten ? '주관식' : '객관식'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>정답 {score}/{qIdx}</span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>문제</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, lineHeight: 1.4 }}>{q.question}</h2>

        {isWritten ? (
          <input type="text" className="input" placeholder="답을 입력하세요..." value={written}
            onChange={e => setWritten(e.target.value)} disabled={submitted}
            onKeyDown={e => { if (e.key === 'Enter' && !submitted && written.trim()) submit(); }} autoFocus />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(q.options ?? []).map((opt, i) => {
              let bg = 'var(--bg-2)', border = 'var(--border)', color = 'var(--text-1)';
              if (submitted) {
                if (opt === q.correctAnswer) { bg = 'var(--green-bg)'; border = 'rgba(63,185,80,.4)'; color = 'var(--green)'; }
                else if (opt === selected) { bg = 'var(--red-bg)'; border = 'rgba(248,81,73,.4)'; color = 'var(--red)'; }
              } else if (opt === selected) { bg = 'var(--blue-bg)'; border = 'var(--blue)'; color = 'var(--blue)'; }
              return (
                <button key={i} onClick={() => !submitted && setSelected(opt)} disabled={submitted}
                  style={{ padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 10, cursor: submitted ? 'default' : 'pointer', color, fontWeight: 500, textAlign: 'left', fontSize: 14, transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: border === 'var(--border)' ? 'var(--bg-3)' : 'transparent', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {submitted && (
        <div className={`alert ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          {correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <div>
            <div style={{ fontWeight: 700 }}>{correct ? '정답입니다!' : '틀렸습니다.'}</div>
            {!correct && <div style={{ fontSize: 13 }}>정답: {q.correctAnswer}</div>}
          </div>
        </div>
      )}

      {!submitted
        ? <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submit} disabled={isWritten ? !written.trim() : !selected}>제출</button>
        : <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={next}>{qIdx + 1 >= questions.length ? '결과 보기' : '다음 문제'} →</button>
      }
    </div>
  );
}
