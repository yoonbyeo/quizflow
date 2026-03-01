import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Home, BarChart2, Plus, Zap, LogOut, Library, Folder, AlertCircle, ChevronLeft, ChevronRight, Flame, RefreshCw, User as UserIcon, Settings, Sun, Moon, Shield, HelpCircle, Users } from 'lucide-react';
import { signOut } from '../../hooks/useAuth';
import { loadStreak } from '../../utils/streak';
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 테마 감지
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setProfileMenuOpen(false);
  };

  const wrongCardCount = cardSets.reduce((total, set) => {
    const stats = set.studyStats?.cardStats ?? {};
    return total + set.cards.filter(c => (stats[c.id]?.incorrect ?? 0) > 0).length;
  }, 0);

  const streak = loadStreak();

  // 오늘 복습 대상 카드 수 (오늘 이미 완료했으면 0)
  const now = Date.now();
  const todayReviewDone = (() => {
    try {
      const v = localStorage.getItem('qf-review-result');
      if (!v) return false;
      const r = JSON.parse(v);
      return r.date === new Date().toISOString().slice(0, 10);
    } catch { return false; }
  })();
  const dueCount = todayReviewDone ? 0 : cardSets.reduce((total, set) =>
    total + set.cards.filter(card => {
      const stat = set.studyStats?.cardStats?.[card.id];
      if (!stat?.nextReview) return false;
      return stat.nextReview <= now;
    }).length, 0
  );

  const nav = [
    { to: '/', label: '홈', icon: Home },
    { to: '/library', label: '라이브러리', icon: Library },
    { to: '/folders', label: '폴더', icon: Folder },
    { to: '/rooms', label: '그룹 스터디', icon: Users },
    { to: '/review', label: '오늘 복습', icon: RefreshCw, badge: dueCount > 0 ? dueCount : null },
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

      {/* 스트릭 */}
      {streak > 0 && (
        <div style={{ padding: collapsed ? '8px 0' : '8px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 6 }}
          title={`${streak}일 연속 학습 중!`}>
          <Flame size={15} color="var(--yellow)" fill="var(--yellow)" style={{ flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)' }}>{streak}일 연속</span>
          )}
        </div>
      )}

      {/* 프로필 + 드롭다운 */}
      {user && (
        <div ref={profileRef} style={{ padding: collapsed ? '10px 6px' : '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>

          {/* 드롭다운 메뉴 (프로필 영역 위로 뜸) */}
          {profileMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: collapsed ? 56 : 8,
              right: collapsed ? 'auto' : 8,
              width: collapsed ? 220 : 'auto',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 -4px 24px rgba(0,0,0,.25)',
              zIndex: 100,
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              {/* 사용자 정보 헤더 */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div className="avatar" style={{ width: 36, height: 36, fontSize: 15 }}>{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
                }
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              {/* 메뉴 항목들 */}
              {[
                { icon: UserIcon, label: '프로필', action: () => { navigate('/profile'); setProfileMenuOpen(false); if (isMobile) onMobileClose?.(); } },
                { icon: Settings, label: '설정', action: () => { navigate('/profile'); setProfileMenuOpen(false); if (isMobile) onMobileClose?.(); } },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500, transition: 'background .12s', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Icon size={15} color="var(--text-2)" />
                  {label}
                </button>
              ))}

              {/* 테마 토글 */}
              <button onClick={toggleTheme}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500, transition: 'background .12s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                {isDark ? <Sun size={15} color="var(--text-2)" /> : <Moon size={15} color="var(--text-2)" />}
                {isDark ? '라이트 모드' : '다크 모드'}
              </button>

              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

              <button onClick={() => { navigate('/privacy'); setProfileMenuOpen(false); if (isMobile) onMobileClose?.(); }}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500, transition: 'background .12s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Shield size={15} color="var(--text-2)" />
                개인정보 취급방침
              </button>

              <button onClick={() => { navigate('/help'); setProfileMenuOpen(false); if (isMobile) onMobileClose?.(); }}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500, transition: 'background .12s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <HelpCircle size={15} color="var(--text-2)" />
                도움말 및 피드백
              </button>

              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

              <button onClick={() => { handleSignOut(); setProfileMenuOpen(false); }}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--red)', fontSize: 13, fontWeight: 500, transition: 'background .12s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <LogOut size={15} color="var(--red)" />
                로그아웃
              </button>
            </div>
          )}

          {/* 프로필 트리거 버튼 */}
          {collapsed ? (
            <button
              onClick={() => setProfileMenuOpen(o => !o)}
              title={user.user_metadata?.full_name || user.email?.split('@')[0]}
              style={{ width: '100%', background: profileMenuOpen ? 'var(--bg-2)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: 8, transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'none'; }}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                : <div className="avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
              }
            </button>
          ) : (
            <button
              onClick={() => setProfileMenuOpen(o => !o)}
              style={{ width: '100%', background: profileMenuOpen ? 'var(--bg-2)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => { if (!profileMenuOpen) e.currentTarget.style.background = 'none'; }}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div className="avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
              }
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>계정 관리</div>
              </div>
            </button>
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
