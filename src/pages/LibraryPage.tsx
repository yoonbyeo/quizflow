import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, Copy, BookOpen, MoreVertical } from 'lucide-react';
import type { CardSet } from '../types';

interface LibraryPageProps {
  cardSets: CardSet[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function LibraryPage({ cardSets, onDelete, onDuplicate }: LibraryPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'cards'>('recent');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = cardSets
    .filter(s =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'cards') return b.cards.length - a.cards.length;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>라이브러리</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>내 낱말카드 세트 {cardSets.length}개</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="세트 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tab-group" style={{ flexShrink: 0 }}>
          {[{ v: 'recent', l: '최신순' }, { v: 'name', l: '이름순' }, { v: 'cards', l: '카드수' }].map(({ v, l }) => (
            <button key={v} className={`tab-btn ${sort === v ? 'active' : ''}`} onClick={() => setSort(v as typeof sort)}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-2)' }}>
          <BookOpen size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>세트가 없습니다</p>
        </div>
      ) : (
        <div className="sets-grid" onClick={() => setOpenMenu(null)}>
          {filtered.map(set => (
            <div
              key={set.id}
              className="set-card"
              onClick={() => navigate(`/set/${set.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  {set.category && <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>{set.category}</span>}
                  <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-1)' }}>{set.title}</h3>
                </div>
                <div style={{ position: 'relative', flexShrink: 0, marginLeft: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px' }}
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === set.id ? null : set.id); }}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {openMenu === set.id && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button className="search-item" onClick={() => { navigate(`/edit/${set.id}`); setOpenMenu(null); }}>
                        <Edit2 size={14} /> 편집
                      </button>
                      <button className="search-item" onClick={() => { onDuplicate(set.id); setOpenMenu(null); }}>
                        <Copy size={14} /> 복제
                      </button>
                      <button className="search-item" style={{ color: 'var(--red)' }} onClick={() => { if (confirm(`"${set.title}"을 삭제할까요?`)) { onDelete(set.id); } setOpenMenu(null); }}>
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>{set.cards.length}개 카드</p>
              {set.description && (
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{set.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
