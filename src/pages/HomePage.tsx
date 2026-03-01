import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Clock, TrendingUp, ChevronRight, Zap, Plus, ArrowRight
} from 'lucide-react';
import { cn, formatDate } from '../utils';
import type { CardSet, CardStat } from '../types';

interface HomePageProps {
  cardSets: CardSet[];
  loading: boolean;
}

export default function HomePage({ cardSets, loading }: HomePageProps) {
  const navigate = useNavigate();

  const recentSets = [...cardSets]
    .filter((s) => s.studyStats.lastStudied)
    .sort((a, b) => (b.studyStats.lastStudied ?? 0) - (a.studyStats.lastStudied ?? 0))
    .slice(0, 3);

  const recentlyCreated = [...cardSets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (cardSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
          <Zap className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-3">QuizFlow에 오신 것을 환영합니다</h1>
        <p className="text-slate-400 mb-8 max-w-md">
          플래시카드 세트를 만들고 다양한 학습 모드로 효과적으로 공부하세요
        </p>
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 px-6 py-3 gradient-primary rounded-xl text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          첫 번째 세트 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Recent study */}
      {recentSets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">멈춘 지점에서 계속하기</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSets.map((set) => (
              <RecentSetCard key={set.id} set={set} onClick={() => navigate(`/set/${set.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* All sets */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">
            {recentSets.length > 0 ? '새로운 콘텐츠' : '내 세트'}
          </h2>
          <Link to="/library" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            전체 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentlyCreated.map((set) => (
            <SetCard key={set.id} set={set} onClick={() => navigate(`/set/${set.id}`)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RecentSetCard({ set, onClick }: { set: CardSet; onClick: () => void }) {
  const stats = Object.values(set.studyStats.cardStats) as CardStat[];
  const total = stats.reduce((s, c) => s + c.correct + c.incorrect, 0);
  const correct = stats.reduce((s, c) => s + c.correct, 0);
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl p-5 card-glow card-glow-hover transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
      <div className="relative">
        {set.category && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium mb-2">
            {set.category}
          </span>
        )}
        <h3 className="text-base font-semibold text-slate-100 mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
          {set.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {set.cards.length}개 카드
          </span>
          {set.studyStats.lastStudied && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(set.studyStats.lastStudied)}
            </span>
          )}
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">{accuracy}% 완료</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
        <button className="w-full py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors">
          계속하기
        </button>
      </div>
    </div>
  );
}

function SetCard({ set, onClick }: { set: CardSet; onClick: () => void }) {
  const stats = Object.values(set.studyStats.cardStats) as CardStat[];
  const total = stats.reduce((s, c) => s + c.correct + c.incorrect, 0);
  const correct = stats.reduce((s, c) => s + c.correct, 0);
  const accuracy = total === 0 ? null : Math.round((correct / total) * 100);

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl p-5 card-glow card-glow-hover transition-all cursor-pointer group"
    >
      <div className="mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
          <BookOpen className="w-5 h-5 text-blue-400" />
        </div>
        {set.category && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-700 text-slate-400 text-xs font-medium mb-2">
            {set.category}
          </span>
        )}
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
          {set.title}
        </h3>
        <p className="text-xs text-slate-500">{set.cards.length}개 카드</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <span className="text-xs text-slate-500">{formatDate(set.updatedAt)}</span>
        {accuracy !== null && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-medium',
            accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
          )}>
            <TrendingUp className="w-3 h-3" />
            {accuracy}%
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
}
