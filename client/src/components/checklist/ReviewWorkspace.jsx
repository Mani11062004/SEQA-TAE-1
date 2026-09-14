import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { ScoreMeter } from '../common/ScoreMeter';
import { SeverityBadge, StatusBadge, RatingBadge, ControlStatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  FileCode, 
  Search, 
  Filter, 
  Save, 
  Download, 
  FileText, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  FolderGit2,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';

export function ReviewWorkspace({ reviewId, onBack, onSelectReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingItemIds, setSavingItemIds] = useState(new Set());
  const [savedItemIds, setSavedItemIds] = useState(new Set());

  // Category selection & Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded code example accordions
  const [expandedCodeIds, setExpandedCodeIds] = useState(new Set());

  // Completion modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [completing, setCompleting] = useState(false);

  // Copy code feedback
  const [copiedMap, setCopiedMap] = useState({});

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await api.getReviewById(reviewId);
      setData(res);
      setExecutiveSummary(res.review.executive_summary || '');
      setRecommendations(res.review.recommendations || '');
    } catch (err) {
      setError(err.message || 'Failed to fetch review workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  const handleUpdateItem = async (itemId, fields) => {
    setSavingItemIds(prev => new Set(prev).add(itemId));

    // Optimistic UI update
    setData(prev => {
      if (!prev) return prev;
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...fields };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });

    try {
      const res = await api.updateReviewItem(reviewId, itemId, fields);
      
      // Update with server recalculated values
      setData(prev => {
        if (!prev) return prev;
        const updatedItems = (prev.items || []).map(item => {
          if (item.id === itemId) {
            return { ...item, ...(res?.item || fields) };
          }
          return item;
        });

        // Update category counters
        const catMap = {};
        for (const it of updatedItems) {
          if (!catMap[it.category]) catMap[it.category] = [];
          catMap[it.category].push(it);
        }
        const updatedCategories = Object.keys(catMap).map(categoryName => ({
          category: categoryName,
          items: catMap[categoryName],
          total: catMap[categoryName].length,
          passed: catMap[categoryName].filter(i => i.status === 'pass').length,
          failed: catMap[categoryName].filter(i => i.status === 'fail').length,
          not_reviewed: catMap[categoryName].filter(i => i.status === 'not_reviewed').length,
          critical_risks: catMap[categoryName].filter(i => i.status === 'fail' && i.severity === 'critical').length,
          high_risks: catMap[categoryName].filter(i => i.status === 'fail' && i.severity === 'high').length
        }));

        const safeReview = res?.review
          ? { ...(prev.review || {}), ...res.review }
          : (res?.metrics ? { ...(prev.review || {}), ...res.metrics } : (prev.review || {}));

        return {
          ...prev,
          review: safeReview,
          items: updatedItems,
          categories: updatedCategories
        };
      });

      // Show temporary saved indicator
      setSavedItemIds(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setSavedItemIds(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error('Update item failed:', err);
    } finally {
      setSavingItemIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleBulkPass = async (category) => {
    try {
      await api.bulkUpdateReviewItems(reviewId, {
        category,
        targetStatus: 'pass',
        onlyNotReviewed: true
      });
      await fetchReview();
    } catch (err) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  const handlePassAllLow = async () => {
    try {
      await api.bulkUpdateReviewItems(reviewId, {
        category: 'all',
        targetStatus: 'pass',
        onlyNotReviewed: true
      });
      await fetchReview();
    } catch (err) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  const handleFinalizeReview = async () => {
    setCompleting(true);
    try {
      await api.updateReviewStatus(reviewId, {
        status: 'completed',
        executive_summary: executiveSummary,
        recommendations: recommendations
      });
      
      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsCompleteModalOpen(false);
      await fetchReview();
    } catch (err) {
      alert(`Completion failed: ${err.message}`);
    } finally {
      setCompleting(false);
    }
  };

  const toggleCodeSnippet = (id) => {
    setExpandedCodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyCode = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading interactive review workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300">
        <p className="font-semibold text-sm">Review Error</p>
        <p className="text-xs mt-1">{error || 'Review could not be loaded.'}</p>
        <button onClick={onBack} className="mt-3 px-3 py-1.5 rounded bg-slate-800 text-white text-xs font-mono">
          ← Back to Reviews
        </button>
      </div>
    );
  }

  const review = data?.review || {};
  const categories = data?.categories || [];
  const items = data?.items || [];

  // Filtered items
  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inReq = item.requirement.toLowerCase().includes(q);
      const inExpl = item.explanation.toLowerCase().includes(q);
      const inCwe = (item.cwe_id || '').toLowerCase().includes(q);
      const inCtrl = item.control_id.toLowerCase().includes(q);
      if (!inReq && !inExpl && !inCwe && !inCtrl) return false;
    }
    return true;
  });

  const totalControls = items.length;
  const passedCount = items.filter(i => i.status === 'pass').length;
  const failedCount = items.filter(i => i.status === 'fail').length;
  const notReviewedCount = items.filter(i => i.status === 'not_reviewed').length;
  const reviewedCount = passedCount + failedCount;
  const progressPct = Math.round((reviewedCount / totalControls) * 100);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review List
        </button>

        <div className="flex items-center gap-2">
          {review.status === 'completed' && (
            <button
              onClick={() => onSelectReport(review.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono transition"
            >
              <FileText className="w-3.5 h-3.5" />
              View Security Report
            </button>
          )}

          <button
            onClick={() => setIsCompleteModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-medium shadow-md transition ${
              review.status === 'completed'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {review.status === 'completed' ? 'Edit Audit Summary' : 'Complete & Finalize Audit'}
          </button>
        </div>
      </div>

      {/* Sticky Header Telemetry Card */}
      <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Review Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <StatusBadge status={review.status} />
              <RatingBadge rating={review.security_rating} />
              {review.critical_risks > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-xs font-mono font-bold border border-rose-800 animate-pulse">
                  ⚠ {review.critical_risks} CRITICAL VULNERABILITIES
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {review.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                {review.project_name}
              </span>
              <span>Developer: <strong className="text-slate-300">{review.lead_developer || 'Unassigned'}</strong></span>
              <span>Auditor: <strong className="text-slate-300">{review.reviewer_name || 'Unassigned'}</strong></span>
              {review.deadline && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  Due: {new Date(review.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Security Score Gauge */}
          <div className="flex items-center gap-6 self-center lg:self-auto pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0">
            <ScoreMeter 
              score={review.overall_score} 
              rating={review.security_rating} 
              size="md" 
              showLabel={false} 
            />

            {/* Controls Count Stats */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="text-slate-400">Controls Audited:</span>
                <strong className="text-white">{reviewedCount} / {totalControls} ({progressPct}%)</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400">✓ Passed:</span>
                <strong className="text-emerald-400">{passedCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-rose-400">✕ Failed (Risks):</span>
                <strong className="text-rose-400">{failedCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-400">
                <span>○ Not Reviewed:</span>
                <span>{notReviewedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(passedCount / totalControls) * 100}%` }}
              title={`${passedCount} Passed`}
            />
            <div 
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${(failedCount / totalControls) * 100}%` }}
              title={`${failedCount} Failed`}
            />
          </div>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            12 Security Checklist Categories
          </p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleBulkPass(selectedCategory)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Mark All Unreviewed in Category as Passed
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition border ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All Categories ({totalControls})
          </button>

          {categories.map(cat => {
            const hasFailed = cat.failed > 0;
            const hasCritical = cat.critical_risks > 0;
            const isCompleted = cat.not_reviewed === 0;

            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition border flex items-center gap-1.5 ${
                  selectedCategory === cat.category
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{cat.category}</span>
                {hasCritical ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Critical finding"></span>
                ) : hasFailed ? (
                  <span className="w-2 h-2 rounded-full bg-orange-500" title="Failed finding"></span>
                ) : isCompleted ? (
                  <span className="text-[10px] text-emerald-400">✓</span>
                ) : null}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({cat.passed}/{cat.total})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search requirements, CWE codes (e.g. CWE-79, CWE-89), or controls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Status & Severity */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Status: All</option>
            <option value="pass">✓ Passed</option>
            <option value="fail">✕ Failed (Risks)</option>
            <option value="not_reviewed">○ Not Reviewed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Controls List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0e1422] border border-slate-800 text-slate-400 font-mono text-xs">
            No security controls match the active filters.
          </div>
        ) : (
          filteredItems.map(item => {
            const isSaving = savingItemIds.has(item.id);
            const isSaved = savedItemIds.has(item.id);
            const isCodeExpanded = expandedCodeIds.has(item.id);

            return (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl bg-[#0e1422] border transition ${
                  item.status === 'fail' 
                    ? 'border-rose-900/60 bg-rose-950/5 shadow-md shadow-rose-950/20' 
                    : item.status === 'pass'
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Control Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      {item.control_id}
                    </span>
                    <SeverityBadge severity={item.severity} />
                    {item.cwe_id && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.cwe_id}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.category} • Weight: {item.weight}
                    </span>
                  </div>

                  {/* Interactive Status Selector (Pass, Fail, Not Reviewed) */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { status: 'pass' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                        item.status === 'pass'
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                          : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Pass
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { status: 'fail' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                        item.status === 'fail'
                          ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950 animate-pulse'
                          : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Fail
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { status: 'not_reviewed' })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                        item.status === 'not_reviewed'
                          ? 'bg-slate-800 text-slate-200'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Requirement & Explanation */}
                <div className="mt-3 space-y-1">
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    {item.requirement}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>

                {/* Collapsible Secure vs Vulnerable Code Reference */}
                {(item.code_example_vulnerable || item.code_example_safe) && (
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleCodeSnippet(item.id)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{isCodeExpanded ? 'Hide Code Reference & Remediation Guidance' : 'View Vulnerable vs Secure Code Pattern & CWE Remediation'}</span>
                      {isCodeExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isCodeExpanded && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        {/* Remediation Guide */}
                        {item.remediation && (
                          <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
                            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-cyan-300 font-mono">AppSec Remediation Rule: </strong>
                              {item.remediation}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                          {/* Vulnerable Example */}
                          {item.code_example_vulnerable && (
                            <div className="rounded-lg bg-rose-950/20 border border-rose-900/50 p-3 space-y-1.5">
                              <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
                                <span>✕ Vulnerable Pattern</span>
                                <button
                                  type="button"
                                  onClick={() => copyCode(item.code_example_vulnerable, `vuln_${item.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                  {copiedMap[`vuln_${item.id}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedMap[`vuln_${item.id}`] ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <pre className="text-rose-200/90 overflow-x-auto whitespace-pre p-2 bg-black/60 rounded">
                                {item.code_example_vulnerable}
                              </pre>
                            </div>
                          )}

                          {/* Safe Example */}
                          {item.code_example_safe && (
                            <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/50 p-3 space-y-1.5">
                              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                                <span>✓ Compliant / Secure Pattern</span>
                                <button
                                  type="button"
                                  onClick={() => copyCode(item.code_example_safe, `safe_${item.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                  {copiedMap[`safe_${item.id}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedMap[`safe_${item.id}`] ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <pre className="text-emerald-200/90 overflow-x-auto whitespace-pre p-2 bg-black/60 rounded">
                                {item.code_example_safe}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Finding & Evidence Logging Form */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left: Notes & Remediation */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Reviewer Observations & Notes:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Add review findings, verification steps, or architectural rationale..."
                        defaultValue={item.reviewer_notes || ''}
                        onBlur={(e) => handleUpdateItem(item.id, { reviewer_notes: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Remediation Action Required:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Replace raw query with parameterized statement in db service"
                        defaultValue={item.remediation || ''}
                        onBlur={(e) => handleUpdateItem(item.id, { remediation: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Right: Code Evidence & File Location */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Affected File Path:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. src/api/user.routes.js"
                          defaultValue={item.file_path || ''}
                          onBlur={(e) => handleUpdateItem(item.id, { file_path: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Line Numbers:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 42-48"
                          defaultValue={item.line_number || ''}
                          onBlur={(e) => handleUpdateItem(item.id, { line_number: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Code Evidence / Vulnerability Snippet:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Paste vulnerable code snippet or HTTP request proof-of-concept..."
                        defaultValue={item.evidence || ''}
                        onBlur={(e) => handleUpdateItem(item.id, { evidence: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-rose-300/90 focus:outline-none focus:border-rose-500 font-mono resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-save status feedback */}
                <div className="mt-2 flex items-center justify-end text-[10px] font-mono">
                  {isSaving ? (
                    <span className="text-cyan-400 flex items-center gap-1 animate-pulse">
                      <Save className="w-3 h-3" /> Auto-saving changes...
                    </span>
                  ) : isSaved ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Control updated & score recalculated
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Changes auto-save on blur
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completion & Executive Summary Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Finalize Security Audit & Generate Report"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase">Calculated Security Posture</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-black font-mono text-white">
                  {Math.round(review.overall_score)}%
                </span>
                <RatingBadge rating={review.security_rating} />
              </div>
            </div>
            <div className="text-right text-xs font-mono space-y-0.5">
              <p className="text-emerald-400">✓ {passedCount} Passed Controls</p>
              <p className="text-rose-400">✕ {failedCount} Failed Risks</p>
              <p className="text-slate-400">○ {notReviewedCount} Unreviewed</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Executive Audit Summary:
            </label>
            <textarea
              rows={4}
              required
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Provide a high-level summary of the code review findings, systemic patterns, and overall architectural readiness..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Recommended Remediation Roadmap:
            </label>
            <textarea
              rows={4}
              required
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="1. Critical patch priorities before deployment...&#10;2. Security configuration enhancements...&#10;3. CI/CD automated SAST/DAST integration..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={completing}
              onClick={handleFinalizeReview}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium shadow-lg shadow-emerald-950 transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {completing ? 'Finalizing Audit...' : 'Mark as Completed & Generate Audit Report'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
