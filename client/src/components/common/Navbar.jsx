import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, User, KeyRound, ChevronDown, Check, Menu } from 'lucide-react';

export function Navbar({ onToggleSidebar, onOpenAuthModal }) {
  const { user, logout, switchDemoRole, isAdmin, isReviewer, isDeveloper } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (role) => {
    setSwitching(true);
    try {
      await switchDemoRole(role);
      setDropdownOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a0e17] rounded-[7px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-tight text-white text-base sm:text-lg">
                  SecureShield
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded">
                  AppSec Review
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Software Security Code Review Checklist
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Role Switcher for Viva Demo & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher Pills */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <span className="text-[11px] font-mono text-slate-400 px-2 uppercase tracking-wider">
              Demo Role:
            </span>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                isAdmin 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👑 Admin
            </button>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('reviewer')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                isReviewer 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔍 Reviewer
            </button>
            <button
              disabled={switching}
              onClick={() => handleRoleSwitch('developer')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                isDeveloper 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💻 Dev
            </button>
          </div>

          {/* User Profile / Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow"
                  style={{ backgroundColor: user.avatar_color || '#0284c7' }}
                >
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-200 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 capitalize">
                    {user.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0e1422] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400 font-mono">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Role: {user.role}
                    </span>
                  </div>

                  {/* Mobile Role Switcher */}
                  <div className="md:hidden px-3 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-mono text-slate-400 mb-1.5">Switch Role</p>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleRoleSwitch('admin')}
                        className="text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>👑 Security Admin</span>
                        {isAdmin && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('reviewer')}
                        className="text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>🔍 Lead Reviewer</span>
                        {isReviewer && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('developer')}
                        className="text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded flex items-center justify-between"
                      >
                        <span>💻 Fullstack Dev</span>
                        {isDeveloper && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      Switch / Register Account
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
