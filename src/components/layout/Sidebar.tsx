import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart2, Plus, Zap, LogOut, Library } from 'lucide-react';
import { signOut } from '../../hooks/useAuth';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  user: User | null;
  cardSetCount: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ user, cardSetCount, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const nav = [
    { to: '/', label: '홈', icon: Home },
    { to: '/library', label: '라이브러리', icon: Library },
    { to: '/stats', label: '통계', icon: BarChart2 },
  ];

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Link to="/" className="logo" onClick={onMobileClose}>
        <div className="logo-icon">
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span className="logo-text">QuizFlow</span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onMobileClose}
            className={`nav-item ${isActive(to) ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        <div className="nav-section-label">내 콘텐츠</div>

        <Link to="/library" onClick={onMobileClose} className="nav-item" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={16} />
            낱말카드 세트
          </span>
          {cardSetCount > 0 && (
            <span className="badge badge-gray">{cardSetCount}</span>
          )}
        </Link>

        <Link to="/create" onClick={onMobileClose} className="nav-item">
          <Plus size={16} />
          새 세트 만들기
        </Link>
      </nav>

      {/* User */}
      {user && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8 }}>
            <div className="avatar">
              {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, display: 'flex' }}
              title="로그아웃"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="sidebar">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={onMobileClose} />
          <aside className="sidebar open" style={{ zIndex: 50 }}>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
