import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, SeverityBadge, RatingBadge } from '../common/Badge';
import { 
  CheckSquare, 
  Clock, 
  AlertOctagon, 
  ShieldAlert, 
  ArrowRight, 
  FileCode2, 
  Calendar,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export function ReviewerDashboard({ onSelectReview, onSelectReport }) {
  const { user, isDeveloper } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviewerData = async () => {
    try {
      setLoading(true);
      const res = await api.getReviewerDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load reviewer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewerData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading assigned security audits...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300">
        <p className="font-semibold text-sm">Dashboard Error</p>
        <p className="text-xs mt-1">{error || 'Could not fetch reviewer data.'}</p>
        <button onClick={fetchReviewerData} className="mt-3 px-3 py-1.5 rounded bg-rose-900 text-white text-xs font-mono">
          Retry
        </button>
      </div>
    );
  }

  const { metrics, assigned_reviews, outstanding_issues } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              {isDeveloper ? 'Developer Security Hub' : 'Security Auditor Workspace'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isDeveloper 
              ? 'Track security review status, examine flagged vulnerabilities, and verify code remediations.' 
              : 'Execute systematic code checklists, verify OWASP security controls, and document findings.'}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Assigned Audits</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{metrics.total_assigned}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Reviews in your queue</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-cyan-400">{metrics.in_progress_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Currently being audited</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Completed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.completed_reviews}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Audits finalized</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1422] border border-rose-900/40 bg-rose-950/10">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase text-rose-300 font-semibold">
            <span>Critical Risks</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-rose-400">{metrics.critical_risks}</span>
            <p className="text-[11px] text-rose-300/70 mt-0.5">Requires urgent fix</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>High Severity</span>
            <AlertOctagon className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-orange-400">{metrics.high_risks}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Actionable issues</p>
          </div>
        </div>
      </div>

      {/* Main Content: Assigned Reviews Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            Active Security Reviews
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {assigned_reviews.length} Audits Assigned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assigned_reviews.map((r) => {
            const total = parseInt(r.total_controls, 10) || 34;
            const passed = parseInt(r.passed_controls, 10) || 0;
            const failed = parseInt(r.failed_controls, 10) || 0;
            const reviewed = passed + failed;
            const progressPct = Math.round((reviewed / total) * 100);

            return (
              <div 
                key={r.id} 
                className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusBadge status={r.status} />
                    <RatingBadge rating={r.security_rating} />
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-snug">
                    {r.title}
                  </h3>

                  <div className="mt-2 text-xs font-mono text-cyan-400 flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{r.project_name}</span>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-4">
                    <span>Developer: <strong className="text-slate-300">{r.lead_developer || 'Unassigned'}</strong></span>
                    {r.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Due: {new Date(r.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Review Progress:</span>
                      <span className="text-white font-bold">{progressPct}% ({reviewed}/{total} controls)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${(passed / total) * 100}%` }}
                        title={`${passed} Passed`}
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${(failed / total) * 100}%` }}
                        title={`${failed} Failed`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                      <span className="text-emerald-400">✓ {passed} Passed</span>
                      <span className="text-rose-400">✕ {failed} Failed</span>
                      <span>○ {r.not_reviewed_controls} Pending</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {r.critical_risks > 0 && (
                      <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                        {r.critical_risks} CRITICAL
                      </span>
                    )}
                    {r.high_risks > 0 && (
                      <span className="text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800">
                        {r.high_risks} HIGH
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {r.status === 'completed' && (
                      <button
                        onClick={() => onSelectReport(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono transition"
                      >
                        Audit Report
                      </button>
                    )}
                    <button
                      onClick={() => onSelectReview(r.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
                    >
                      <span>{r.status === 'completed' ? 'Inspect Checklist' : 'Continue Review'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outstanding Critical & High Risks Section */}
      <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Outstanding Critical & High Risk Findings
            </h3>
            <p className="text-xs text-slate-400">
              Vulnerabilities detected across your repositories requiring code remediation
            </p>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800">
            {outstanding_issues.length} Flagged
          </span>
        </div>

        {outstanding_issues.length > 0 ? (
          <div className="space-y-3">
            {outstanding_issues.map((issue) => (
              <div 
                key={issue.id} 
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <SeverityBadge severity={issue.severity} />
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      [{issue.control_id}]
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {issue.requirement}
                    </span>
                    {issue.cwe_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {issue.cwe_id}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {issue.project_name}
                  </span>
                </div>

                {issue.reviewer_notes && (
                  <p className="mt-2 text-xs text-slate-300 pl-2 border-l-2 border-rose-500/70">
                    {issue.reviewer_notes}
                  </p>
                )}

                {issue.evidence && (
                  <div className="mt-2 p-2 rounded bg-black/50 border border-slate-800 font-mono text-[11px] text-rose-300/90 overflow-x-auto">
                    <code>{issue.evidence}</code>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>
                    Location: <strong className="text-slate-300">{issue.file_path || 'Source code'}:{issue.line_number || 'N/A'}</strong>
                  </span>
                  <button
                    onClick={() => onSelectReview(issue.review_id)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Open in Checklist <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs font-mono text-slate-400">
            ✓ No outstanding critical or high severity vulnerabilities found in your assigned reviews.
          </div>
        )}
      </div>
    </div>
  );
}
