import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, SeverityBadge, RatingBadge } from '../common/Badge';
import { 
  Search, 
  Filter, 
  Plus, 
  FolderGit2, 
  ArrowRight, 
  Trash2, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export function ReviewList({ onSelectReview, onSelectReport, onNewReviewClick }) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (projectFilter !== 'all') params.project_id = projectFilter;

      const [revRes, projRes] = await Promise.all([
        api.getReviews(params),
        api.getProjects()
      ]);

      setReviews(revRes.reviews || []);
      setProjects(projRes.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, severityFilter, projectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleDeleteReview = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete review "${title}"? All associated checklist items and audit history will be permanently deleted.`)) {
      return;
    }
    try {
      await api.deleteReview(id);
      fetchReviews();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            Security Code Reviews
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conduct code reviews, inspect security controls, document vulnerability evidence, and generate audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReviews}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh reviews"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={onNewReviewClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-lg shadow-cyan-900/40 transition"
            >
              <Plus className="w-4 h-4" />
              New Security Review
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Search reviews by title, project, or developer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Status: All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Severity Risk Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">Risk: All</option>
            <option value="critical">Critical Risks Only</option>
            <option value="high">High Risks Only</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Project: All</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No Security Reviews Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No code reviews match your search and filter criteria. Create a new security review or reset filters.
            </p>
            {isAdmin && (
              <button
                onClick={onNewReviewClick}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono"
              >
                <Plus className="w-4 h-4" /> Create First Review
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Review & Repository</th>
                  <th className="py-3 px-3">Reviewer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Risks Flagged</th>
                  <th className="py-3 px-3">Security Score</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {reviews.map((r) => {
                  const total = parseInt(r.total_controls, 10) || 34;
                  const passed = parseInt(r.passed_controls, 10) || 0;
                  const failed = parseInt(r.failed_controls, 10) || 0;
                  const reviewed = passed + failed;
                  const progressPct = Math.round((reviewed / total) * 100);

                  return (
                    <tr key={r.id} className="hover:bg-slate-850/40 transition">
                      {/* Title & Project */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs sm:text-sm line-clamp-1">
                          {r.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 mt-0.5">
                          <FolderGit2 className="w-3 h-3 text-slate-500" />
                          <span>{r.project_name}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{r.lead_developer || 'Dev'}</span>
                        </div>
                        {r.technologies && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                            {r.technologies}
                          </div>
                        )}
                      </td>

                      {/* Reviewer */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                            style={{ backgroundColor: r.reviewer_avatar || '#10b981' }}
                          >
                            {r.reviewer_name?.charAt(0) || 'R'}
                          </div>
                          <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                            {r.reviewer_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {reviewed}/{total} checked ({progressPct}%)
                        </div>
                      </td>

                      {/* Risks Flagged */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 font-mono">
                          {r.critical_risks > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              {r.critical_risks} CRITICAL
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">0 Critical</span>
                          )}
                          {r.high_risks > 0 && (
                            <span className="inline-block text-[10px] text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800">
                              {r.high_risks} High Risk
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Score & Rating */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            {Math.round(r.overall_score)}%
                          </span>
                          <RatingBadge rating={r.security_rating} />
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[11px] font-mono text-slate-400">
                        {r.deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(r.deadline).toLocaleDateString()}
                          </div>
                        ) : (
                          'No deadline'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectReview(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium shadow-sm transition flex items-center gap-1"
                          >
                            <span>Workspace</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {r.status === 'completed' && (
                            <button
                              onClick={() => onSelectReport(r.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono transition flex items-center gap-1"
                              title="View Audit Report"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteReview(r.id, r.title)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
