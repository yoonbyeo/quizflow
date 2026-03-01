import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import type { User } from '@supabase/supabase-js';
import type { CardSet, Folder } from '../../types';

interface LayoutProps {
  user: User | null;
  cardSets: CardSet[];
  folders: Folder[];
  children: ReactNode;
}

export default function Layout({ user, cardSets, folders, children }: LayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = search.trim()
    ? cardSets.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.category?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div>
      <Sidebar user={user} cardSets={cardSets} folders={folders} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <button onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', padding: 6, borderRadius: 8 }}>
            <Menu size={20} />
          </button>

          <div className="search-wrap">
            <Search size={15} />
            <input type="text" className="search-input" placeholder="낱말카드 세트 검색..."
              value={search} onChange={e => setSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearch(''), 200)} />
            {filtered.length > 0 && (
              <div className="search-dropdown">
                {filtered.map(set => (
                  <button key={set.id} className="search-item"
                    onMouseDown={() => { navigate(`/set/${set.id}`); setSearch(''); }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{set.cards.length}</span>
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{set.title}</div>
                      {set.category && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{set.category}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Plus size={15} /> 만들기
          </button>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
