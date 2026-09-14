import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderGit2, 
  BookOpen, 
  ShieldCheck, 
  History, 
  ExternalLink,
  PlusCircle,
  Activity
} from 'lucide-react';

export function Sidebar({ currentView, onSelectView, isOpen, onClose, onNewReviewClick }) {
  const { isAdmin, user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Security Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'reviews',
      label: 'Security Reviews',
      icon: CheckSquare,
      badge: null
    },
    {
      id: 'projects',
      label: 'Projects & Repos',
      icon: FolderGit2,
      badge: null
    },
    {
      id: 'checklist_guide',
      label: 'Security Controls Guide',
      icon: BookOpen,
      badge: '12 OWASP'
    },
    {
      id: 'audits',
      label: 'Audit Trail Logs',
      icon: History,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#0a0e17] border-r border-slate-800/80 transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col justify-between
      `}>
        <div className="p-4 space-y-6">
          {/* Quick Action for Admin */}
          {isAdmin && (
            <button
              onClick={() => {
                onNewReviewClick();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-medium text-xs font-mono shadow-lg shadow-cyan-900/30 transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              New Security Review
            </button>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition
                    ${isActive 
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Platform Status Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Security Engine Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            34 Master Controls • Real-time Scoring
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Role: <strong className="text-slate-300 uppercase">{user?.role || 'Guest'}</strong></span>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
