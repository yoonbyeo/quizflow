import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, BookOpen, Brain, Shuffle, RotateCcw,
  ChevronLeft, ChevronRight, TrendingUp, CheckCircle, XCircle, PenLine
} from 'lucide-react';
import { cn } from '../utils';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import type { CardSet, CardStat } from '../types';

interface SetDetailPageProps {
  cardSets: CardSet[];
  onResetStats: (id: string) => Promise<void>;
}

type Tab = 'cards' | 'stats';

export default function SetDetailPage({ cardSets, onResetStats }: SetDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('cards');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [cardPage, setCardPage] = useState(0);

  const set = cardSets.find((s) => s.id === id);
  if (!set) { navigate('/'); return null; }

  const CARDS_PER_PAGE = 10;
  const totalPages = Math.ceil(set.cards.length / CARDS_PER_PAGE);
  const pagedCards = set.cards.slice(cardPage * CARDS_PER_PAGE, (cardPage + 1) * CARDS_PER_PAGE);

  const cardStats = Object.values(set.studyStats.cardStats) as CardStat[];
  const totalAttempts = cardStats.reduce((s, c) => s + c.correct + c.incorrect, 0);
  const totalCorrect = cardStats.reduce((s, c) => s + c.correct, 0);
  const accuracy = totalAttempts === 0 ? null : Math.round((totalCorrect / totalAttempts) * 100);

  const difficultyCount = {
    easy: cardStats.filter((c) => c.difficulty === 'easy').length,
    medium: cardStats.filter((c) => c.difficulty === 'medium').length,
    hard: cardStats.filter((c) => c.difficulty === 'hard').length,
  };

  const modes = [
    { label: '낱말카드', desc: '카드를 넘기며 암기', icon: BookOpen, path: `/study/${id}/flashcard`, color: 'from-blue-600 to-blue-700' },
    { label: '테스트', desc: '객관식 & 주관식 문제', icon: Brain, path: `/study/${id}/test`, color: 'from-violet-600 to-violet-700' },
    { label: '카드 맞추기', desc: '단어와 뜻 매칭', icon: Shuffle, path: `/study/${id}/match`, color: 'from-emerald-600 to-emerald-700' },
    { label: '쓰기', desc: '직접 입력해서 학습', icon: PenLine, path: `/study/${id}/write`, color: 'from-orange-600 to-orange-700' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {set.category && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium mb-2">{set.category}</span>
          )}
          <h1 className="text-3xl font-bold text-slate-100 mb-1">{set.title}</h1>
          {set.description && <p className="text-slate-400">{set.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{set.cards.length}개 카드</span>
            {accuracy !== null && (
              <span className={cn('flex items-center gap-1.5 font-medium', accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400')}>
                <TrendingUp className="w-3.5 h-3.5" />정확도 {accuracy}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/edit/${id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors text-sm font-medium">
            <Edit3 className="w-4 h-4" /> 편집
          </Link>
        </div>
      </div>

      {/* Study Modes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {modes.map(({ label, desc, icon: Icon, path, color }) => (
          <Link
            key={label}
            to={set.cards.length === 0 ? '#' : path}
            onClick={(e) => set.cards.length === 0 && e.preventDefault()}
            className={cn(
              'glass rounded-2xl p-5 group transition-all card-glow card-glow-hover',
              set.cards.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br shadow-lg', color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-semibold text-slate-100 text-sm mb-0.5 group-hover:text-white transition-colors">{label}</div>
            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{desc}</div>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
        {(['cards', 'stats'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200')}>
            {t === 'cards' ? '카드 목록' : '학습 통계'}
          </button>
        ))}
      </div>

      {tab === 'cards' && (
        <div>
          {set.cards.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">카드가 없습니다</p>
              <Link to={`/edit/${id}`}><Button size="sm">카드 추가하기</Button></Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pagedCards.map((card: { id: string; term: string; definition: string }, i: number) => {
                  const stat = set.studyStats.cardStats[card.id] as CardStat | undefined;
                  return (
                    <div key={card.id} className="glass rounded-xl p-4 flex items-start gap-4 card-glow">
                      <span className="text-xs font-bold text-slate-600 w-8 text-center pt-0.5 flex-shrink-0">
                        {cardPage * CARDS_PER_PAGE + i + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">단어</p>
                          <p className="text-sm font-medium text-slate-200">{card.term}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">뜻</p>
                          <p className="text-sm text-slate-300">{card.definition}</p>
                        </div>
                      </div>
                      {stat && (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            stat.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' :
                            stat.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                            stat.difficulty === 'hard' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-500')}>
                            {stat.difficulty === 'easy' ? '쉬움' : stat.difficulty === 'medium' ? '보통' : stat.difficulty === 'hard' ? '어려움' : '미평가'}
                          </span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />{stat.correct}</span>
                            <span className="text-red-400 flex items-center gap-0.5"><XCircle className="w-3 h-3" />{stat.incorrect}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => setCardPage((p) => Math.max(0, p - 1))} disabled={cardPage === 0}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-400">{cardPage + 1} / {totalPages}</span>
                  <button onClick={() => setCardPage((p) => Math.min(totalPages - 1, p + 1))} disabled={cardPage === totalPages - 1}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] disabled:opacity-40 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          {totalAttempts === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">아직 학습 기록이 없습니다</p>
              <p className="text-slate-500 text-sm mt-1">학습을 시작하면 통계가 나타납니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: '총 시도', value: totalAttempts as number, color: 'text-blue-400' },
                  { label: '정답', value: totalCorrect as number, color: 'text-emerald-400' },
                  { label: '오답', value: (totalAttempts as number) - (totalCorrect as number), color: 'text-red-400' },
                  { label: '정확도', value: `${accuracy}%`, color: (accuracy as number) >= 80 ? 'text-emerald-400' : (accuracy as number) >= 60 ? 'text-yellow-400' : 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass rounded-2xl p-5 card-glow text-center">
                    <div className={cn('text-3xl font-bold mb-1', color)}>{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="glass rounded-2xl p-5 card-glow">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">난이도 분포</h3>
                <div className="space-y-3">
                  {[
                    { label: '쉬움', count: difficultyCount.easy, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                    { label: '보통', count: difficultyCount.medium, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                    { label: '어려움', count: difficultyCount.hard, color: 'bg-red-500', textColor: 'text-red-400' },
                  ].map(({ label, count, color, textColor }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={cn('text-sm w-16 font-medium', textColor)}>{label}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', color)}
                          style={{ width: set.cards.length > 0 ? `${(count / set.cards.length) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setResetConfirm(true)}>
                  <RotateCcw className="w-4 h-4" /> 통계 초기화
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)} title="통계 초기화" size="sm">
        <p className="text-slate-300 mb-6">모든 학습 통계가 초기화됩니다. 계속하시겠습니까?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setResetConfirm(false)}>취소</Button>
          <Button variant="danger" onClick={() => { onResetStats(id!); setResetConfirm(false); }}>초기화</Button>
        </div>
      </Modal>
    </div>
  );
}
