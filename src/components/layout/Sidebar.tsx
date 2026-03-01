import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart2, Plus, Zap, LogOut, FolderOpen, X } from 'lucide-react';
import { cn } from '../../utils';
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

  const navItems = [
    { to: '/', label: '홈', icon: Home },
    { to: '/library', label: '라이브러리', icon: FolderOpen },
    { to: '/stats', label: '통계', icon: BarChart2 },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 mb-2">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={onMobileClose}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">QuizFlow</span>
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="p-1 text-slate-400 hover:text-slate-200 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive(to)
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">내 콘텐츠</p>
          <Link
            to="/library"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            )}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>낱말카드 세트</span>
            {cardSetCount > 0 && (
              <span className="ml-auto text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-md">
                {cardSetCount}
              </span>
            )}
          </Link>
        </div>

        <Link
          to="/create"
          onClick={onMobileClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          새 세트 만들기
        </Link>
      </nav>

      {/* User */}
      {user && (
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
              {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] rounded-lg transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 fixed top-0 left-0 h-screen glass border-r border-white/[0.06] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 h-screen w-64 glass border-r border-white/[0.06] z-50 lg:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
