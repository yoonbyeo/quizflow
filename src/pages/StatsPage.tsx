import { useNavigate } from 'react-router-dom';
import { BarChart2, BookOpen, TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../utils';

export default function StatsPage() {
  const navigate = useNavigate();
  const { cardSets } = useStore();

  const totalCards = cardSets.reduce((s, set) => s + set.cards.length, 0);
  const totalSessions = cardSets.reduce((s, set) => s + set.studyStats.totalStudySessions, 0);

  const allCardStats = cardSets.flatMap((set) =>
    Object.values(set.studyStats.cardStats).map((stat) => ({ ...stat, setId: set.id }))
  );

  const totalAttempts = allCardStats.reduce((s, c) => s + c.correct + c.incorrect, 0);
  const totalCorrect = allCardStats.reduce((s, c) => s + c.correct, 0);
  const overallAccuracy = totalAttempts === 0 ? null : Math.round((totalCorrect / totalAttempts) * 100);

  const studiedSets = cardSets.filter((s) => s.studyStats.lastStudied).sort((a, b) => (b.studyStats.lastStudied || 0) - (a.studyStats.lastStudied || 0));

  const setAccuracies = cardSets.map((set) => {
    const stats = Object.values(set.studyStats.cardStats);
    const total = stats.reduce((s, c) => s + c.correct + c.incorrect, 0);
    const correct = stats.reduce((s, c) => s + c.correct, 0);
    return {
      set,
      accuracy: total === 0 ? null : Math.round((correct / total) * 100),
      total,
    };
  }).filter((s) => s.accuracy !== null).sort((a, b) => b.accuracy! - a.accuracy!);

  const difficultyDist = {
    easy: allCardStats.filter((c) => c.difficulty === 'easy').length,
    medium: allCardStats.filter((c) => c.difficulty === 'medium').length,
    hard: allCardStats.filter((c) => c.difficulty === 'hard').length,
    unrated: allCardStats.filter((c) => c.difficulty === 'unrated').length,
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">학습 통계</h1>
          <p className="text-slate-400">전체 학습 현황을 한눈에 확인하세요</p>
        </div>

        {totalAttempts === 0 ? (
          <div className="text-center py-24 glass rounded-2xl card-glow">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
              <Zap className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-slate-200 mb-3">아직 학습 기록이 없어요</h2>
            <p className="text-slate-400 mb-6">세트를 만들고 학습을 시작하면 통계가 나타납니다</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 gradient-primary rounded-xl text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              시작하기
            </button>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: '전체 세트', value: cardSets.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: '전체 카드', value: totalCards, icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { label: '총 학습', value: totalSessions, icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: '전체 정확도', value: overallAccuracy !== null ? `${overallAccuracy}%` : '-', icon: TrendingUp, color: overallAccuracy !== null && overallAccuracy >= 80 ? 'text-emerald-400' : overallAccuracy !== null && overallAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400', bg: 'bg-slate-800/60' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="glass rounded-2xl p-5 card-glow">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div className={cn('text-3xl font-bold mb-1', color)}>{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Difficulty Distribution */}
              <div className="glass rounded-2xl p-6 card-glow">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">난이도 분포</h3>
                {allCardStats.length === 0 ? (
                  <p className="text-slate-500 text-sm">데이터 없음</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: '쉬움', count: difficultyDist.easy, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                      { label: '보통', count: difficultyDist.medium, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                      { label: '어려움', count: difficultyDist.hard, color: 'bg-red-500', textColor: 'text-red-400' },
                      { label: '미평가', count: difficultyDist.unrated, color: 'bg-slate-500', textColor: 'text-slate-400' },
                    ].map(({ label, count, color, textColor }) => {
                      const pct = allCardStats.length > 0 ? (count / allCardStats.length) * 100 : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between mb-1.5">
                            <span className={cn('text-sm font-medium', textColor)}>{label}</span>
                            <span className="text-sm text-slate-400">{count}개 ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Performing Sets */}
              <div className="glass rounded-2xl p-6 card-glow">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">세트별 정확도</h3>
                {setAccuracies.length === 0 ? (
                  <p className="text-slate-500 text-sm">데이터 없음</p>
                ) : (
                  <div className="space-y-3">
                    {setAccuracies.slice(0, 5).map(({ set, accuracy }) => (
                      <button
                        key={set.id}
                        onClick={() => navigate(`/set/${set.id}`)}
                        className="w-full text-left group"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors truncate mr-3">{set.title}</span>
                          <span className={cn(
                            'text-sm font-bold flex-shrink-0',
                            accuracy! >= 80 ? 'text-emerald-400' : accuracy! >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {accuracy}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              accuracy! >= 80 ? 'bg-emerald-500' : accuracy! >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {studiedSets.length > 0 && (
              <div className="glass rounded-2xl p-6 card-glow">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">최근 학습</h3>
                <div className="space-y-2">
                  {studiedSets.slice(0, 5).map((set) => {
                    const stats = Object.values(set.studyStats.cardStats);
                    const total = stats.reduce((s, c) => s + c.correct + c.incorrect, 0);
                    const correct = stats.reduce((s, c) => s + c.correct, 0);
                    const acc = total === 0 ? null : Math.round((correct / total) * 100);
                    return (
                      <button
                        key={set.id}
                        onClick={() => navigate(`/set/${set.id}`)}
                        className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">{set.title}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(set.studyStats.lastStudied!)}
                          </p>
                        </div>
                        {acc !== null && (
                          <span className={cn(
                            'text-sm font-bold',
                            acc >= 80 ? 'text-emerald-400' : acc >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {acc}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
