import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, ChevronRight,
  Settings, RotateCcw, Trophy, Target
} from 'lucide-react';
import { shuffleArray, generateMultipleChoiceQuestion, generateWrittenQuestion, checkWrittenAnswer, cn } from '../utils';
import Button from '../components/ui/Button';
import type { TestQuestion, CardSet } from '../types';

interface TestPageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

interface TestConfig {
  questionCount: number;
  questionTypes: ('multiple-choice' | 'written')[];
  questionMode: 'term' | 'definition' | 'mixed';
  shuffleCards: boolean;
}

export default function TestPage({ cardSets, onUpdateStat }: TestPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const set = cardSets.find((s) => s.id === id);
  const [phase, setPhase] = useState<'config' | 'test' | 'result'>('config');
  const [config, setConfig] = useState<TestConfig>({
    questionCount: Math.min(20, set?.cards.length || 0),
    questionTypes: ['multiple-choice', 'written'],
    questionMode: 'definition',
    shuffleCards: true,
  });
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Array<{ correct: boolean; userAnswer: string }>>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!set) { navigate('/'); return null; }

  const generateQuestions = () => {
    const cards = config.shuffleCards ? shuffleArray(set.cards) : set.cards;
    const selected = cards.slice(0, config.questionCount);
    const qs: TestQuestion[] = [];
    for (const card of selected) {
      const typeIdx = Math.floor(Math.random() * config.questionTypes.length);
      const type = config.questionTypes[typeIdx];
      const mode: 'term' | 'definition' = config.questionMode === 'mixed'
        ? (Math.random() > 0.5 ? 'term' : 'definition') : config.questionMode;
      if (type === 'multiple-choice' && set.cards.length >= 4) {
        qs.push(generateMultipleChoiceQuestion(card, set.cards, mode));
      } else {
        qs.push(generateWrittenQuestion(card, mode));
      }
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer('');
    setWrittenAnswer('');
    setIsAnswered(false);
    setStartTime(Date.now());
    setPhase('test');
  };

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const handleSubmit = () => {
    if (isAnswered) return;
    const userAns = currentQ.type === 'multiple-choice' ? selectedAnswer : writtenAnswer;
    if (!userAns.trim()) return;
    const correct = currentQ.type === 'multiple-choice'
      ? userAns === currentQ.correctAnswer
      : checkWrittenAnswer(userAns, currentQ.correctAnswer);
    onUpdateStat(currentQ.cardId, correct);
    setAnswers((prev) => [...prev, { correct, userAnswer: userAns }]);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer('');
      setWrittenAnswer('');
      setIsAnswered(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setElapsedTime(Date.now() - startTime);
      setPhase('result');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isAnswered) handleSubmit();
      else handleNext();
    }
  };

  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (phase === 'config') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-lg w-full mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(`/set/${id}`)} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">테스트 설정</h1>
              <p className="text-sm text-slate-400">{set.title}</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 card-glow space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                문제 수: <span className="text-blue-400 font-bold">{config.questionCount}개</span>
              </label>
              <input type="range" min={1} max={set.cards.length} value={config.questionCount}
                onChange={(e) => setConfig((c) => ({ ...c, questionCount: Number(e.target.value) }))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>{set.cards.length}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">문제 유형</label>
              <div className="flex flex-col gap-2">
                {[{ key: 'multiple-choice' as const, label: '객관식', desc: '4지선다형' }, { key: 'written' as const, label: '주관식', desc: '직접 입력' }].map(({ key, label, desc }) => (
                  <button key={key}
                    onClick={() => setConfig((c) => {
                      const types = c.questionTypes.includes(key) ? c.questionTypes.filter((t) => t !== key) : [...c.questionTypes, key];
                      return types.length > 0 ? { ...c, questionTypes: types } : c;
                    })}
                    className={cn('flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                      config.questionTypes.includes(key) ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                    )}>
                    <span className="font-medium">{label}</span>
                    <span className="text-xs opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">질문 방향</label>
              <div className="flex gap-2">
                {[{ key: 'definition' as const, label: '단어→뜻' }, { key: 'term' as const, label: '뜻→단어' }, { key: 'mixed' as const, label: '혼합' }].map(({ key, label }) => (
                  <button key={key} onClick={() => setConfig((c) => ({ ...c, questionMode: key }))}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all',
                      config.questionMode === key ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                    )}>{label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 font-medium">카드 순서 섞기</span>
              <button onClick={() => setConfig((c) => ({ ...c, shuffleCards: !c.shuffleCards }))}
                className={cn('relative w-11 h-6 rounded-full transition-all', config.shuffleCards ? 'bg-blue-500' : 'bg-slate-700')}>
                <div className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', config.shuffleCards && 'translate-x-5')} />
              </button>
            </div>
            <Button onClick={generateQuestions} size="lg" className="w-full">
              <Target className="w-5 h-5" /> 테스트 시작
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const grade = accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : accuracy >= 60 ? 'D' : 'F';
    const gradeColor = accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400';
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 card-glow mb-6 text-center">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-1">테스트 완료!</h2>
          <p className="text-slate-400 mb-6">결과를 확인하세요</p>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '등급', value: grade, color: gradeColor },
              { label: '정확도', value: `${accuracy}%`, color: accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400' },
              { label: '정답', value: correctCount, color: 'text-emerald-400' },
              { label: '소요시간', value: formatTime(elapsedTime), color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/60 rounded-2xl p-4">
                <div className={cn('text-2xl font-bold', color)}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${accuracy}%` }} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setPhase('config')} className="flex-1">
              <Settings className="w-4 h-4" /> 다시 설정
            </Button>
            <Button onClick={generateQuestions} className="flex-1">
              <RotateCcw className="w-4 h-4" /> 다시 풀기
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">답안 검토</h3>
          {questions.map((q, i) => {
            const ans = answers[i];
            if (!ans) return null;
            return (
              <div key={q.id} className={cn('glass rounded-xl p-4 flex items-start gap-3 border', ans.correct ? 'border-emerald-500/20' : 'border-red-500/20')}>
                {ans.correct ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 mb-1">{q.question}</p>
                  {!ans.correct && (
                    <>
                      <p className="text-xs text-red-400">내 답: {ans.userAnswer}</p>
                      <p className="text-xs text-emerald-400">정답: {q.correctAnswer}</p>
                    </>
                  )}
                  {ans.correct && <p className="text-xs text-emerald-400">✓ {q.correctAnswer}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/set/${id}`)} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400 font-medium">{currentIndex + 1} / {questions.length}</span>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="text-emerald-400 font-medium">{answers.filter(a => a.correct).length} 정답</span>
              <span className="text-red-400 font-medium">{answers.filter(a => !a.correct).length} 오답</span>
            </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 card-glow mb-4">
        <div className="mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-500/15 text-blue-400">
            {currentQ?.type === 'multiple-choice' ? '객관식' : '주관식'}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-100 leading-relaxed whitespace-pre-line mb-6">{currentQ?.question}</h2>
        {currentQ?.type === 'multiple-choice' ? (
          <div className="space-y-2">
            {currentQ.options?.map((opt: string) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQ.correctAnswer;
              let style = 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60';
              if (isAnswered) {
                if (isCorrect) style = 'border-emerald-500 bg-emerald-500/15 text-emerald-300';
                else if (isSelected && !isCorrect) style = 'border-red-500 bg-red-500/15 text-red-300';
              } else if (isSelected) {
                style = 'border-blue-500 bg-blue-500/15 text-blue-300';
              }
              return (
                <button key={opt} onClick={() => !isAnswered && setSelectedAnswer(opt)} disabled={isAnswered}
                  className={cn('w-full text-left px-4 py-3.5 rounded-xl border font-medium text-sm transition-all', style)}>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input ref={inputRef} type="text" value={writtenAnswer}
              onChange={(e) => !isAnswered && setWrittenAnswer(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="정답을 입력하세요..." disabled={isAnswered} autoFocus
              className={cn('w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2',
                isAnswered ? answers[answers.length - 1]?.correct
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 focus:ring-emerald-500/20'
                  : 'border-red-500 bg-red-500/10 text-red-300 focus:ring-red-500/20'
                : 'border-slate-700 bg-slate-800/40 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20'
              )} />
            {isAnswered && !answers[answers.length - 1]?.correct && (
              <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> 정답: {currentQ.correctAnswer}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {!isAnswered ? (
          <Button onClick={handleSubmit} disabled={currentQ?.type === 'multiple-choice' ? !selectedAnswer : !writtenAnswer.trim()}>
            제출 <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? '다음 문제' : '결과 보기'} <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-slate-600 mt-3">Enter로 제출 · 다음 이동</p>
    </div>
  );
}
