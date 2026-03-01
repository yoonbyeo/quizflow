import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle, ChevronRight, BookOpen, Brain, RotateCcw, Filter, ClipboardList, ChevronLeft, CheckCircle, XCircle, Trophy, ArrowLeft } from 'lucide-react';
import ImageZoom from '../components/ui/ImageZoom';
import InfoTooltip from '../components/ui/InfoTooltip';
import { generateMultipleChoiceQuestion, generateWrittenQuestion, shuffleArray, checkWrittenAnswer } from '../utils';
import type { CardSet, Card, TestQuestion } from '../types';

interface WrongNotePageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

interface WrongCard {
  setId: string;
  setTitle: string;
  cardId: string;
  term: string;
  definition: string;
  imageUrl?: string;
  hint?: string;
  incorrect: number;
  correct: number;
  streak: number;
  difficulty: string;
}

type StudyMode = 'list' | 'flashcard' | 'quiz';

function wrongCardToCard(wc: WrongCard): Card {
  return {
    id: wc.cardId,
    term: wc.term,
    definition: wc.definition,
    hint: wc.hint,
    imageUrl: wc.imageUrl,
    createdAt: 0,
    updatedAt: 0,
  };
}

export default function WrongNotePage({ cardSets, onUpdateStat }: WrongNotePageProps) {
  const [filterSetId, setFilterSetId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'incorrect' | 'ratio'>('incorrect');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('list');

  // ── 플래시카드 state ──
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<WrongCard[]>([]);

  // ── 퀴즈 state ──
  const [quizQuestions, setQuizQuestions] = useState<TestQuestion[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [written, setWritten] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{ q: string; correct: string; user: string; ok: boolean }[]>([]);
  const [showReview, setShowReview] = useState(false);

  // ── 오답 카드 수집 ──
  const allWrongCards: WrongCard[] = [];
  for (const set of cardSets) {
    const stats = set.studyStats?.cardStats ?? {};
    for (const card of set.cards) {
      const stat = stats[card.id];
      if (stat && stat.incorrect > 0) {
        allWrongCards.push({
          setId: set.id,
          setTitle: set.title,
          cardId: card.id,
          term: card.term,
          definition: card.definition,
          imageUrl: card.imageUrl,
          hint: card.hint,
          incorrect: stat.incorrect,
          correct: stat.correct,
          streak: stat.streak,
          difficulty: stat.difficulty,
        });
      }
    }
  }

  const filtered = allWrongCards.filter(c => filterSetId === 'all' || c.setId === filterSetId);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'incorrect') return b.incorrect - a.incorrect;
    const ratioA = a.incorrect / Math.max(1, a.incorrect + a.correct);
    const ratioB = b.incorrect / Math.max(1, b.incorrect + b.correct);
    return ratioB - ratioA;
  });

  const setsWithErrors = cardSets.filter(s => {
    const stats = s.studyStats?.cardStats ?? {};
    return s.cards.some(c => stats[c.id]?.incorrect > 0);
  });

  const totalWrong = allWrongCards.length;
  const hardCards = allWrongCards.filter(c => c.incorrect >= 3).length;
  const canStudy = sorted.length >= 1;
  const canQuiz = sorted.length >= 2;

  // ── 플래시카드 시작 ──
  const startFlashcard = useCallback(() => {
    const cards = shuffleArray([...sorted]);
    setStudyCards(cards);
    setFlashIdx(0);
    setFlipped(false);
    setStudyMode('flashcard');
  }, [sorted]);

  // ── 퀴즈 시작 ──
  const startQuiz = useCallback(() => {
    const cards = shuffleArray([...sorted]);
    const allCards = cards.map(wrongCardToCard);
    const questions = cards.map((wc, i) => {
      const card = wrongCardToCard(wc);
      const canMC = allCards.length >= 4;
      if (canMC) return i % 2 === 0
        ? generateMultipleChoiceQuestion(card, allCards)
        : generateWrittenQuestion(card);
      return generateWrittenQuestion(card);
    });
    setStudyCards(cards);
    setQuizQuestions(questions);
    setQuizIdx(0);
    setSelected(null);
    setWritten('');
    setSubmitted(false);
    setCorrect(false);
    setQuizScore(0);
    setQuizAnswers([]);
    setShowReview(false);
    setStudyMode('quiz');
  }, [sorted]);

  // ── 퀴즈 제출 ──
  const stateRef = useRef({ submitted, correct, selected, written, quizQuestions, quizIdx, quizScore, quizAnswers });
  useEffect(() => {
    stateRef.current = { submitted, correct, selected, written, quizQuestions, quizIdx, quizScore, quizAnswers };
  });

  const submitQuiz = useCallback(async () => {
    const { submitted: sub, quizQuestions: qs, quizIdx: qi, quizScore: sc, quizAnswers: ans } = stateRef.current;
    if (sub || qs.length === 0 || qi >= qs.length) return;
    const q = qs[qi];
    const isW = q.type === 'written';
    const answer = isW ? stateRef.current.written : stateRef.current.selected ?? '';
    const isCorrect = isW ? checkWrittenAnswer(answer, q.correctAnswer) : answer === q.correctAnswer;

    setCorrect(isCorrect);
    setSubmitted(true);
    const newScore = isCorrect ? sc + 1 : sc;
    if (isCorrect) setQuizScore(newScore);
    setQuizAnswers([...ans, { q: q.question, correct: q.correctAnswer, user: answer, ok: isCorrect }]);
    await onUpdateStat(q.cardId, isCorrect);
  }, [onUpdateStat]);

  const nextQuiz = useCallback(() => {
    const { quizQuestions: qs, quizIdx: qi } = stateRef.current;
    if (qs.length === 0) return;
    if (qi + 1 >= qs.length) {
      setStudyMode('quiz'); // stays quiz but quizIdx === qs.length → result
    }
    setQuizIdx(qi + 1);
    setSelected(null);
    setWritten('');
    setSubmitted(false);
    setCorrect(false);
  }, []);

  // ── 키보드 단축키 (퀴즈) ──
  const submitRef = useRef<() => void>(() => {});
  const nextRef = useRef<() => void>(() => {});
  useEffect(() => { submitRef.current = submitQuiz; }, [submitQuiz]);
  useEffect(() => { nextRef.current = nextQuiz; }, [nextQuiz]);

  useEffect(() => {
    if (studyMode !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      const { submitted: sub, quizQuestions: qs, quizIdx: qi } = stateRef.current;
      if (qs.length === 0 || qi >= qs.length) return;
      const q = qs[qi];
      const isW = q.type === 'written';
      const target = e.target as HTMLElement;
      if (isW && target.tagName === 'INPUT' && e.key === 'Enter' && !sub && stateRef.current.written.trim()) {
        submitRef.current(); return;
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
  }, [studyMode]);

  // ── 플래시카드 모드 ──
  if (studyMode === 'flashcard') {
    const card = studyCards[flashIdx];
    const progressPct = Math.round(((flashIdx + 1) / studyCards.length) * 100);
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStudyMode('list')} style={{ gap: 6 }}>
            <ArrowLeft size={14} /> 오답 노트로
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{flashIdx + 1} / {studyCards.length}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setStudyCards(shuffleArray([...studyCards])); setFlashIdx(0); setFlipped(false); }}>
            셔플
          </button>
        </div>

        <div className="progress-track" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div
          onClick={() => setFlipped(f => !f)}
          style={{
            minHeight: 260, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 32, cursor: 'pointer', marginBottom: 20, boxShadow: 'var(--shadow-card)',
            transition: 'background .15s',
          }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>
            {flipped ? '정의' : '용어'}
          </div>
          {flipped ? (
            <div style={{ textAlign: 'center' }}>
              {card.imageUrl && <ImageZoom src={card.imageUrl} style={{ maxHeight: 140, borderRadius: 8, marginBottom: 12, objectFit: 'contain' }} />}
              <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)' }}>{card.definition}</p>
              {card.hint && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>힌트: {card.hint}</p>}
            </div>
          ) : (
            <p style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}>{card.term}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 16 }}>클릭하여 {flipped ? '용어' : '정의'} 보기</p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setFlashIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={flashIdx === 0}>
            <ChevronLeft size={16} /> 이전
          </button>
          {flashIdx + 1 >= studyCards.length ? (
            <button className="btn btn-primary btn-md" onClick={() => setStudyMode('list')}>
              완료 — 목록으로
            </button>
          ) : (
            <button className="btn btn-primary btn-md" onClick={() => { setFlashIdx(i => i + 1); setFlipped(false); }}>
              다음 <ChevronRight size={16} />
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
          {card.setTitle} · 오답 {card.incorrect}회
        </p>
      </div>
    );
  }

  // ── 퀴즈 결과 화면 ──
  if (studyMode === 'quiz' && quizIdx >= quizQuestions.length && quizQuestions.length > 0) {
    const pct = Math.round((quizScore / quizQuestions.length) * 100);
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={32} color={pct >= 70 ? 'var(--green)' : 'var(--red)'} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>오답 테스트 완료!</h2>
          <p style={{ color: 'var(--text-2)' }}>{quizQuestions.length}문제 중 {quizScore}개 정답</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-value" style={{ color: pct >= 70 ? 'var(--green)' : 'var(--red)' }}>{pct}%</div><div className="stat-label">정답률</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{quizScore}</div><div className="stat-label">정답</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--red)' }}>{quizQuestions.length - quizScore}</div><div className="stat-label">오답</div></div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={() => setShowReview(v => !v)}>
            {showReview ? '답안 숨기기' : '답안 검토'}
          </button>
          <button className="btn btn-secondary btn-md" style={{ flex: 1 }} onClick={startQuiz}>
            <RotateCcw size={14} /> 다시 풀기
          </button>
          <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={() => setStudyMode('list')}>
            목록으로
          </button>
        </div>

        {showReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quizAnswers.map((a, i) => (
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

  // ── 퀴즈 진행 화면 ──
  if (studyMode === 'quiz' && quizQuestions.length > 0 && quizIdx < quizQuestions.length) {
    const q = quizQuestions[quizIdx];
    const isWritten = q.type === 'written';
    const progressPct = Math.round((quizIdx / quizQuestions.length) * 100);

    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStudyMode('list')} style={{ gap: 4 }}>
            <ArrowLeft size={14} /> 목록으로
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{quizIdx + 1} / {quizQuestions.length}</span>
          <span style={{ fontSize: 13, color: 'var(--green)' }}>정답 {quizScore}개</span>
        </div>

        <div className="progress-track" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className={`badge ${isWritten ? 'badge-purple' : 'badge-blue'}`}>{isWritten ? '주관식' : '객관식'}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>오답 노트 테스트</span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>문제</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.4 }}>{q.question}</h2>

          {isWritten ? (
            <input type="text" className="input" placeholder="답을 입력하세요..." value={written}
              onChange={e => setWritten(e.target.value)} disabled={submitted}
              onKeyDown={e => { if (e.key === 'Enter' && !submitted && written.trim()) submitQuiz(); }}
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
                  <button key={`${quizIdx}-${i}`}
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
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submitQuiz}
            disabled={isWritten ? !written.trim() : !selected}>
            제출
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={nextQuiz}>
            {quizIdx + 1 >= quizQuestions.length ? '결과 보기' : '다음 문제'} →
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

  // ── 목록 화면 ──
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <AlertCircle size={20} color="var(--red)" />
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>오답 노트</h1>
          <InfoTooltip
            text={'학습하기·테스트·쓰기 모드에서 한 번이라도 틀린 카드가 자동으로 기록됩니다.\n\n• 오답 횟수순 또는 오답률순으로 정렬할 수 있습니다.\n• 3회 이상 틀린 카드는 "집중 필요" 카드로 표시됩니다.\n• 필터 후 학습/테스트 버튼으로 오답 카드만 집중 학습할 수 있습니다.'}
            position="right" width={270} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>자주 틀리는 카드를 모아 집중 학습하세요</p>
      </div>

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--red)', fontSize: 24 }}>{totalWrong}</div>
          <div className="stat-label">오답 카드</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--yellow)', fontSize: 24 }}>{hardCards}</div>
          <div className="stat-label">3회 이상 오답</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--blue)', fontSize: 24 }}>{setsWithErrors.length}</div>
          <div className="stat-label">관련 세트</div>
        </div>
      </div>

      {totalWrong === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 72, height: 72, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <RotateCcw size={28} color="var(--green)" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>오답이 없습니다!</p>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>학습 모드에서 문제를 풀면 오답이 기록됩니다</p>
        </div>
      ) : (
        <>
          {/* 필터 & 정렬 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={14} color="var(--text-3)" />
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
              value={filterSetId} onChange={e => setFilterSetId(e.target.value)}>
              <option value="all">전체 세트</option>
              {setsWithErrors.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select className="input" style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
              value={sortBy} onChange={e => setSortBy(e.target.value as 'incorrect' | 'ratio')}>
              <option value="incorrect">오답 횟수순</option>
              <option value="ratio">오답률순</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-2)' }}>{sorted.length}개</span>
          </div>

          {/* 학습/테스트 시작 버튼 */}
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                {filterSetId === 'all' ? `전체 오답 카드 ${sorted.length}개` : `"${setsWithErrors.find(s => s.id === filterSetId)?.title}" 오답 ${sorted.length}개`}로 학습
              </div>
              {!canStudy && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>오답 카드가 1개 이상이어야 학습을 시작할 수 있어요</div>}
              {canStudy && !canQuiz && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>테스트는 2개 이상의 오답 카드가 필요합니다</div>}
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={startFlashcard}
              disabled={!canStudy}
              style={{ gap: 6, opacity: canStudy ? 1 : 0.4, cursor: canStudy ? 'pointer' : 'not-allowed' }}>
              <Brain size={13} /> 학습 시작
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={startQuiz}
              disabled={!canQuiz}
              style={{ gap: 6, opacity: canQuiz ? 1 : 0.4, cursor: canQuiz ? 'pointer' : 'not-allowed' }}>
              <ClipboardList size={13} /> 테스트 시작
            </button>
          </div>

          {/* 카드 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(c => {
              const total = c.incorrect + c.correct;
              const ratio = Math.round((c.incorrect / total) * 100);
              const isOpen = expanded === c.cardId;

              return (
                <div key={c.cardId} className="card" style={{ padding: 0, overflow: 'hidden', border: c.incorrect >= 3 ? '1px solid rgba(248,81,73,.25)' : '1px solid var(--border)' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.cardId)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div style={{ minWidth: 44, height: 44, borderRadius: 10, background: c.incorrect >= 3 ? 'var(--red-bg)' : 'var(--yellow-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: c.incorrect >= 3 ? 'var(--red)' : 'var(--yellow)', lineHeight: 1 }}>{c.incorrect}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>오답</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.term}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.setTitle}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ratio >= 60 ? 'var(--red)' : 'var(--yellow)' }}>{ratio}%</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.correct}정 / {c.incorrect}오</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-3)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--bg-2)' }}>
                      {c.imageUrl && (
                        <ImageZoom src={c.imageUrl} style={{ maxHeight: 120, borderRadius: 8, marginBottom: 12, objectFit: 'contain' }} />
                      )}
                      <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>정답 (정의)</div>
                        <p style={{ fontSize: 14, lineHeight: 1.5 }}>{c.definition}</p>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                          <span>정답률</span><span>{100 - ratio}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${100 - ratio}%`, background: 'linear-gradient(90deg, var(--green), var(--blue))', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setExpanded(null); }} style={{ gap: 4 }}>
                          <BookOpen size={12} /> 닫기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
