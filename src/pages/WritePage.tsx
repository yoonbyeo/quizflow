import { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { shuffleArray, checkWrittenAnswer, cn } from '../utils';
import Button from '../components/ui/Button';
import type { Card } from '../types';

export default function WritePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cardSets, updateCardStat } = useStore();

  const set = cardSets.find((s) => s.id === id);
  const [cards, setCards] = useState<Card[]>(() => shuffleArray(set?.cards || []));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!set || set.cards.length === 0) { navigate(`/set/${id}`); return null; }

  const current = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;
  const correctCount = results.filter(Boolean).length;

  const handleSubmit = useCallback(() => {
    if (isAnswered || !input.trim()) return;
    const correct = checkWrittenAnswer(input, current.definition);
    setIsCorrect(correct);
    setIsAnswered(true);
    setResults((r) => [...r, correct]);
    updateCardStat(id!, current.id, correct);
  }, [isAnswered, input, current, id, updateCardStat]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setInput('');
      setIsAnswered(false);
      setIsCorrect(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setCompleted(true);
    }
  }, [currentIndex, cards.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isAnswered) handleSubmit();
      else handleNext();
    }
  };

  const handleReset = () => {
    setCards(shuffleArray(set.cards));
    setCurrentIndex(0);
    setInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setResults([]);
    setCompleted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (completed) {
    const accuracy = Math.round((correctCount / cards.length) * 100);
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="max-w-sm w-full mx-auto px-4 text-center">
          <div className="glass rounded-3xl p-10 card-glow">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">완료!</h2>
            <p className={cn(
              'text-4xl font-black mb-2',
              accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {accuracy}%
            </p>
            <p className="text-slate-400 mb-8">{correctCount} / {cards.length} 정답</p>

            <div className="progress-bar mb-8">
              <div className="progress-fill" style={{ width: `${accuracy}%` }} />
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleReset} size="lg" className="w-full">
                <RotateCcw className="w-4 h-4" />
                다시 하기
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/set/${id}`)} className="w-full">
                세트로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/set/${id}`)} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>쓰기 연습</span>
              <span>{currentIndex + 1} / {cards.length}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button onClick={handleReset} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4 mb-6 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-4 h-4" /> {correctCount}
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <XCircle className="w-4 h-4" /> {results.length - correctCount}
          </span>
        </div>

        <div className="glass rounded-2xl p-8 card-glow mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">용어</p>
          <h2 className="text-2xl font-bold text-slate-100 mb-8 leading-snug">{current.term}</h2>

          {current.hint && (
            <p className="text-sm text-yellow-400/70 mb-4 flex items-start gap-1.5">
              <span className="text-yellow-400">💡</span>
              힌트: {current.hint}
            </p>
          )}

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => !isAnswered && setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="정의를 입력하세요..."
              disabled={isAnswered}
              autoFocus
              className={cn(
                'w-full px-4 py-4 rounded-xl border text-base transition-all focus:outline-none focus:ring-2',
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 focus:ring-emerald-500/20'
                    : 'border-red-500 bg-red-500/10 text-red-300 focus:ring-red-500/20'
                  : 'border-slate-700 bg-slate-800/60 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20'
              )}
            />
            {isAnswered && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isCorrect
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />
                }
              </div>
            )}
          </div>

          {isAnswered && !isCorrect && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-slate-400 mb-1">정답:</p>
              <p className="text-sm text-emerald-300 font-medium">{current.definition}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {!isAnswered ? (
            <Button onClick={handleSubmit} disabled={!input.trim()}>
              제출
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex < cards.length - 1 ? '다음' : '결과 보기'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-3">Enter로 제출 · 다음 이동</p>
      </div>
    </div>
  );
}
