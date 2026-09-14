import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, ShieldAlert, ShieldCheck, PlusCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';

export function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetch admin dashboard which contains recent activity
      const res = await api.getAdminDashboard();
      setLogs(res.recent_activity || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'VULNERABILITY_FLAGGED':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'REVIEW_COMPLETED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'REVIEW_CREATED':
        return <PlusCircle className="w-4 h-4 text-cyan-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Security Audit Trail & Governance Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit timeline recording review actions, vulnerability flags, and sign-offs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition self-start sm:self-auto"
          title="Refresh logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-xs font-mono text-slate-400">
            No audit records captured yet.
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-6 my-2">
            {logs.map((log, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 group-hover:border-slate-700 transition space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {log.action}
                      </span>
                      {log.review_title && (
                        <span className="text-[11px] font-mono text-cyan-400 truncate max-w-xs">
                          • {log.review_title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {log.details}
                  </p>

                  <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    Actor: <strong className="text-slate-300">{log.user_name || 'Automated Engine'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
