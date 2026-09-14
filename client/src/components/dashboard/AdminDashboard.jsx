import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScoreMeter } from '../common/ScoreMeter';
import { StatusBadge, SeverityBadge, RatingBadge } from '../common/Badge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FolderGit2, 
  ArrowRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';

export function AdminDashboard({ onSelectReview, onSelectReport, onNewReviewClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading AppSec intelligence telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300">
        <p className="font-semibold text-sm">Telemetry Error</p>
        <p className="text-xs mt-1">{error || 'Could not fetch dashboard telemetry.'}</p>
        <button
          onClick={fetchMetrics}
          className="mt-3 px-3 py-1.5 rounded bg-rose-900 text-white text-xs font-mono"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, recent_reviews, failed_categories, recent_activity } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Executive Security Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Software Security Code Review Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time compliance monitoring, vulnerability risk aggregation, and security posture across organizational source repositories.
          </p>
        </div>
        <button
          onClick={onNewReviewClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-lg shadow-cyan-900/40 transition whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Review
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Reviews */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Total Audits</span>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{metrics.total_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {metrics.total_projects} projects</p>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-400">{metrics.pending_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting reviewer</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Active</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-cyan-400">{metrics.in_progress_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Checklists in progress</p>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Completed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.completed_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Reports finalized</p>
          </div>
        </div>

        {/* Critical & High Risks */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-rose-900/40 bg-rose-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase text-rose-300 font-semibold">Critical / High</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-400">{metrics.critical_risks}</span>
              <span className="text-sm font-mono text-orange-400">+{metrics.high_risks} High</span>
            </div>
            <p className="text-[11px] text-rose-300/70 mt-0.5">Active vulnerabilities</p>
          </div>
        </div>

        {/* Average Security Score */}
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Avg Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{metrics.avg_security_score}%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Audit compliance benchmark</p>
          </div>
        </div>
      </div>

      {/* Mid Section: Top Vulnerable Categories + Posture Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top Vulnerable Security Categories */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Top Failed Security Categories
              </h3>
              <p className="text-xs text-slate-400">
                Frequency of failed controls across all code submissions
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              OWASP / CWE Trends
            </span>
          </div>

          <div className="space-y-3.5 mt-4">
            {failed_categories.length > 0 ? (
              failed_categories.map((cat, idx) => {
                const maxVal = Math.max(...failed_categories.map(c => parseInt(c.failed_count, 10)), 1);
                const pct = Math.round((parseInt(cat.failed_count, 10) / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-200">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        {parseInt(cat.critical_count, 10) > 0 && (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                            {cat.critical_count} Critical
                          </span>
                        )}
                        <span className="font-mono text-slate-400">
                          {cat.failed_count} failed
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          parseInt(cat.critical_count, 10) > 0
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                            : 'bg-gradient-to-r from-cyan-500 to-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs font-mono text-slate-400">
                No failed categories recorded. All active controls comply with baseline.
              </div>
            )}
          </div>
        </div>

        {/* Right: Security Posture Summary Card */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Global Security Health Posture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Weighted composite rating
            </p>
          </div>

          <div className="py-6 flex justify-center">
            <ScoreMeter 
              score={metrics.avg_security_score} 
              rating={metrics.critical_risks > 0 ? 'Critical Risk Identified' : (metrics.avg_security_score >= 85 ? 'Healthy Compliance' : 'Review in Progress')} 
              size="lg" 
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Critical Severity Items:</span>
              <strong className="text-rose-400 font-mono">{metrics.critical_risks}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>High Severity Items:</span>
              <strong className="text-orange-400 font-mono">{metrics.high_risks}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Completed Audits:</span>
              <strong className="text-emerald-400 font-mono">{metrics.completed_reviews}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Reviews & Live Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Security Reviews */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Recent Security Reviews
              </h3>
              <p className="text-xs text-slate-400">
                Latest code audits requiring action or completed
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="pb-3 pl-1">Review Title & Project</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Risks</th>
                  <th className="pb-3 px-2">Score</th>
                  <th className="pb-3 pr-1 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {recent_reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 pl-1">
                      <div className="font-medium text-slate-200 line-clamp-1">{r.title}</div>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5">
                        <FolderGit2 className="w-3 h-3 text-slate-500" />
                        {r.project_name} • {r.lead_developer || 'Unassigned'}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 font-mono">
                        {r.critical_risks > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                            {r.critical_risks} Crit
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">0 Crit</span>
                        )}
                        {r.high_risks > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800">
                            {r.high_risks} H
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <RatingBadge rating={r.security_rating} />
                    </td>
                    <td className="py-3 pr-1 text-right space-x-2">
                      <button
                        onClick={() => onSelectReview(r.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition inline-flex items-center gap-1"
                      >
                        Workspace <ArrowRight className="w-3 h-3" />
                      </button>
                      {r.status === 'completed' && (
                        <button
                          onClick={() => onSelectReport(r.id)}
                          className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono transition"
                        >
                          Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Activity Feed */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Security Audit Activity
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Live Log</span>
          </div>

          <div className="space-y-3">
            {recent_activity.slice(0, 6).map((act, i) => (
              <div key={i} className="flex gap-2.5 text-xs pb-2.5 border-b border-slate-800/60 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-semibold text-slate-300 text-[11px] truncate">
                      {act.action}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                    {act.details}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    by {act.user_name || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
