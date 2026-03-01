import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import type { User } from '@supabase/supabase-js';
import type { CardSet } from '../../types';

interface LayoutProps {
  user: User | null;
  cardSets: CardSet[];
  children: ReactNode;
}

export default function Layout({ user, cardSets, children }: LayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = search.trim()
    ? cardSets.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()) ||
          s.category?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen flex">
      <Sidebar
        user={user}
        cardSetCount={cardSets.length}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-white/[0.06] px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="낱말카드 검색..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />

            {/* Search dropdown */}
            {search.trim() && (
              <div className="absolute top-full mt-2 left-0 right-0 glass rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50">
                {filtered.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">검색 결과 없음</p>
                ) : (
                  filtered.slice(0, 5).map((set) => (
                    <button
                      key={set.id}
                      onClick={() => { navigate(`/set/${set.id}`); setSearch(''); }}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.06] transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">{set.cards.length}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{set.title}</p>
                        {set.category && <p className="text-xs text-slate-500">{set.category}</p>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Link
            to="/create"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">만들기</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
