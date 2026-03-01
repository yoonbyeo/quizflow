import { Link, useLocation } from 'react-router-dom';
import { Zap, BookOpen, BarChart2, Plus } from 'lucide-react';
import { cn } from '../../utils';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: '홈', icon: BookOpen },
    { to: '/stats', label: '통계', icon: BarChart2 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">QuizFlow</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  location.pathname === to
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">새 세트</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
