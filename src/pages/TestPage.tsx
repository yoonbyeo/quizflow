import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw, Settings } from 'lucide-react';
import { generateMultipleChoiceQuestion, generateWrittenQuestion, shuffleArray, checkWrittenAnswer } from '../utils';
import { saveLastMode } from './FlashcardPage';
import type { CardSet, TestQuestion, TestConfig } from '../types';

// ── localStorage 헬퍼 ──
function saveTestConfig(setId: string, cfg: TestConfig) {
  try { localStorage.setItem(`qf-testcfg-${setId}`, JSON.stringify(cfg)); } catch {}
}
function loadTestConfig(setId: string): TestConfig | null {
  try { const v = localStorage.getItem(`qf-testcfg-${setId}`); return v ? JSON.parse(v) : null; } catch { return null; }
}

export function saveTestProgress(setId: string, idx: number, total: number) {
  try { localStorage.setItem(`qf-testprog-${setId}`, JSON.stringify({ idx, total })); } catch {}
}
export function loadTestProgress(setId: string): { idx: number; total: number } | null {
  try { const v = localStorage.getItem(`qf-testprog-${setId}`); return v ? JSON.parse(v) : null; } catch { return null; }
}

export function saveTestCompleted(setId: string, done: boolean) {
  try { localStorage.setItem(`qf-completed-test-${setId}`, done ? '1' : '0'); } catch {}
}
export function loadTestCompleted(setId: string): boolean {
  try { return localStorage.getItem(`qf-completed-test-${setId}`) === '1'; } catch { return false; }
}

interface TestSession {
  questions: TestQuestion[];
  qIdx: number;
  score: number;
  answers: { q: string; correct: string; user: string; ok: boolean }[];
}
function saveTestSession(setId: string, session: TestSession) {
  try { localStorage.setItem(`qf-testsession-${setId}`, JSON.stringify(session)); } catch {}
}
function loadTestSession(setId: string): TestSession | null {
  try { const v = localStorage.getItem(`qf-testsession-${setId}`); return v ? JSON.parse(v) : null; } catch { return null; }
}
function clearTestSession(setId: string) {
  try { localStorage.removeItem(`qf-testsession-${setId}`); } catch {}
}

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

function buildQuestions(set: { cards: CardSet['cards'] }, config: TestConfig): TestQuestion[] {
  const shuffled = shuffleArray([...set.cards]).slice(0, config.questionCount);
  return shuffled.map((card, i) => {
    const canMC = config.includeMultipleChoice && set.cards.length >= 4;
    const canW = config.includeWritten;
    if (canMC && canW) return i % 2 === 0 ? generateMultipleChoiceQuestion(card, set.cards) : generateWrittenQuestion(card);
    if (canMC) return generateMultipleChoiceQuestion(card, set.cards);
    return generateWrittenQuestion(card);
  });
}

export default function TestPage({ cardSets, onUpdateStat }: TestPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const set = cardSets.find(s => s.id === id);
  const resume = searchParams.get('resume') === '1';

  // 모드 저장 (훅 밖이 아닌 effect에서)
  useEffect(() => {
    if (id) saveLastMode(id, 'test');
  }, [id]);

  // ── 모든 state를 최상단에 선언 (훅 규칙 준수) ──
  const [config, setConfig] = useState<TestConfig>(() => {
    if (id) { const saved = loadTestConfig(id); if (saved) return saved; }
    return DEFAULT_CONFIG;
  });

  const [screen, setScreen] = useState<'config' | 'quiz' | 'result'>('config');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; correct: string; user: string; ok: boolean }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [written, setWritten] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // ── resume 처리: set이 로드된 후 한 번만 실행 ──
  const resumeHandled = useRef(false);
  useEffect(() => {
    if (!resume || !id || !set || set.cards.length < 2 || resumeHandled.current) return;
    resumeHandled.current = true;

    const session = loadTestSession(id);
    if (session && session.questions.length > 0 && session.qIdx < session.questions.length) {
      setQuestions(session.questions);
      setQIdx(session.qIdx);
      setScore(session.score);
      setAnswers(session.answers);
      setSubmitted(false);
      setSelected(null);
      setWritten('');
      setCorrect(false);
      setScreen('quiz');
    } else {
      // 저장된 세션 없으면 설정으로 저장된 config로 새로 시작
      const cfg = loadTestConfig(id) ?? DEFAULT_CONFIG;
      const qs = buildQuestions(set, cfg);
      saveTestSession(id, { questions: qs, qIdx: 0, score: 0, answers: [] });
      setQuestions(qs);
      setQIdx(0);
      setScore(0);
      setAnswers([]);
      setSubmitted(false);
      setSelected(null);
      setWritten('');
      setCorrect(false);
      setScreen('quiz');
    }
  }, [resume, id, set]);

  // ── 키보드 단축키 (항상 등록, 내부에서 quiz 여부 확인) ──
  const stateRef = useRef({ submitted, correct, selected, written, questions, qIdx, score, answers, screen });
  useEffect(() => {
    stateRef.current = { submitted, correct, selected, written, questions, qIdx, score, answers, screen };
  });

  const submitRef = useRef<() => void>(() => {});
  const nextRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { screen: sc, submitted: sub, questions: qs, qIdx: qi } = stateRef.current;
      if (sc !== 'quiz' || qs.length === 0 || qi >= qs.length) return;

      const q = qs[qi];
      const isW = q.type === 'written';
      const target = e.target as HTMLElement;

      if (isW && target.tagName === 'INPUT' && e.key === 'Enter' && !sub && stateRef.current.written.trim()) {
        submitRef.current();
        return;
      }
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (sub) nextRef.current();
        else if (!isW && stateRef.current.selected) submitRef.current();
        return;
      }
      if (!isW && !sub) {
        const idx = ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase());
        if (idx >= 0 && idx < (q.options?.length ?? 0)) {
          e.preventDefault();
          setSelected(q.options![idx]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── 함수 정의 ──
  const startQuiz = useCallback(() => {
    if (!set) return;
    if (id) { saveTestConfig(id, config); clearTestSession(id); }
    const qs = buildQuestions(set, config);
    if (id) saveTestSession(id, { questions: qs, qIdx: 0, score: 0, answers: [] });
    setQuestions(qs);
    setQIdx(0);
    setSelected(null);
    setWritten('');
    setSubmitted(false);
    setCorrect(false);
    setScore(0);
    setAnswers([]);
    setScreen('quiz');
  }, [set, id, config]);

  const resetToConfig = useCallback(() => {
    setScreen('config');
    setQuestions([]);
    setQIdx(0);
    setScore(0);
    setAnswers([]);
    setShowReview(false);
    setSubmitted(false);
    setSelected(null);
    setWritten('');
    setCorrect(false);
    if (id) { saveTestCompleted(id, false); clearTestSession(id); }
  }, [id]);

  const submit = useCallback(async () => {
    const { submitted: sub, questions: qs, qIdx: qi, score: sc, answers: ans } = stateRef.current;
    if (sub || qs.length === 0 || qi >= qs.length) return;
    const q = qs[qi];
    const isW = q.type === 'written';
    const answer = isW ? stateRef.current.written : stateRef.current.selected ?? '';
    const isCorrect = isW ? checkWrittenAnswer(answer, q.correctAnswer) : answer === q.correctAnswer;

    setCorrect(isCorrect);
    setSubmitted(true);
    const newScore = isCorrect ? sc + 1 : sc;
    if (isCorrect) setScore(newScore);
    const newAnswers = [...ans, { q: q.question, correct: q.correctAnswer, user: answer, ok: isCorrect }];
    setAnswers(newAnswers);

    await onUpdateStat(q.cardId, isCorrect);
    if (id) {
      saveTestProgress(id, qi + 1, qs.length);
      saveTestSession(id, { questions: qs, qIdx: qi, score: newScore, answers: newAnswers });
    }
  }, [id, onUpdateStat]);

  const next = useCallback(() => {
    const { questions: qs, qIdx: qi, score: sc, answers: ans } = stateRef.current;
    if (qs.length === 0) return;
    if (qi + 1 >= qs.length) {
      setScreen('result');
      if (id) {
        saveTestProgress(id, qs.length, qs.length);
        saveTestCompleted(id, true);
        clearTestSession(id);
      }
      return;
    }
    const nextIdx = qi + 1;
    setQIdx(nextIdx);
    setSelected(null);
    setWritten('');
    setSubmitted(false);
    setCorrect(false);
    if (id) saveTestSession(id, { questions: qs, qIdx: nextIdx, score: sc, answers: ans });
  }, [id]);

  // ref 최신화
  useEffect(() => { submitRef.current = submit; }, [submit]);
  useEffect(() => { nextRef.current = next; }, [next]);

  // ── 렌더링 ──
  if (!set || set.cards.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>테스트하려면 카드가 2개 이상 필요합니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  // ── Config 화면 ──
  if (screen === 'config') {
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
              <input type="range" min={2} max={maxQ} value={Math.min(config.questionCount, maxQ)}
                onChange={e => setConfig(c => ({ ...c, questionCount: +e.target.value }))}
                style={{ flex: 1, accentColor: 'var(--blue)' }} />
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', minWidth: 32, textAlign: 'center' }}>
                {Math.min(config.questionCount, maxQ)}
              </span>
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

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>문제 유형</label>
            {[
              { key: 'includeMultipleChoice', label: '객관식', sub: '보기 중 선택', disabled: set.cards.length < 4, disabledMsg: '카드 4개 이상 필요' },
              { key: 'includeWritten', label: '주관식', sub: '직접 입력', disabled: false, disabledMsg: '' },
            ].map(({ key, label, sub, disabled, disabledMsg }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8, background: 'var(--bg-2)', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, border: `1px solid ${(config as any)[key] && !disabled ? 'var(--blue)' : 'var(--border)'}` }}>
                <input type="checkbox" checked={(config as any)[key] && !disabled} disabled={disabled}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{disabled ? disabledMsg : sub}</div>
                </div>
              </label>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startQuiz}
            disabled={!config.includeMultipleChoice && !config.includeWritten}>
            테스트 시작
          </button>
        </div>
      </div>
    );
  }

  // ── Result 화면 ──
  if (screen === 'result') {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
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
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => setShowReview(v => !v)}>
            {showReview ? '답안 숨기기' : '답안 검토'}
          </button>
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={resetToConfig}>
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

  // ── Quiz 화면 ──
  if (questions.length === 0 || screen !== 'quiz') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (qIdx >= questions.length) return null;

  const q = questions[qIdx];
  const isWritten = q.type === 'written';
  const progressPct = Math.round((qIdx / questions.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={resetToConfig} style={{ gap: 4 }}>
          <Settings size={14} /> 설정
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{qIdx + 1} / {questions.length}</span>
        <span style={{ fontSize: 13, color: 'var(--green)' }}>정답 {score}개</span>
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
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
            onKeyDown={e => { if (e.key === 'Enter' && !submitted && written.trim()) submit(); }}
            autoFocus />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(q.options ?? []).map((opt, i) => {
              let bg = 'var(--bg-2)', border = 'var(--border)', color = 'var(--text-1)';
              if (submitted) {
                if (opt === q.correctAnswer) { bg = 'var(--green-bg)'; border = 'rgba(63,185,80,.4)'; color = 'var(--green)'; }
                else if (opt === selected && opt !== q.correctAnswer) { bg = 'var(--red-bg)'; border = 'rgba(248,81,73,.4)'; color = 'var(--red)'; }
              } else if (opt === selected) {
                bg = 'var(--blue-bg)'; border = 'var(--blue)'; color = 'var(--blue)';
              }
              return (
                <button key={`${qIdx}-${i}`}
                  onClick={() => { if (!submitted) setSelected(opt); }}
                  disabled={submitted}
                  style={{ padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 10, cursor: submitted ? 'default' : 'pointer', color, fontWeight: 500, textAlign: 'left', fontSize: 14, transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${border}`, background: opt === selected || (submitted && opt === q.correctAnswer) ? 'transparent' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>
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

      {!submitted ? (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submit}
          disabled={isWritten ? !written.trim() : !selected}>
          제출
        </button>
      ) : (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={next}>
          {qIdx + 1 >= questions.length ? '결과 보기' : '다음 문제'} →
        </button>
      )}

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        {!isWritten && !submitted && [
          { key: 'A', desc: '1번' }, { key: 'B', desc: '2번' }, { key: 'C', desc: '3번' }, { key: 'D', desc: '4번' },
        ].map(({ key, desc }) => (
          <span key={key} style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 11 }}>{key}</kbd>
            {desc}
          </span>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <kbd style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 11 }}>Enter</kbd>
          {submitted ? '다음' : '제출'}
        </span>
      </div>
    </div>
  );
}
