import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw, Brain, AlertCircle } from 'lucide-react';
import { generateMultipleChoiceQuestion, shuffleArray, checkWrittenAnswer } from '../utils';
import type { CardSet, CardStat, TestQuestion } from '../types';

interface LearnPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

type Screen = 'config' | 'flash' | 'practice' | 'result';

interface LearnConfig {
  includeFlashcard: boolean;
  includeMultipleChoice: boolean;
  includeWritten: boolean;
}

interface PracticeItem {
  card: CardSet['cards'][0];
  type: 'mc' | 'written';
  mcQuestion: TestQuestion | null; // 미리 생성해서 고정
}

export default function LearnPage({ cardSets, onUpdateStat }: LearnPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  const [config, setConfig] = useState<LearnConfig>({
    includeFlashcard: true,
    includeMultipleChoice: true,
    includeWritten: true,
  });
  const [screen, setScreen] = useState<Screen>('config');
  const [sortedCards, setSortedCards] = useState<CardSet['cards']>([]);

  // Flash state
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashResults, setFlashResults] = useState<boolean[]>([]);
  const [flashScore, setFlashScore] = useState(0);

  // Practice state — 미리 생성된 문제 배열
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  // 현재 풀어야 할 큐 (틀리면 다시 뒤에 추가)
  const [practiceQueue, setPracticeQueue] = useState<number[]>([]); // practiceItems 인덱스
  const [queuePos, setQueuePos] = useState(0); // 큐에서 현재 위치
  const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set()); // 맞춘 item 인덱스

  const [selected, setSelected] = useState<string | null>(null);
  const [written, setWritten] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);

  if (!set || set.cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>카드가 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const buildSorted = (): CardSet['cards'] => {
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
  };

  // 문제 목록을 미리 생성 (보기 순서 고정)
  const buildPracticeItems = (cards: CardSet['cards']): PracticeItem[] => {
    return cards.map((card, i) => {
      const canMC = config.includeMultipleChoice && set.cards.length >= 4;
      const canW = config.includeWritten;
      let type: 'mc' | 'written' = 'written';
      if (canMC && canW) type = i % 2 === 0 ? 'mc' : 'written';
      else if (canMC) type = 'mc';
      else type = 'written';

      return {
        card,
        type,
        mcQuestion: type === 'mc' ? generateMultipleChoiceQuestion(card, set.cards) : null,
      };
    });
  };

  const startLearn = () => {
    const cards = buildSorted();
    setSortedCards(cards);
    setFlashResults([]);
    setFlashScore(0);
    setPracticeScore(0);
    setFlipped(false);
    setFlashIdx(0);
    setSubmitted(false);
    setSelected(null);
    setWritten('');
    setMasteredSet(new Set());

    if (config.includeFlashcard) {
      setScreen('flash');
    } else {
      const items = buildPracticeItems(cards);
      const queue = items.map((_, i) => i);
      setPracticeItems(items);
      setPracticeQueue(queue);
      setQueuePos(0);
      setScreen('practice');
    }
  };

  const goToPractice = (cards: CardSet['cards']) => {
    if (!config.includeMultipleChoice && !config.includeWritten) {
      setScreen('result');
      return;
    }
    const items = buildPracticeItems(cards);
    const queue = items.map((_, i) => i);
    setPracticeItems(items);
    setPracticeQueue(queue);
    setQueuePos(0);
    setSubmitted(false);
    setSelected(null);
    setWritten('');
    setScreen('practice');
  };

  // ── Config ──
  if (screen === 'config') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ marginBottom: 20, gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <div className="card card-glow" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Brain size={20} color="var(--purple)" />
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>학습하기 설정</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>어려운 카드 우선 · 틀리면 다시 풀기</p>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>학습 단계</label>

          {[
            { key: 'includeFlashcard', label: '플래시카드', sub: '카드 보며 알고 있는지 확인', disabled: false },
            { key: 'includeMultipleChoice', label: '객관식', sub: '보기 중 정답 선택', disabled: set.cards.length < 4, disabledMsg: '카드 4개 이상 필요' },
            { key: 'includeWritten', label: '주관식', sub: '직접 정의 입력', disabled: false },
          ].map(({ key, label, sub, disabled, disabledMsg }: any) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8, background: 'var(--bg-2)', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, border: `1px solid ${(config as any)[key] && !disabled ? 'var(--purple)' : 'var(--border)'}` }}>
              <input type="checkbox" checked={(config as any)[key] && !disabled} disabled={disabled}
                onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--purple)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{disabled ? disabledMsg : sub}</div>
              </div>
            </label>
          ))}

          <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={14} />
            틀린 카드는 다시 큐에 추가되어 반복 출제됩니다
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}
            onClick={startLearn}
            disabled={!config.includeFlashcard && !config.includeMultipleChoice && !config.includeWritten}>
            학습 시작
          </button>
        </div>
      </div>
    );
  }

  // ── Flash phase ──
  if (screen === 'flash') {
    const card = sortedCards[flashIdx];
    if (!card) return null;
    const total = sortedCards.length;

    const rateFlash = async (knew: boolean) => {
      const newResults = [...flashResults, knew];
      setFlashResults(newResults);
      await onUpdateStat(card.id, knew);
      if (flashIdx + 1 >= total) {
        setFlashScore(newResults.filter(Boolean).length);
        goToPractice(sortedCards);
      } else {
        setFlashIdx(i => i + 1);
        setFlipped(false);
      }
    };

    const pct = Math.round((flashIdx / total) * 100);

    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
            <ChevronLeft size={15} /> {set.title}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="var(--purple)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>1단계: 플래시카드</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{flashIdx + 1} / {total}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--purple)' }} />
          {(config.includeMultipleChoice || config.includeWritten) && (
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--bg-3)' }} />
          )}
        </div>
        <div className="progress-track" style={{ marginBottom: 24 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue))' }} />
        </div>

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
      </div>
    );
  }

  // ── Practice phase ──
  if (screen === 'practice') {
    // 현재 큐에서 풀어야 할 아이템 인덱스
    const currentItemIdx = practiceQueue[queuePos];
    if (currentItemIdx === undefined) {
      // 큐 소진 = 완료
      setScreen('result');
      return null;
    }

    const item = practiceItems[currentItemIdx];
    const { card, type, mcQuestion } = item;
    const isMC = type === 'mc';
    const total = practiceItems.length; // 원래 카드 수 (진행도 기준)
    const mastered = masteredSet.size;
    const pct = Math.round((mastered / total) * 100);

    const submitPractice = async () => {
      if (submitted) return;
      let isCorrect = false;
      if (isMC) {
        isCorrect = selected === (mcQuestion?.correctAnswer ?? '');
      } else {
        isCorrect = checkWrittenAnswer(written, card.definition);
      }
      setCorrect(isCorrect);
      setSubmitted(true);
      await onUpdateStat(card.id, isCorrect);
      if (isCorrect) {
        setPracticeScore(s => s + 1);
        setMasteredSet(prev => new Set([...prev, currentItemIdx]));
      }
    };

    const nextPractice = () => {
      if (correct) {
        // 맞았으면 단순히 다음으로
        setQueuePos(p => p + 1);
      } else {
        // 틀렸으면 큐 끝에 다시 추가
        setPracticeQueue(q => [...q, currentItemIdx]);
        setQueuePos(p => p + 1);
      }
      setSelected(null);
      setWritten('');
      setSubmitted(false);
      setCorrect(false);

      // 다음 위치에서 큐 소진 체크
      const nextPos = queuePos + 1;
      if (nextPos >= practiceQueue.length + (correct ? 0 : 0)) {
        // 큐가 끝났는지는 다음 렌더에서 체크
      }
    };

    const stepLabel = config.includeFlashcard
      ? `2단계: ${isMC ? '객관식' : '주관식'} 연습`
      : `${isMC ? '객관식' : '주관식'} 연습`;

    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
            <ChevronLeft size={15} /> {set.title}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="var(--purple)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>{stepLabel}</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{mastered} / {total} 숙달</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {config.includeFlashcard && <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--green)' }} />}
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--purple)' }} />
        </div>

        {/* 진행도: 맞은 카드 수 기준 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
            <span>숙달 진행도</span>
            <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue))' }} />
          </div>
          {practiceQueue.length - queuePos > total && (
            <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={11} /> 틀린 카드 {practiceQueue.length - queuePos - (total - mastered)}개가 다시 출제됩니다
            </div>
          )}
        </div>

        <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${isMC ? 'badge-blue' : 'badge-purple'}`}>{isMC ? '객관식' : '주관식'}</span>
            {!correct && submitted && <span className="badge badge-red">다시 출제됩니다</span>}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>용어</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, lineHeight: 1.4 }}>{card.term}</h2>
          {card.imageUrl && <img src={card.imageUrl} style={{ maxHeight: 100, borderRadius: 8, marginBottom: 16, objectFit: 'contain' }} />}

          {isMC && mcQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(mcQuestion.options ?? []).map((opt, i) => {
                let bg = 'var(--bg-2)', border = 'var(--border)', color = 'var(--text-1)';
                if (submitted) {
                  if (opt === mcQuestion.correctAnswer) { bg = 'var(--green-bg)'; border = 'rgba(63,185,80,.4)'; color = 'var(--green)'; }
                  else if (opt === selected && opt !== mcQuestion.correctAnswer) { bg = 'var(--red-bg)'; border = 'rgba(248,81,73,.4)'; color = 'var(--red)'; }
                } else if (opt === selected) {
                  bg = 'var(--blue-bg)'; border = 'var(--blue)'; color = 'var(--blue)';
                }
                return (
                  <button key={`${mcQuestion.id}-${i}`}
                    onClick={() => { if (!submitted) setSelected(opt); }}
                    disabled={submitted}
                    style={{ padding: '13px 16px', background: bg, border: `1px solid ${border}`, borderRadius: 10, cursor: submitted ? 'default' : 'pointer', color, fontWeight: 500, textAlign: 'left', fontSize: 14, transition: 'all .12s', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {card.hint && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>힌트: {card.hint}</p>}
              <textarea className="input" rows={2} placeholder="정의를 입력하세요..." value={written}
                onChange={e => setWritten(e.target.value)} disabled={submitted} autoFocus />
            </>
          )}
        </div>

        {submitted && (
          <div className={`alert ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
            {correct ? <CheckCircle size={15} /> : <XCircle size={15} />}
            <div>
              <div style={{ fontWeight: 700 }}>{correct ? '정답! 숙달 완료' : '틀렸습니다. 다시 출제될 예정입니다.'}</div>
              {!correct && <div style={{ fontSize: 13 }}>정답: {isMC ? mcQuestion?.correctAnswer : card.definition}</div>}
            </div>
          </div>
        )}

        {!submitted ? (
          <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}
            onClick={submitPractice} disabled={isMC ? !selected : !written.trim()}>확인</button>
        ) : (
          <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}
            onClick={nextPractice}>
            {mastered >= total ? '결과 보기' : correct ? '다음 →' : '다시 시도 →'}
          </button>
        )}
      </div>
    );
  }

  // ── Result ──
  if (screen === 'result') {
    const flashTotal = config.includeFlashcard ? sortedCards.length : 0;
    const practiceTotal = practiceItems.length;
    const flashPct = flashTotal > 0 ? Math.round((flashScore / flashTotal) * 100) : null;
    const practicePct = practiceTotal > 0 ? Math.round((practiceScore / practiceTotal) * 100) : null;
    const vals = [flashPct, practicePct].filter(v => v !== null) as number[];
    const avgPct = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: avgPct >= 70 ? 'var(--green-bg)' : 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={32} color={avgPct >= 70 ? 'var(--green)' : 'var(--blue)'} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>학습 완료!</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>모든 카드를 숙달했습니다</p>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vals.length + 1}, 1fr)`, gap: 12, marginBottom: 24 }}>
          {flashPct !== null && <div className="stat-card"><div className="stat-value" style={{ color: 'var(--blue)', fontSize: 22 }}>{flashPct}%</div><div className="stat-label">플래시카드</div></div>}
          {practicePct !== null && <div className="stat-card"><div className="stat-value" style={{ color: 'var(--purple)', fontSize: 22 }}>{practicePct}%</div><div className="stat-label">연습</div></div>}
          <div className="stat-card"><div className="stat-value" style={{ color: avgPct >= 70 ? 'var(--green)' : 'var(--yellow)', fontSize: 22 }}>{avgPct}%</div><div className="stat-label">종합</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => setScreen('config')}><RotateCcw size={15} /> 다시</button>
          <button className="btn btn-primary btn-md" onClick={() => navigate(`/set/${id}`)}>세트로</button>
        </div>
      </div>
    );
  }

  return null;
}
