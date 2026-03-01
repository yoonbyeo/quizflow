import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, Copy, Edit3, ChevronRight, TrendingUp, Clock, Search } from 'lucide-react';
import { cn, formatDate } from '../utils';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import type { CardSet, CardStat, SortOrder } from '../types';

interface LibraryPageProps {
  cardSets: CardSet[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function LibraryPage({ cardSets, onDelete, onDuplicate }: LibraryPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOrder>('updated');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let sets = [...cardSets];
    if (search.trim()) {
      const q = search.toLowerCase();
      sets = sets.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'updated': sets.sort((a, b) => b.updatedAt - a.updatedAt); break;
      case 'created': sets.sort((a, b) => b.createdAt - a.createdAt); break;
      case 'alphabetical': sets.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'size': sets.sort((a, b) => b.cards.length - a.cards.length); break;
    }
    return sets;
  }, [cardSets, search, sortBy]);

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">라이브러리</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {cardSets.length}개 세트</p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="세트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-sm text-slate-200 placeholder:text-slate-500 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['updated', 'created', 'alphabetical', 'size'] as SortOrder[]).map((order) => {
            const labels: Record<SortOrder, string> = { updated: '최근 수정', created: '최근 생성', alphabetical: '가나다순', size: '카드 수' };
            return (
              <button
                key={order}
                onClick={() => setSortBy(order)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                  sortBy === order
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'glass text-slate-400 hover:text-slate-200 border border-slate-700'
                )}
              >
                {labels[order]}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{search ? '검색 결과가 없습니다' : '세트가 없습니다'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((set) => {
            const stats = Object.values(set.studyStats.cardStats) as CardStat[];
            const total = stats.reduce((s, c) => s + c.correct + c.incorrect, 0);
            const correct = stats.reduce((s, c) => s + c.correct, 0);
            const accuracy = total === 0 ? null : Math.round((correct / total) * 100);

            return (
              <div
                key={set.id}
                className="glass rounded-2xl p-5 card-glow card-glow-hover transition-all group cursor-pointer"
                onClick={() => navigate(`/set/${set.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {set.category && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium mb-2">
                        {set.category}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{set.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors ml-2 flex-shrink-0 mt-0.5" />
                </div>

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
                  {accuracy !== null && (
                    <span className={cn(
                      'flex items-center gap-1 ml-auto font-medium',
                      accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      <TrendingUp className="w-3 h-3" />
                      {accuracy}%
                    </span>
                  )}
                </div>

                {accuracy !== null && (
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${accuracy}%` }} />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/set/${set.id}`)}
                    className="flex-1 text-center py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                  >
                    학습하기
                  </button>
                  <button
                    onClick={() => navigate(`/edit/${set.id}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDuplicate(set.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(set.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="세트 삭제" size="sm">
        <p className="text-slate-300 mb-6">이 세트를 삭제하면 모든 카드와 학습 기록이 사라집니다. 계속하시겠습니까?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>취소</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm!)}>삭제</Button>
        </div>
      </Modal>
    </div>
  );
}
