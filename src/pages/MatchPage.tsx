import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, Timer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { shuffleArray, cn } from '../utils';
import Button from '../components/ui/Button';
import type { MatchItem } from '../types';

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cardSets, updateCardStat } = useStore();

  const set = cardSets.find((s) => s.id === id);
  const PAIRS = Math.min(6, set?.cards.length || 0);

  const [items, setItems] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState(0);

  const generateItems = useCallback(() => {
    if (!set || set.cards.length === 0) return;
    const selected = shuffleArray(set.cards).slice(0, PAIRS);
    const newItems: MatchItem[] = [
      ...selected.map((c) => ({
        id: `term-${c.id}`,
        text: c.term,
        type: 'term' as const,
        cardId: c.id,
        isMatched: false,
        isSelected: false,
      })),
      ...selected.map((c) => ({
        id: `def-${c.id}`,
        text: c.definition,
        type: 'definition' as const,
        cardId: c.id,
        isMatched: false,
        isSelected: false,
      })),
    ];
    setItems(shuffleArray(newItems));
    setSelected(null);
    setWrongPair(null);
    setCompleted(false);
    setMoves(0);
    setElapsedTime(0);
  }, [set, PAIRS]);

  useEffect(() => {
    generateItems();
  }, [generateItems]);

  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [completed, startTime]);

  const handleClick = (itemId: string) => {
    if (completed || wrongPair) return;
    const item = items.find((i) => i.id === itemId);
    if (!item || item.isMatched) return;

    if (selected === itemId) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(itemId);
      return;
    }

    const prev = items.find((i) => i.id === selected);
    if (!prev) { setSelected(itemId); return; }

    if (prev.type === item.type) {
      setSelected(itemId);
      return;
    }

    setMoves((m) => m + 1);

    if (prev.cardId === item.cardId) {
      setItems((items) =>
        items.map((i) =>
          i.id === selected || i.id === itemId ? { ...i, isMatched: true, isSelected: false } : i
        )
      );
      updateCardStat(id!, prev.cardId, true);
      setSelected(null);

      const allMatched = items.every((i) => i.id === selected || i.id === itemId || i.isMatched);
      if (allMatched) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        setCompleted(true);
      }
    } else {
      setWrongPair([selected, itemId]);
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
      }, 700);
    }
  };

  useEffect(() => {
    if (items.length > 0 && items.every((i) => i.isMatched)) {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      setCompleted(true);
    }
  }, [items, startTime]);

  const matchedCount = items.filter((i) => i.isMatched).length / 2;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!set || set.cards.length === 0) { navigate(`/set/${id}`); return null; }

  if (completed) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="max-w-sm w-full mx-auto px-4 text-center">
          <div className="glass rounded-3xl p-10 card-glow">
            <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">완료!</h2>
            <p className="text-slate-400 mb-8">모든 쌍을 매칭했습니다</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/60 rounded-2xl p-4">
                <div className="text-2xl font-bold text-blue-400">{formatTime(elapsedTime)}</div>
                <div className="text-xs text-slate-500 mt-1">소요시간</div>
              </div>
              <div className="bg-slate-800/60 rounded-2xl p-4">
                <div className="text-2xl font-bold text-violet-400">{moves}</div>
                <div className="text-xs text-slate-500 mt-1">시도 횟수</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={generateItems} size="lg" className="w-full">
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/set/${id}`)} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-100">매칭 게임</h1>
            <p className="text-sm text-slate-400">{set.title}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              {formatTime(timer)}
            </span>
            <span>{matchedCount}/{PAIRS} 완료</span>
          </div>
          <button onClick={generateItems} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="progress-bar mb-6">
          <div className="progress-fill" style={{ width: `${(matchedCount / PAIRS) * 100}%` }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const isSelected = selected === item.id;
            const isWrong = wrongPair?.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                disabled={item.isMatched}
                className={cn(
                  'p-4 rounded-2xl border text-sm font-medium text-left transition-all min-h-[80px] flex items-center justify-center text-center leading-snug',
                  item.isMatched
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-default'
                    : isWrong
                    ? 'border-red-500 bg-red-500/20 text-red-300 scale-95'
                    : isSelected
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300 scale-[1.02] shadow-lg shadow-blue-500/20'
                    : 'glass border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-white/[0.08] hover:scale-[1.01] active:scale-95 card-glow'
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          용어와 정의를 클릭해서 매칭하세요
        </p>
      </div>
    </div>
  );
}
