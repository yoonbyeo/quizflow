import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Shuffle, RotateCcw, ChevronLeft, ChevronRight,
  ThumbsUp, ThumbsDown, Eye, Lightbulb, CheckCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { shuffleArray, cn } from '../utils';
import Button from '../components/ui/Button';
import type { Card } from '../types';

export default function FlashcardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cardSets, updateCardStat } = useStore();

  const set = cardSets.find((s) => s.id === id);
  const [cards, setCards] = useState<Card[]>(() => set?.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [showDefinitionFirst, setShowDefinitionFirst] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!set) navigate('/');
  }, [set, navigate]);

  const current = cards[currentIndex];
  const progress = currentIndex / cards.length;
  const knownCount = Object.values(results).filter(Boolean).length;
  const unknownCount = Object.values(results).filter((v) => !v).length;

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
    setShowHint(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  }, [flipCard, currentIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setCompleted(true);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleRate = (known: boolean) => {
    if (!current) return;
    setResults((r) => ({ ...r, [current.id]: known }));
    updateCardStat(id!, current.id, known);
    goNext();
  };

  const handleShuffle = () => {
    const shuffled = shuffleArray(cards);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsShuffled(true);
    setCompleted(false);
  };

  const handleReset = () => {
    setCards(set?.cards || []);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsShuffled(false);
    setCompleted(false);
  };

  const handleStudyUnknown = () => {
    const unknown = cards.filter((c) => results[c.id] === false);
    if (unknown.length > 0) {
      setCards(unknown);
      setCurrentIndex(0);
      setIsFlipped(false);
      setResults({});
      setCompleted(false);
    }
  };

  if (!set || cards.length === 0) return null;

  if (completed) {
    const accuracy = knownCount / cards.length * 100;
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-4 text-center">
          <div className="glass rounded-3xl p-10 card-glow">
            <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">완료!</h2>
            <p className="text-slate-400 mb-8">{cards.length}개 카드를 모두 학습했습니다</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/60 rounded-2xl p-4">
                <div className="text-2xl font-bold text-slate-100">{cards.length}</div>
                <div className="text-xs text-slate-500 mt-1">전체</div>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-4">
                <div className="text-2xl font-bold text-emerald-400">{knownCount}</div>
                <div className="text-xs text-slate-500 mt-1">알아요</div>
              </div>
              <div className="bg-red-500/10 rounded-2xl p-4">
                <div className="text-2xl font-bold text-red-400">{unknownCount}</div>
                <div className="text-xs text-slate-500 mt-1">모르겠어요</div>
              </div>
            </div>

            <div className="progress-bar mb-6">
              <div className="progress-fill" style={{ width: `${accuracy}%` }} />
            </div>
            <p className="text-slate-400 text-sm mb-8">정확도 {Math.round(accuracy)}%</p>

            <div className="flex flex-col gap-3">
              {unknownCount > 0 && (
                <Button onClick={handleStudyUnknown} size="lg" className="w-full">
                  모르는 카드만 다시 학습 ({unknownCount}개)
                </Button>
              )}
              <Button variant="secondary" onClick={handleReset} className="w-full">
                <RotateCcw className="w-4 h-4" />
                처음부터
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/set/${id}`)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-slate-400">{set.title}</h2>
            <p className="text-xs text-slate-600">스페이스바로 뒤집기 · 방향키로 이동</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDefinitionFirst((v) => !v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                showDefinitionFirst ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
              )}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              정의 먼저
            </button>
            <button
              onClick={handleShuffle}
              className={cn(
                'p-2 rounded-lg text-xs transition-all',
                isShuffled ? 'text-blue-400 bg-blue-500/15' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
              )}
              title="셔플"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handleReset} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all" title="초기화">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-sm text-slate-400 font-medium tabular-nums">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* Known/Unknown count */}
        <div className="flex gap-3 mb-4 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ThumbsUp className="w-3.5 h-3.5" /> {knownCount}
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <ThumbsDown className="w-3.5 h-3.5" /> {unknownCount}
          </span>
        </div>

        {/* Flashcard */}
        <div className="flip-card h-72 sm:h-80 mb-6 cursor-pointer" onClick={flipCard}>
          <div className={cn('flip-card-inner', isFlipped && 'flipped')}>
            {/* Front */}
            <div className="flip-card-front glass rounded-3xl card-glow flex flex-col items-center justify-center p-8 text-center">
              <div className="absolute top-4 left-4 text-xs text-slate-600 uppercase tracking-widest font-medium">
                {showDefinitionFirst ? '정의' : '용어'}
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
                {showDefinitionFirst ? current?.definition : current?.term}
              </p>
              {current?.hint && !showDefinitionFirst && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHint((v) => !v); }}
                  className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHint ? current.hint : '힌트 보기'}
                </button>
              )}
              <p className="absolute bottom-4 text-xs text-slate-600">클릭하여 뒤집기</p>
            </div>

            {/* Back */}
            <div className="flip-card-back bg-gradient-to-br from-blue-900/60 to-violet-900/60 border border-blue-500/20 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-2xl">
              <div className="absolute top-4 left-4 text-xs text-blue-400/70 uppercase tracking-widest font-medium">
                {showDefinitionFirst ? '용어' : '정의'}
              </div>
              <p className="text-xl sm:text-2xl text-slate-100 leading-relaxed">
                {showDefinitionFirst ? current?.term : current?.definition}
              </p>
            </div>
          </div>
        </div>

        {/* Rating buttons */}
        {isFlipped && (
          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={() => handleRate(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <ThumbsDown className="w-5 h-5" />
              모르겠어요
            </button>
            <button
              onClick={() => handleRate(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <ThumbsUp className="w-5 h-5" />
              알아요
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-2xl glass text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl gradient-primary text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
          >
            {currentIndex === cards.length - 1 ? '완료' : '다음'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
