import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ShieldCheck, Lock, Mail, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, switchDemoRole } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'reviewer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register(formData);
      } else {
        await login(formData.email || formData.username, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await switchDemoRole(role);
      onClose();
    } catch (err) {
      setError('Could not switch demo role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegisterMode ? 'Create AppSec Account' : 'Authenticate to SecureShield'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
          <div className="text-xs">
            <p className="text-slate-200 font-medium">Role-Based Security Portal</p>
            <p className="text-slate-400">
              Admin manages projects & reviews; Reviewers conduct checklists and audits.
            </p>
          </div>
        </div>

        {/* Quick Demo One-Click Access */}
        <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40">
          <p className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            Quick Demo Accounts (1-Click Instant Login):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFillDemo('admin')}
              className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 hover:border-cyan-500 transition text-center"
            >
              <div className="font-bold">👑 Admin</div>
              <div className="text-[10px] text-slate-400">Security Admin</div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFillDemo('reviewer')}
              className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 hover:border-emerald-500 transition text-center"
            >
              <div className="font-bold">🔍 Reviewer</div>
              <div className="text-[10px] text-slate-400">Security Reviewer</div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFillDemo('developer')}
              className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-purple-300 hover:border-purple-500 transition text-center"
            >
              <div className="font-bold">💻 Developer</div>
              <div className="text-[10px] text-slate-400">Developer</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Security Reviewer"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. security_reviewer"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="reviewer">Reviewer / AppSec Auditor</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Email or Username</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={isRegisterMode ? "name@company.com" : "admin@secureshield.io"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-medium text-xs shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </form>

        <div className="text-center pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition"
          >
            {isRegisterMode 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Register New"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
