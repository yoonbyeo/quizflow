import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart2, Plus, Zap, LogOut, Library, Folder, AlertCircle } from 'lucide-react';
import { signOut } from '../../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { CardSet, Folder as FolderType } from '../../types';

interface SidebarProps {
  user: User | null;
  cardSets: CardSet[];
  folders: FolderType[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ user, cardSets, folders, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  // 전체 오답 카드 수 계산
  const wrongCardCount = cardSets.reduce((total, set) => {
    const stats = set.studyStats?.cardStats ?? {};
    return total + set.cards.filter(c => (stats[c.id]?.incorrect ?? 0) > 0).length;
  }, 0);

  const nav = [
    { to: '/', label: '홈', icon: Home },
    { to: '/library', label: '라이브러리', icon: Library },
    { to: '/folders', label: '폴더', icon: Folder },
    { to: '/wrong-note', label: '오답 노트', icon: AlertCircle, badge: wrongCardCount > 0 ? wrongCardCount : null },
    { to: '/stats', label: '통계', icon: BarChart2 },
  ];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Link to="/" className="logo" onClick={onMobileClose}>
        <div className="logo-icon"><Zap size={16} color="#fff" fill="#fff" /></div>
        <span className="logo-text">QuizFlow</span>
      </Link>

      <nav style={{ flex: 1, paddingTop: 8, overflow: 'hidden auto' }}>
        {nav.map(({ to, label, icon: Icon, badge }: any) => (
          <Link key={to} to={to} onClick={onMobileClose} className={`nav-item ${isActive(to) ? 'active' : ''}`}>
            <Icon size={16} /> {label}
            {badge ? <span className="badge badge-red" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px' }}>{badge}</span> : null}
          </Link>
        ))}

        <div className="nav-section-label">내 콘텐츠</div>

        <Link to="/create" onClick={onMobileClose} className="nav-item">
          <Plus size={16} /> 새 세트 만들기
        </Link>

        {cardSets.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>최근 세트</div>
            {cardSets.slice(0, 4).map(set => (
              <Link key={set.id} to={`/set/${set.id}`} onClick={onMobileClose}
                className={`nav-item ${location.pathname === `/set/${set.id}` ? 'active' : ''}`}
                style={{ fontSize: 12.5, paddingLeft: 22 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{set.title}</span>
              </Link>
            ))}
          </>
        )}

        {folders.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>폴더</div>
            {folders.slice(0, 4).map(folder => (
              <Link key={folder.id} to={`/folders`} onClick={onMobileClose}
                className="nav-item"
                style={{ fontSize: 12.5, paddingLeft: 22 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: folder.color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                <span className="badge badge-gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  {cardSets.filter(s => s.folderId === folder.id).length}
                </span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {user && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8 }}>
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              : <div className="avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <button onClick={handleSignOut} title="로그아웃"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, display: 'flex' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="sidebar">{content}</aside>
      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={onMobileClose} />
          <aside className="sidebar open" style={{ zIndex: 50 }}>{content}</aside>
        </>
      )}
    </>
  );
}
