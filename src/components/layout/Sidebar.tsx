import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart2, Plus, Zap, LogOut, Library, Folder, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from '../../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { CardSet, Folder as FolderType } from '../../types';

interface SidebarProps {
  user: User | null;
  cardSets: CardSet[];
  folders: FolderType[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ user, cardSets, folders, collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

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

  const sidebarWidth = collapsed ? 56 : 220;

  const content = (isMobile = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* 로고 + 토글 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '18px 0' : '18px 10px 12px 16px', flexShrink: 0, minHeight: 60 }}>
        {!collapsed && (
          <Link to="/" onClick={isMobile ? onMobileClose : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <div className="logo-icon" style={{ flexShrink: 0 }}><Zap size={16} color="#fff" fill="#fff" /></div>
            <span className="logo-text">QuizFlow</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" onClick={isMobile ? onMobileClose : undefined} style={{ display: 'flex', textDecoration: 'none' }}>
            <div className="logo-icon"><Zap size={16} color="#fff" fill="#fff" /></div>
          </Link>
        )}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            style={{
              width: 24, height: 24,
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--text-2)',
              transition: 'all .15s',
              ...(collapsed ? { marginTop: 0 } : {}),
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 4, overflow: 'hidden auto' }}>
        {nav.map(({ to, label, icon: Icon, badge }: any) => (
          <Link
            key={to}
            to={to}
            onClick={isMobile ? onMobileClose : undefined}
            className={`nav-item ${isActive(to) ? 'active' : ''}`}
            title={collapsed ? label : undefined}
            style={collapsed ? { justifyContent: 'center', padding: '9px 0', margin: '1px 6px', width: 'calc(100% - 12px)', position: 'relative' } : {}}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>}
            {!collapsed && badge ? <span className="badge badge-red" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', flexShrink: 0 }}>{badge}</span> : null}
            {collapsed && badge ? (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', border: '1px solid var(--bg-1)' }} />
            ) : null}
          </Link>
        ))}

        {!collapsed && (
          <>
            <div className="nav-section-label">내 콘텐츠</div>
            <Link to="/create" onClick={isMobile ? onMobileClose : undefined} className="nav-item">
              <Plus size={16} /> 새 세트 만들기
            </Link>

            {cardSets.length > 0 && (
              <>
                <div className="nav-section-label" style={{ marginTop: 8 }}>최근 세트</div>
                {cardSets.slice(0, 4).map(set => (
                  <Link key={set.id} to={`/set/${set.id}`} onClick={isMobile ? onMobileClose : undefined}
                    className={`nav-item ${location.pathname === `/set/${set.id}` ? 'active' : ''}`}
                    style={{ fontSize: 12.5, paddingLeft: 22 }}>
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
                  <Link key={folder.id} to="/folders" onClick={isMobile ? onMobileClose : undefined}
                    className="nav-item" style={{ fontSize: 12.5, paddingLeft: 22 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: folder.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                    <span className="badge badge-gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {cardSets.filter(s => s.folderId === folder.id).length}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </>
        )}

        {/* collapsed일 때 새 세트 만들기 아이콘만 */}
        {collapsed && (
          <Link to="/create" onClick={isMobile ? onMobileClose : undefined}
            className="nav-item"
            title="새 세트 만들기"
            style={{ justifyContent: 'center', padding: '9px 0', margin: '1px 6px', width: 'calc(100% - 12px)', marginTop: 4 }}>
            <Plus size={16} style={{ flexShrink: 0 }} />
          </Link>
        )}
      </nav>

      {/* 프로필 */}
      {user && (
        <div style={{ padding: collapsed ? '10px 6px' : '12px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {collapsed ? (
            <Link to="/profile" onClick={isMobile ? onMobileClose : undefined}
              title={user.user_metadata?.full_name || user.email?.split('@')[0]}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: 8, textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                : <div className="avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
              }
            </Link>
          ) : (
            <Link to="/profile" onClick={isMobile ? onMobileClose : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div className="avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>프로필 편집</div>
              </div>
              <button onClick={e => { e.preventDefault(); handleSignOut(); }} title="로그아웃"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0 }}>
                <LogOut size={15} />
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: sidebarWidth,
          height: '100vh',
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          overflow: 'hidden',
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          flexShrink: 0,
        }}
        className="sidebar-desktop"
      >
        {content(false)}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={onMobileClose} />
          <aside className="sidebar open" style={{ zIndex: 50 }}>{content(true)}</aside>
        </>
      )}
    </>
  );
}
